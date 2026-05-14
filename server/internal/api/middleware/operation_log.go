package middleware

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// ResponseWriter 用于捕获响应
type ResponseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w ResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// OperationLogger 操作日志中间件
func OperationLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		var requestBody string
		if c.Request.Body != nil {
			bodyBytes, err := ioutil.ReadAll(c.Request.Body)
			if err == nil {
				requestBody = string(bodyBytes)
				c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
			}
		}

		writer := &ResponseWriter{
			ResponseWriter: c.Writer,
			body:           bytes.NewBufferString(""),
		}
		c.Writer = writer

		c.Next()

		duration := time.Since(startTime)

		userID := c.GetInt("userID")
		username := c.GetString("username")
		if username == "" {
			username = "anonymous"
		}

		module := extractModule(c.Request.URL.Path)
		operation := extractOperation(c.Request.Method)
		ipAddress := c.ClientIP()
		userAgent := c.Request.UserAgent()
		responseBody := writer.body.String()

		go saveOperationLog(&model.SysOperationLog{
			UserID:      int64(userID),
			Username:    username,
			Operation:   operation,
			Module:      module,
			RequestData: requestBody,
			Response:    responseBody,
			IPAddress:   ipAddress,
			UserAgent:   userAgent,
			CreatedAt:   startTime,
		})

		logrus.WithFields(logrus.Fields{
			"user_id":     userID,
			"username":    username,
			"method":      c.Request.Method,
			"path":        c.Request.URL.Path,
			"status":      c.Writer.Status(),
			"duration_ms": duration.Milliseconds(),
			"ip":          ipAddress,
		}).Info("操作日志")
	}
}

func extractModule(path string) string {
	path = strings.TrimPrefix(path, "/api")
	path = strings.TrimPrefix(path, "/v1")

	parts := strings.Split(path, "/")
	if len(parts) >= 2 {
		return parts[1]
	}
	return "unknown"
}

func extractOperation(method string) string {
	switch method {
	case http.MethodGet:
		return "QUERY"
	case http.MethodPost:
		return "CREATE"
	case http.MethodPut:
		return "UPDATE"
	case http.MethodPatch:
		return "UPDATE"
	case http.MethodDelete:
		return "DELETE"
	default:
		return "OTHER"
	}
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

func formatJSONField(s string, maxLen int, isJSONB bool) string {
	if s == "" {
		return s
	}

	s = truncateString(s, maxLen)

	var jsonData interface{}
	if err := json.Unmarshal([]byte(s), &jsonData); err == nil {
		if containsUnescapedNestedJSON(s) {
			encoded, _ := json.Marshal(s)
			if len(encoded) <= maxLen {
				return string(encoded)
			}
			encoded, _ = json.Marshal(truncateString(s, maxLen-len(`""`)))
			return string(encoded)
		}

		if isJSONB {
			formatted, _ := json.Marshal(jsonData)
			if len(formatted) <= maxLen {
				return string(formatted)
			}
			truncated, _ := json.Marshal(truncateString(string(formatted), maxLen))
			return string(truncated)
		}
		formatted, _ := json.MarshalIndent(jsonData, "", "  ")
		if len(formatted) <= maxLen {
			return string(formatted)
		}
		return truncateString(string(formatted), maxLen)
	}

	encoded, _ := json.Marshal(s)
	if len(encoded) <= maxLen {
		return string(encoded)
	}
	encoded, _ = json.Marshal(truncateString(s, maxLen-len(`""`)))
	return string(encoded)
}

func containsUnescapedNestedJSON(s string) bool {
	inString := false
	escape := false
	nestedBraceCount := 0

	for _, c := range s {
		if escape {
			escape = false
			continue
		}

		if c == '\\' {
			escape = true
			continue
		}

		if c == '"' {
			inString = !inString
			continue
		}

		if inString {
			if c == '{' {
				nestedBraceCount++
			} else if c == '}' {
				nestedBraceCount--
			}
		}
	}

	return nestedBraceCount != 0
}

func saveOperationLog(log *model.SysOperationLog) {
	log.RequestData = formatJSONField(log.RequestData, 65535, true)
	log.Response = formatJSONField(log.Response, 65535, false)

	if err := db.GetDB().Create(log).Error; err != nil {
		logrus.WithError(err).Error("保存操作日志失败")
	}
}