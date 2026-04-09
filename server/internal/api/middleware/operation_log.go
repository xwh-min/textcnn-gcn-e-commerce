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
		// 记录开始时间
		startTime := time.Now()

		// 获取请求体
		var requestBody string
		if c.Request.Body != nil {
			bodyBytes, err := ioutil.ReadAll(c.Request.Body)
			if err == nil {
				requestBody = string(bodyBytes)
				// 重新写入请求体，以便后续 handler 可以读取
				c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))
			}
		}

		// 创建响应捕获器
		writer := &ResponseWriter{
			ResponseWriter: c.Writer,
			body:           bytes.NewBufferString(""),
		}
		c.Writer = writer

		// 处理请求
		c.Next()

		// 计算处理时间
		duration := time.Since(startTime)

		// 获取用户信息
		userID := c.GetInt("userID")
		username := c.GetString("username")
		if username == "" {
			username = "anonymous"
		}

		// 提取模块信息
		module := extractModule(c.Request.URL.Path)

		// 提取操作类型
		operation := extractOperation(c.Request.Method)

		// 获取 IP 地址
		ipAddress := c.ClientIP()

		// 获取 User-Agent
		userAgent := c.Request.UserAgent()

		// 获取响应体
		responseBody := writer.body.String()

		// 异步保存日志
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

		// 记录日志
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

// extractModule 从路径中提取模块名
func extractModule(path string) string {
	// 移除前缀
	path = strings.TrimPrefix(path, "/api")
	path = strings.TrimPrefix(path, "/v1")
	
	parts := strings.Split(path, "/")
	if len(parts) >= 2 {
		return parts[1]
	}
	return "unknown"
}

// extractOperation 从 HTTP 方法中提取操作类型
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

// saveOperationLog 保存操作日志到数据库
func saveOperationLog(log *model.SysOperationLog) {
	// 格式化请求数据为 JSON
	if log.RequestData != "" {
		var jsonData interface{}
		if err := json.Unmarshal([]byte(log.RequestData), &jsonData); err == nil {
			formatted, _ := json.Marshal(jsonData)
			log.RequestData = string(formatted)
		}
	}

	// 格式化响应数据为 JSON
	if log.Response != "" {
		var jsonData interface{}
		if err := json.Unmarshal([]byte(log.Response), &jsonData); err == nil {
			formatted, _ := json.MarshalIndent(jsonData, "", "  ")
			log.Response = string(formatted)
		}
	}

	// 限制长度
	if len(log.RequestData) > 65535 {
		log.RequestData = log.RequestData[:65535]
	}
	if len(log.Response) > 65535 {
		log.Response = log.Response[:65535]
	}

	if err := db.GetDB().Create(log).Error; err != nil {
		logrus.WithError(err).Error("保存操作日志失败")
	}
}
