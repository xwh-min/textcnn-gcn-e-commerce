package handlers

import (
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// OperationLogResponse 操作日志响应
type OperationLogResponse struct {
	ID          int64  `json:"id"`
	UserID      int64  `json:"user_id"`
	Username    string `json:"username"`
	Operation   string `json:"operation"`
	Module      string `json:"module"`
	RequestData string `json:"request_data"`
	Response    string `json:"response"`
	IPAddress   string `json:"ip_address"`
	UserAgent   string `json:"user_agent"`
	CreatedAt   string `json:"created_at"`
}

// OperationLogListResponse 操作日志列表响应
type OperationLogListResponse struct {
	Code    int                     `json:"code"`
	Message string                  `json:"message"`
	Data    []OperationLogResponse  `json:"data"`
	Total   int64                   `json:"total"`
}

// OperationLogDetailResponse 操作日志详情响应
type OperationLogDetailResponse struct {
	Code    int                      `json:"code"`
	Message string                   `json:"message"`
	Data    *OperationLogResponse    `json:"data"`
}

// GetOperationLogList 获取操作日志列表
func GetOperationLogList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	username := c.Query("username")
	module := c.Query("module")
	operation := c.Query("operation")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := db.GetDB().Model(&model.SysOperationLog{})

	if username != "" {
		query = query.Where("username = ?", username)
	}
	if module != "" {
		query = query.Where("module = ?", module)
	}
	if operation != "" {
		query = query.Where("operation = ?", operation)
	}
	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	var logs []model.SysOperationLog
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		logrus.WithError(err).Error("获取操作日志列表失败")
		c.JSON(http.StatusInternalServerError, OperationLogListResponse{
			Code:    500,
			Message: "获取操作日志列表失败",
		})
		return
	}

	data := make([]OperationLogResponse, len(logs))
	for i, log := range logs {
		data[i] = *logToResponse(&log)
	}

	c.JSON(http.StatusOK, OperationLogListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetOperationLogDetail 获取操作日志详情
func GetOperationLogDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的日志 ID",
		})
		return
	}

	var log model.SysOperationLog
	if err := db.GetDB().First(&log, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "日志不存在",
			})
			return
		}
		logrus.WithError(err).Error("获取操作日志详情失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取操作日志详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, OperationLogDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    logToResponse(&log),
	})
}

func logToResponse(log *model.SysOperationLog) *OperationLogResponse {
	return &OperationLogResponse{
		ID:          log.ID,
		UserID:      log.UserID,
		Username:    log.Username,
		Operation:   log.Operation,
		Module:      log.Module,
		RequestData: log.RequestData,
		Response:    log.Response,
		IPAddress:   log.IPAddress,
		UserAgent:   log.UserAgent,
		CreatedAt:   log.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}
