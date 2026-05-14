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

// CreateOrderRequest 创建订单请求
type CreateOrderRequest struct {
	CompanyID         int64     `json:"company_id" binding:"required"`
	OrderNo           string    `json:"order_no" binding:"required"`
	ProductName       string    `json:"product_name"`
	Quantity          int       `json:"quantity"`
	OrderAmount       float64   `json:"order_amount" binding:"required,min:0"`
	Currency          string    `json:"currency"`
	DestinationCountry string    `json:"destination_country"`
	LogisticsProviderID int64     `json:"logistics_provider_id"`
	OrderDate         time.Time `json:"order_date" binding:"required"`
	PaymentStatus     string    `json:"payment_status"`
	ExtraInfo         string    `json:"extra_info"`
}

// UpdateOrderRequest 更新订单请求
type UpdateOrderRequest struct {
	ProductName       string    `json:"product_name"`
	Quantity          int       `json:"quantity"`
	OrderAmount       float64   `json:"order_amount"`
	Currency          string    `json:"currency"`
	DestinationCountry string    `json:"destination_country"`
	LogisticsProviderID int64     `json:"logistics_provider_id"`
	PaymentStatus     string    `json:"payment_status"`
	ExtraInfo         string    `json:"extra_info"`
}

// OrderResponse 订单响应
type OrderResponse struct {
	ID                 int64         `json:"id"`
	CompanyID          int64         `json:"company_id"`
	OrderNo            string        `json:"order_no"`
	ProductName        string        `json:"product_name"`
	Quantity           int           `json:"quantity"`
	OrderAmount        float64       `json:"order_amount"`
	Currency           string        `json:"currency"`
	DestinationCountry string        `json:"destination_country"`
	LogisticsProviderID int64        `json:"logistics_provider_id"`
	OrderDate          time.Time     `json:"order_date"`
	PaymentStatus      string        `json:"payment_status"`
	ExtraInfo          string        `json:"extra_info"`
	CreatedAt          time.Time     `json:"created_at"`
	CompanyName        string        `json:"company_name"`
	Amount             float64       `json:"amount"`
	// 关联的企业信息
	Company            *CompanyInfo  `json:"company,omitempty"`
	// 关联的物流商信息
	LogisticsProvider  *LogisticsInfo `json:"logistics_provider,omitempty"`
}

// OrderListResponse 订单列表响应
type OrderListResponse struct {
	Code    int                `json:"code"`
	Message string             `json:"message"`
	Data    []OrderResponse    `json:"data"`
	Total   int64              `json:"total"`
}

// OrderDetailResponse 订单详情响应
type OrderDetailResponse struct {
	Code    int               `json:"code"`
	Message string            `json:"message"`
	Data    *OrderResponse    `json:"data"`
}

// BatchImportRequest 批量导入请求
type BatchImportRequest struct {
	Orders []CreateOrderRequest `json:"orders" binding:"required"`
}

// BatchImportResponse 批量导入响应
type BatchImportResponse struct {
	Code      int              `json:"code"`
	Message   string           `json:"message"`
	Success   int              `json:"success"`
	Failed    int              `json:"failed"`
	Errors    []ImportError    `json:"errors,omitempty"`
}

// ImportError 导入错误信息
type ImportError struct {
	Index   int    `json:"index"`
	OrderNo string `json:"order_no"`
	Error   string `json:"error"`
}

// CreateOrder 创建订单
func CreateOrder(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	// 校验企业是否存在
	var company model.EcoCompany
	if err := db.GetDB().First(&company, req.CompanyID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "所属企业不存在",
		})
		return
	}

	// 校验物流商是否存在（如果提供了）
	if req.LogisticsProviderID != 0 {
		var provider model.LogisticsProvider
		if err := db.GetDB().First(&provider, req.LogisticsProviderID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "关联物流商不存在",
			})
			return
		}
	}

	// 校验订单号唯一性
	var existingOrder model.OrderData
	if err := db.GetDB().Where("order_no = ?", req.OrderNo).First(&existingOrder).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "订单号已存在",
		})
		return
	}

	order := model.OrderData{
		CompanyID:          req.CompanyID,
		OrderNo:            req.OrderNo,
		ProductName:        req.ProductName,
		Quantity:           req.Quantity,
		OrderAmount:        req.OrderAmount,
		Currency:           req.Currency,
		DestinationCountry: req.DestinationCountry,
		LogisticsProviderID: req.LogisticsProviderID,
		OrderDate:          req.OrderDate,
		PaymentStatus:      req.PaymentStatus,
		ExtraInfo:          req.ExtraInfo,
	}

	if err := db.GetDB().Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建订单失败：" + err.Error(),
		})
		return
	}

	resp := orderToResponse(&order)
	loadCompanyInfoForOrder(resp)
	if order.LogisticsProviderID != 0 {
		loadLogisticsProviderInfoForOrder(resp)
	}

	c.JSON(http.StatusOK, OrderDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    resp,
	})
}

// BatchImportOrders 批量导入订单
func BatchImportOrders(c *gin.Context) {
	var req BatchImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	successCount := 0
	failedCount := 0
	var errors []ImportError

	// 开启事务
	tx := db.GetDB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for i, orderReq := range req.Orders {
		// 校验企业是否存在
		var company model.EcoCompany
		if err := tx.First(&company, orderReq.CompanyID).Error; err != nil {
			failedCount++
			errors = append(errors, ImportError{
				Index:   i,
				OrderNo: orderReq.OrderNo,
				Error:   "企业不存在",
			})
			continue
		}

		// 校验物流商是否存在（如果提供了）
		if orderReq.LogisticsProviderID != 0 {
			var provider model.LogisticsProvider
			if err := tx.First(&provider, orderReq.LogisticsProviderID).Error; err != nil {
				failedCount++
				errors = append(errors, ImportError{
					Index:   i,
					OrderNo: orderReq.OrderNo,
					Error:   "物流商不存在",
				})
				continue
			}
		}

		// 校验订单号唯一性
		var existingOrder model.OrderData
		if err := tx.Where("order_no = ?", orderReq.OrderNo).First(&existingOrder).Error; err == nil {
			failedCount++
			errors = append(errors, ImportError{
				Index:   i,
				OrderNo: orderReq.OrderNo,
				Error:   "订单号已存在",
			})
			continue
		}

		// 创建订单
		order := model.OrderData{
			CompanyID:          orderReq.CompanyID,
			OrderNo:            orderReq.OrderNo,
			ProductName:        orderReq.ProductName,
			Quantity:           orderReq.Quantity,
			OrderAmount:        orderReq.OrderAmount,
			Currency:           orderReq.Currency,
			DestinationCountry: orderReq.DestinationCountry,
			LogisticsProviderID: orderReq.LogisticsProviderID,
			OrderDate:          orderReq.OrderDate,
			PaymentStatus:      orderReq.PaymentStatus,
			ExtraInfo:          orderReq.ExtraInfo,
		}

		if err := tx.Create(&order).Error; err != nil {
			failedCount++
			errors = append(errors, ImportError{
				Index:   i,
				OrderNo: orderReq.OrderNo,
				Error:   "创建失败：" + err.Error(),
			})
			continue
		}

		successCount++
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "批量导入失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, BatchImportResponse{
		Code:    200,
		Message: "批量导入完成",
		Success: successCount,
		Failed:  failedCount,
		Errors:  errors,
	})
}

// GetOrderList 获取订单列表
func GetOrderList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	companyID := c.Query("company_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	paymentStatus := c.Query("payment_status")

	query := db.GetDB().Model(&model.OrderData{})

	if companyID != "" {
		query = query.Where("company_id = ?", companyID)
	}
	if startDate != "" {
		query = query.Where("order_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("order_date <= ?", endDate)
	}
	if paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}

	var total int64
	query.Count(&total)

	var orders []model.OrderData
	offset := (page - 1) * pageSize
	if err := query.Order("order_date DESC").Offset(offset).Limit(pageSize).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, OrderListResponse{
			Code:    500,
			Message: "获取订单列表失败",
		})
		return
	}

	data := make([]OrderResponse, len(orders))
	for i, order := range orders {
		resp := orderToResponse(&order)
		loadCompanyInfoForOrder(resp)
		if order.LogisticsProviderID != 0 {
			loadLogisticsProviderInfoForOrder(resp)
		}
		data[i] = *resp
	}

	c.JSON(http.StatusOK, OrderListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetOrderDetail 获取订单详情
func GetOrderDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的订单 ID",
		})
		return
	}

	var order model.OrderData
	if err := db.GetDB().First(&order, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "订单不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取订单详情失败",
		})
		return
	}

	resp := orderToResponse(&order)
	loadCompanyInfoForOrder(resp)
	if order.LogisticsProviderID != 0 {
		loadLogisticsProviderInfoForOrder(resp)
	}

	c.JSON(http.StatusOK, OrderDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    resp,
	})
}

// UpdateOrder 更新订单
func UpdateOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的订单 ID",
		})
		return
	}

	var req UpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var order model.OrderData
	if err := db.GetDB().First(&order, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "订单不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新订单失败",
		})
		return
	}

	// 更新字段
	if req.ProductName != "" {
		order.ProductName = req.ProductName
	}
	if req.Quantity > 0 {
		order.Quantity = req.Quantity
	}
	if req.OrderAmount > 0 {
		order.OrderAmount = req.OrderAmount
	}
	if req.Currency != "" {
		order.Currency = req.Currency
	}
	if req.DestinationCountry != "" {
		order.DestinationCountry = req.DestinationCountry
	}
	if req.LogisticsProviderID != 0 {
		// 校验物流商是否存在
		var provider model.LogisticsProvider
		if err := db.GetDB().First(&provider, req.LogisticsProviderID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "关联物流商不存在",
			})
			return
		}
		order.LogisticsProviderID = req.LogisticsProviderID
	}
	if req.PaymentStatus != "" {
		order.PaymentStatus = req.PaymentStatus
	}
	if req.ExtraInfo != "" {
		order.ExtraInfo = req.ExtraInfo
	}

	if err := db.GetDB().Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新订单失败：" + err.Error(),
		})
		return
	}

	resp := orderToResponse(&order)
	loadCompanyInfoForOrder(resp)
	if order.LogisticsProviderID != 0 {
		loadLogisticsProviderInfoForOrder(resp)
	}

	c.JSON(http.StatusOK, OrderDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    resp,
	})
}

// DeleteOrder 删除订单
func DeleteOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的订单 ID",
		})
		return
	}

	var order model.OrderData
	if err := db.GetDB().First(&order, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "订单不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取订单失败",
		})
		return
	}

	if err := db.GetDB().Delete(&model.OrderData{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除订单失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func orderToResponse(order *model.OrderData) *OrderResponse {
	return &OrderResponse{
		ID:                 order.ID,
		CompanyID:          order.CompanyID,
		OrderNo:            order.OrderNo,
		ProductName:        order.ProductName,
		Quantity:           order.Quantity,
		OrderAmount:        order.OrderAmount,
		Amount:             order.OrderAmount,
		Currency:           order.Currency,
		DestinationCountry: order.DestinationCountry,
		LogisticsProviderID: order.LogisticsProviderID,
		OrderDate:          order.OrderDate,
		PaymentStatus:      order.PaymentStatus,
		ExtraInfo:          order.ExtraInfo,
		CreatedAt:          order.CreatedAt,
		CompanyName:        "",
	}
}

func loadCompanyInfoForOrder(resp *OrderResponse) {
	if resp.CompanyID == 0 {
		return
	}
	
	var company model.EcoCompany
	if err := db.GetDB().First(&company, resp.CompanyID).Error; err == nil {
		resp.CompanyName = company.CompanyName
		resp.Company = &CompanyInfo{
			ID:          company.ID,
			CompanyName: company.CompanyName,
			CreditCode:  company.CreditCode,
		}
	}
}

func loadLogisticsProviderInfoForOrder(resp *OrderResponse) {
	if resp.LogisticsProviderID == 0 {
		return
	}
	
	var provider model.LogisticsProvider
	if err := db.GetDB().First(&provider, resp.LogisticsProviderID).Error; err == nil {
		resp.LogisticsProvider = &LogisticsInfo{
			ID:                provider.ID,
			ProviderName:      provider.ProviderName,
			BusinessLicenseNo: provider.BusinessLicenseNo,
		}
	}
}
