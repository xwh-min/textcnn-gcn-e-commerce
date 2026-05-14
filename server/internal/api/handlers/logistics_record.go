package handlers

import (
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateLogisticsRecordRequest 创建物流记录请求
type CreateLogisticsRecordRequest struct {
	OrderID           int64     `json:"order_id" binding:"required"`
	LogisticsProviderID int64     `json:"logistics_provider_id" binding:"required"`
	TrackingNo        string    `json:"tracking_no" binding:"required"`
	CustomsID         int64     `json:"customs_id"`
	Status            string    `json:"status"`
	ShippedDate       time.Time `json:"shipped_date"`
	ClearedDate       time.Time `json:"cleared_date"`
	DelayedDays       int       `json:"delayed_days"`
	ExtraInfo         string    `json:"extra_info"`
}

// UpdateLogisticsRecordRequest 更新物流记录请求
type UpdateLogisticsRecordRequest struct {
	Status      string    `json:"status"`
	ShippedDate time.Time `json:"shipped_date"`
	ClearedDate time.Time `json:"cleared_date"`
	DelayedDays int       `json:"delayed_days"`
	ExtraInfo   string    `json:"extra_info"`
}

// LogisticsRecordResponse 物流记录响应
type LogisticsRecordResponse struct {
	ID                int64         `json:"id"`
	OrderID           int64         `json:"order_id"`
	LogisticsProviderID int64       `json:"logistics_provider_id"`
	TrackingNo        string        `json:"tracking_no"`
	CustomsID         int64         `json:"customs_id"`
	Status            string        `json:"status"`
	ShippedDate       time.Time     `json:"shipped_date"`
	ClearedDate       time.Time     `json:"cleared_date"`
	DelayedDays       int           `json:"delayed_days"`
	ExtraInfo         string        `json:"extra_info"`
	CreatedAt         time.Time     `json:"created_at"`
	CompanyName       string        `json:"company_name"`
	ProviderName      string        `json:"provider_name"`
	Origin            string        `json:"origin"`
	Destination       string        `json:"destination"`
	// 关联的订单信息
	Order             *OrderInfo    `json:"order,omitempty"`
	// 关联的物流商信息
	LogisticsProvider *LogisticsInfo `json:"logistics_provider,omitempty"`
	// 关联的海关信息
	Customs           *CustomsInfo  `json:"customs,omitempty"`
}

// OrderInfo 订单信息（简化版）
type OrderInfo struct {
	ID       int64  `json:"id"`
	OrderNo  string `json:"order_no"`
	CompanyID int64 `json:"company_id"`
}

// CustomsInfo 海关信息（简化版）
type CustomsInfo struct {
	ID           int64  `json:"id"`
	CustomsName  string `json:"customs_name"`
	CustomsCode  string `json:"customs_code"`
}

// LogisticsRecordListResponse 物流记录列表响应
type LogisticsRecordListResponse struct {
	Code    int                        `json:"code"`
	Message string                     `json:"message"`
	Data    []LogisticsRecordResponse  `json:"data"`
	Total   int64                      `json:"total"`
}

// LogisticsRecordDetailResponse 物流记录详情响应
type LogisticsRecordDetailResponse struct {
	Code    int                       `json:"code"`
	Message string                    `json:"message"`
	Data    *LogisticsRecordResponse  `json:"data"`
}

// CreateLogisticsRecord 创建物流记录
func CreateLogisticsRecord(c *gin.Context) {
	var req CreateLogisticsRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	// 校验订单是否存在
	var order model.OrderData
	if err := db.GetDB().First(&order, req.OrderID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "关联订单不存在",
		})
		return
	}

	// 校验物流商是否存在
	var provider model.LogisticsProvider
	if err := db.GetDB().First(&provider, req.LogisticsProviderID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "物流商不存在",
		})
		return
	}

	// 校验海关是否存在（如果提供了）
	if req.CustomsID != 0 {
		var customs model.Customs
		if err := db.GetDB().First(&customs, req.CustomsID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "海关不存在",
			})
			return
		}
	}

	logistics := model.LogisticsRecord{
		OrderID:           req.OrderID,
		LogisticsProviderID: req.LogisticsProviderID,
		TrackingNo:        req.TrackingNo,
		CustomsID:         req.CustomsID,
		Status:            req.Status,
		ShippedDate:       req.ShippedDate,
		ClearedDate:       req.ClearedDate,
		DelayedDays:       req.DelayedDays,
		ExtraInfo:         req.ExtraInfo,
	}

	if err := db.GetDB().Create(&logistics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建物流记录失败：" + err.Error(),
		})
		return
	}

	resp := logisticsRecordToResponse(&logistics)
	loadOrderInfo(resp)
	loadLogisticsProviderInfoForRecord(resp)
	if logistics.CustomsID != 0 {
		loadCustomsInfo(resp)
	}

	c.JSON(http.StatusOK, LogisticsRecordDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    resp,
	})
}

// GetLogisticsRecordList 获取物流记录列表
func GetLogisticsRecordList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	orderID := c.Query("order_id")
	logisticsProviderID := c.Query("logistics_provider_id")
	customsID := c.Query("customs_id")
	status := c.Query("status")

	query := db.GetDB().Model(&model.LogisticsRecord{})

	if orderID != "" {
		query = query.Where("order_id = ?", orderID)
	}
	if logisticsProviderID != "" {
		query = query.Where("logistics_provider_id = ?", logisticsProviderID)
	}
	if customsID != "" {
		query = query.Where("customs_id = ?", customsID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var logisticsList []model.LogisticsRecord
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&logisticsList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, LogisticsRecordListResponse{
			Code:    500,
			Message: "获取物流记录列表失败",
		})
		return
	}

	data := make([]LogisticsRecordResponse, len(logisticsList))
	for i, logistics := range logisticsList {
		resp := logisticsRecordToResponse(&logistics)
		loadOrderInfo(resp)
		loadLogisticsProviderInfoForRecord(resp)
		if logistics.CustomsID != 0 {
			loadCustomsInfo(resp)
		}
		data[i] = *resp
	}

	c.JSON(http.StatusOK, LogisticsRecordListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetLogisticsRecordDetail 获取物流记录详情
func GetLogisticsRecordDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流记录 ID",
		})
		return
	}

	var logistics model.LogisticsRecord
	if err := db.GetDB().First(&logistics, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "物流记录不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取物流记录详情失败",
		})
		return
	}

	resp := logisticsRecordToResponse(&logistics)
	loadOrderInfo(resp)
	loadLogisticsProviderInfoForRecord(resp)
	if logistics.CustomsID != 0 {
		loadCustomsInfo(resp)
	}

	c.JSON(http.StatusOK, LogisticsRecordDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    resp,
	})
}

// UpdateLogisticsRecord 更新物流记录
func UpdateLogisticsRecord(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流记录 ID",
		})
		return
	}

	var req UpdateLogisticsRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var logistics model.LogisticsRecord
	if err := db.GetDB().First(&logistics, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "物流记录不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新物流记录失败",
		})
		return
	}

	// 更新字段
	if req.Status != "" {
		logistics.Status = req.Status
	}
	if !req.ShippedDate.IsZero() {
		logistics.ShippedDate = req.ShippedDate
	}
	if !req.ClearedDate.IsZero() {
		logistics.ClearedDate = req.ClearedDate
	}
	if req.DelayedDays > 0 {
		logistics.DelayedDays = req.DelayedDays
	}
	if req.ExtraInfo != "" {
		logistics.ExtraInfo = req.ExtraInfo
	}

	if err := db.GetDB().Save(&logistics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新物流记录失败：" + err.Error(),
		})
		return
	}

	resp := logisticsRecordToResponse(&logistics)
	loadOrderInfo(resp)
	loadLogisticsProviderInfoForRecord(resp)
	if logistics.CustomsID != 0 {
		loadCustomsInfo(resp)
	}

	c.JSON(http.StatusOK, LogisticsRecordDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    resp,
	})
}

// DeleteLogisticsRecord 删除物流记录
func DeleteLogisticsRecord(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流记录 ID",
		})
		return
	}

	if err := db.GetDB().Delete(&model.LogisticsRecord{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除物流记录失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func logisticsRecordToResponse(logistics *model.LogisticsRecord) *LogisticsRecordResponse {
	return &LogisticsRecordResponse{
		ID:                logistics.ID,
		OrderID:           logistics.OrderID,
		LogisticsProviderID: logistics.LogisticsProviderID,
		TrackingNo:        logistics.TrackingNo,
		CustomsID:         logistics.CustomsID,
		Status:            logistics.Status,
		ShippedDate:       logistics.ShippedDate,
		ClearedDate:       logistics.ClearedDate,
		DelayedDays:       logistics.DelayedDays,
		ExtraInfo:         logistics.ExtraInfo,
		CreatedAt:         logistics.CreatedAt,
		CompanyName:       "",
		ProviderName:      "",
		Origin:            "中国",
		Destination:       "",
	}
}

func loadOrderInfo(resp *LogisticsRecordResponse) {
	if resp.OrderID == 0 {
		return
	}
	
	var order model.OrderData
	if err := db.GetDB().First(&order, resp.OrderID).Error; err == nil {
		resp.Order = &OrderInfo{
			ID:       order.ID,
			OrderNo:  order.OrderNo,
			CompanyID: order.CompanyID,
		}
		resp.Destination = order.DestinationCountry
		
		var company model.EcoCompany
		if err := db.GetDB().First(&company, order.CompanyID).Error; err == nil {
			resp.CompanyName = company.CompanyName
		}
	}
}

func loadLogisticsProviderInfoForRecord(resp *LogisticsRecordResponse) {
	if resp.LogisticsProviderID == 0 {
		return
	}
	
	var provider model.LogisticsProvider
	if err := db.GetDB().First(&provider, resp.LogisticsProviderID).Error; err == nil {
		resp.ProviderName = provider.ProviderName
		resp.LogisticsProvider = &LogisticsInfo{
			ID:                provider.ID,
			ProviderName:      provider.ProviderName,
			BusinessLicenseNo: provider.BusinessLicenseNo,
		}
	}
}

func loadCustomsInfo(resp *LogisticsRecordResponse) {
	if resp.CustomsID == 0 {
		return
	}
	
	var customs model.Customs
	if err := db.GetDB().First(&customs, resp.CustomsID).Error; err == nil {
		resp.Customs = &CustomsInfo{
			ID:          customs.ID,
			CustomsName: customs.CustomsName,
			CustomsCode: customs.CustomsCode,
		}
	}
}
