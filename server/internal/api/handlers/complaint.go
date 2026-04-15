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

// CreateComplaintRequest 创建用户投诉请求
type CreateComplaintRequest struct {
	ComplaintContent  string    `json:"complaint_content" binding:"required"`
	ComplaintType     string    `json:"complaint_type" binding:"required"`
	TargetCompanyID   int64     `json:"target_company_id" binding:"required"`
	TargetLogisticsID int64     `json:"target_logistics_id"`
	ComplaintDate     time.Time `json:"complaint_date" binding:"required"`
}

// UpdateComplaintRequest 更新用户投诉请求
type UpdateComplaintRequest struct {
	ComplaintContent  string `json:"complaint_content"`
	ComplaintType     string `json:"complaint_type"`
	TargetLogisticsID int64  `json:"target_logistics_id"`
	IsProcessed       bool   `json:"is_processed"`
}

// ComplaintResponse 用户投诉响应
type ComplaintResponse struct {
	ID                int64         `json:"id"`
	ComplaintContent  string        `json:"complaint_content"`
	ComplaintType     string        `json:"complaint_type"`
	TargetCompanyID   int64         `json:"target_company_id"`
	TargetLogisticsID int64         `json:"target_logistics_id"`
	ComplaintDate     time.Time     `json:"complaint_date"`
	IsProcessed       bool          `json:"is_processed"`
	CreatedAt         time.Time     `json:"created_at"`
	// 关联的企业信息
	TargetCompany     *CompanyInfo  `json:"target_company,omitempty"`
	// 关联的物流商信息
	TargetLogistics   *LogisticsInfo `json:"target_logistics,omitempty"`
}

// CompanyInfo 企业信息（简化版）
type CompanyInfo struct {
	ID           int64  `json:"id"`
	CompanyName  string `json:"company_name"`
	CreditCode   string `json:"credit_code"`
}

// LogisticsInfo 物流商信息（简化版）
type LogisticsInfo struct {
	ID                int64  `json:"id"`
	ProviderName      string `json:"provider_name"`
	BusinessLicenseNo string `json:"business_license_no"`
}

// ComplaintListResponse 用户投诉列表响应
type ComplaintListResponse struct {
	Code    int                  `json:"code"`
	Message string               `json:"message"`
	Data    []ComplaintResponse  `json:"data"`
	Total   int64                `json:"total"`
}

// ComplaintDetailResponse 用户投诉详情响应
type ComplaintDetailResponse struct {
	Code    int                 `json:"code"`
	Message string              `json:"message"`
	Data    *ComplaintResponse  `json:"data"`
}

// CreateComplaint 创建用户投诉
func CreateComplaint(c *gin.Context) {
	var req CreateComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	// 校验被投诉企业是否存在
	var company model.EcoCompany
	if err := db.GetDB().First(&company, req.TargetCompanyID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "被投诉企业不存在",
		})
		return
	}

	// 校验关联物流商是否存在（如果提供了）
	if req.TargetLogisticsID != 0 {
		var provider model.LogisticsProvider
		if err := db.GetDB().First(&provider, req.TargetLogisticsID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "关联物流商不存在",
			})
			return
		}
	}

	complaint := model.UserComplaint{
		ComplaintContent:  req.ComplaintContent,
		ComplaintType:     req.ComplaintType,
		TargetCompanyID:   req.TargetCompanyID,
		TargetLogisticsID: req.TargetLogisticsID,
		ComplaintDate:     req.ComplaintDate,
		IsProcessed:       false,
	}

	if err := db.GetDB().Create(&complaint).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建用户投诉失败：" + err.Error(),
		})
		return
	}

	resp := complaintToResponse(&complaint)
	// 加载企业信息
	loadCompanyInfoForComplaint(resp)
	// 加载物流商信息（如果有）
	if complaint.TargetLogisticsID != 0 {
		loadLogisticsInfoForComplaint(resp)
	}

	c.JSON(http.StatusOK, ComplaintDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    resp,
	})
}

// GetComplaintList 获取用户投诉列表
func GetComplaintList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	targetCompanyID := c.Query("target_company_id")
	complaintType := c.Query("complaint_type")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	isProcessed := c.Query("is_processed")

	query := db.GetDB().Model(&model.UserComplaint{})

	if targetCompanyID != "" {
		query = query.Where("target_company_id = ?", targetCompanyID)
	}
	if complaintType != "" {
		query = query.Where("complaint_type = ?", complaintType)
	}
	if startDate != "" {
		query = query.Where("complaint_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("complaint_date <= ?", endDate)
	}
	if isProcessed != "" {
		query = query.Where("is_processed = ?", isProcessed == "true")
	}

	var total int64
	query.Count(&total)

	var complaints []model.UserComplaint
	offset := (page - 1) * pageSize
	if err := query.Order("complaint_date DESC").Offset(offset).Limit(pageSize).Find(&complaints).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ComplaintListResponse{
			Code:    500,
			Message: "获取用户投诉列表失败",
		})
		return
	}

	data := make([]ComplaintResponse, len(complaints))
	for i, complaint := range complaints {
		resp := complaintToResponse(&complaint)
		// 加载企业信息
		loadCompanyInfoForComplaint(resp)
		// 加载物流商信息（如果有）
		if complaint.TargetLogisticsID != 0 {
			loadLogisticsInfoForComplaint(resp)
		}
		data[i] = *resp
	}

	c.JSON(http.StatusOK, ComplaintListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetComplaintDetail 获取用户投诉详情
func GetComplaintDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的投诉 ID",
		})
		return
	}

	var complaint model.UserComplaint
	if err := db.GetDB().First(&complaint, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "投诉不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取用户投诉详情失败",
		})
		return
	}

	resp := complaintToResponse(&complaint)
	// 加载企业信息
	loadCompanyInfoForComplaint(resp)
	// 加载物流商信息（如果有）
	if complaint.TargetLogisticsID != 0 {
		loadLogisticsInfoForComplaint(resp)
	}

	c.JSON(http.StatusOK, ComplaintDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    resp,
	})
}

// UpdateComplaint 更新用户投诉
func UpdateComplaint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的投诉 ID",
		})
		return
	}

	var req UpdateComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var complaint model.UserComplaint
	if err := db.GetDB().First(&complaint, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "投诉不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新用户投诉失败",
		})
		return
	}

	// 更新字段
	if req.ComplaintContent != "" {
		complaint.ComplaintContent = req.ComplaintContent
	}
	if req.ComplaintType != "" {
		complaint.ComplaintType = req.ComplaintType
	}
	if req.TargetLogisticsID != 0 {
		// 校验物流商是否存在
		var provider model.LogisticsProvider
		if err := db.GetDB().First(&provider, req.TargetLogisticsID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "关联物流商不存在",
			})
			return
		}
		complaint.TargetLogisticsID = req.TargetLogisticsID
	}
	complaint.IsProcessed = req.IsProcessed

	if err := db.GetDB().Save(&complaint).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新用户投诉失败：" + err.Error(),
		})
		return
	}

	resp := complaintToResponse(&complaint)
	loadCompanyInfoForComplaint(resp)
	if complaint.TargetLogisticsID != 0 {
		loadLogisticsInfoForComplaint(resp)
	}

	c.JSON(http.StatusOK, ComplaintDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    resp,
	})
}

// DeleteComplaint 删除用户投诉
func DeleteComplaint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的投诉 ID",
		})
		return
	}

	if err := db.GetDB().Delete(&model.UserComplaint{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除用户投诉失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

// MarkComplaintProcessed 标记投诉已处理
func MarkComplaintProcessed(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的投诉 ID",
		})
		return
	}

	if err := db.GetDB().Model(&model.UserComplaint{}).Where("id = ?", id).Update("is_processed", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "标记投诉失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "标记成功",
	})
}

func complaintToResponse(complaint *model.UserComplaint) *ComplaintResponse {
	return &ComplaintResponse{
		ID:                complaint.ID,
		ComplaintContent:  complaint.ComplaintContent,
		ComplaintType:     complaint.ComplaintType,
		TargetCompanyID:   complaint.TargetCompanyID,
		TargetLogisticsID: complaint.TargetLogisticsID,
		ComplaintDate:     complaint.ComplaintDate,
		IsProcessed:       complaint.IsProcessed,
		CreatedAt:         complaint.CreatedAt,
	}
}

func loadCompanyInfoForComplaint(resp *ComplaintResponse) {
	if resp.TargetCompanyID == 0 {
		return
	}
	
	var company model.EcoCompany
	if err := db.GetDB().First(&company, resp.TargetCompanyID).Error; err == nil {
		resp.TargetCompany = &CompanyInfo{
			ID:          company.ID,
			CompanyName: company.CompanyName,
			CreditCode:  company.CreditCode,
		}
	}
}

func loadLogisticsInfoForComplaint(resp *ComplaintResponse) {
	if resp.TargetLogisticsID == 0 {
		return
	}
	
	var provider model.LogisticsProvider
	if err := db.GetDB().First(&provider, resp.TargetLogisticsID).Error; err == nil {
		resp.TargetLogistics = &LogisticsInfo{
			ID:                provider.ID,
			ProviderName:      provider.ProviderName,
			BusinessLicenseNo: provider.BusinessLicenseNo,
		}
	}
}
