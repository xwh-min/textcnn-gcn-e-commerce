package handlers

import (
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateLogisticsRequest 创建物流商请求
type CreateLogisticsRequest struct {
	ProviderName      string   `json:"provider_name" binding:"required"`
	BusinessLicenseNo string   `json:"business_license_no" binding:"required"`
	ServiceType       string   `json:"service_type"`
	CoverageCountries string   `json:"coverage_countries"`
}

// UpdateLogisticsRequest 更新物流商请求
type UpdateLogisticsRequest struct {
	ProviderName      string   `json:"provider_name"`
	ServiceType       string   `json:"service_type"`
	CoverageCountries string   `json:"coverage_countries"`
}

// LogisticsResponse 物流商响应
type LogisticsResponse struct {
	ID                int64     `json:"id"`
	ProviderName      string    `json:"provider_name"`
	BusinessLicenseNo string    `json:"business_license_no"`
	ServiceType       string    `json:"service_type"`
	CoverageCountries []string  `json:"coverage_countries"`
	IsHighRisk        bool      `json:"is_high_risk"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// LogisticsListResponse 物流商列表响应
type LogisticsListResponse struct {
	Code    int                  `json:"code"`
	Message string               `json:"message"`
	Data    []LogisticsResponse  `json:"data"`
	Total   int64                `json:"total"`
}

// LogisticsDetailResponse 物流商详情响应
type LogisticsDetailResponse struct {
	Code    int                 `json:"code"`
	Message string              `json:"message"`
	Data    *LogisticsResponse  `json:"data"`
}

// CreateLogistics 创建物流商
func CreateLogistics(c *gin.Context) {
	var req CreateLogisticsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var existing model.LogisticsProvider
	result := db.GetDB().Where("provider_name = ? OR business_license_no = ?", req.ProviderName, req.BusinessLicenseNo).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "该物流商已存在",
		})
		return
	}

	provider := model.LogisticsProvider{
		ProviderName:      req.ProviderName,
		BusinessLicenseNo: req.BusinessLicenseNo,
		ServiceType:       req.ServiceType,
		CoverageCountries: req.CoverageCountries,
		IsHighRisk:        false,
	}

	if err := db.GetDB().Create(&provider).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建物流商失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, LogisticsDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    logisticsToResponse(&provider),
	})
}

// GetLogisticsList 获取物流商列表
func GetLogisticsList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	providerName := c.Query("provider_name")
	isHighRisk := c.Query("is_high_risk")
	serviceType := c.Query("service_type")

	query := db.GetDB().Model(&model.LogisticsProvider{})

	if providerName != "" {
		query = query.Where("provider_name LIKE ?", "%"+providerName+"%")
	}
	if isHighRisk != "" {
		query = query.Where("is_high_risk = ?", isHighRisk == "true")
	}
	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	var total int64
	query.Count(&total)

	var providers []model.LogisticsProvider
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&providers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, LogisticsListResponse{
			Code:    500,
			Message: "获取物流商列表失败",
		})
		return
	}

	data := make([]LogisticsResponse, len(providers))
	for i, provider := range providers {
		data[i] = *logisticsToResponse(&provider)
	}

	c.JSON(http.StatusOK, LogisticsListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetLogisticsDetail 获取物流商详情
func GetLogisticsDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流商 ID",
		})
		return
	}

	var provider model.LogisticsProvider
	if err := db.GetDB().First(&provider, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "物流商不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取物流商详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, LogisticsDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    logisticsToResponse(&provider),
	})
}

// UpdateLogistics 更新物流商
func UpdateLogistics(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流商 ID",
		})
		return
	}

	var req UpdateLogisticsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var provider model.LogisticsProvider
	if err := db.GetDB().First(&provider, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "物流商不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新物流商失败",
		})
		return
	}

	if req.ProviderName != "" {
		provider.ProviderName = req.ProviderName
	}
	if req.ServiceType != "" {
		provider.ServiceType = req.ServiceType
	}
	if req.CoverageCountries != "" {
		provider.CoverageCountries = req.CoverageCountries
	}

	if err := db.GetDB().Save(&provider).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新物流商失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, LogisticsDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    logisticsToResponse(&provider),
	})
}

// DeleteLogistics 删除物流商（逻辑删除）
func DeleteLogistics(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流商 ID",
		})
		return
	}

	var relationCount int64
	if err := db.GetDB().Model(&model.GraphRelation{}).Where(
		"(source_type = 'logistics_provider' AND source_id = ?) OR (target_type = 'logistics_provider' AND target_id = ?)", id, id,
	).Count(&relationCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "检查关联关系失败",
		})
		return
	}

	if relationCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "该物流商存在关联关系，不可删除",
		})
		return
	}

	if err := db.GetDB().Model(&model.LogisticsProvider{}).Where("id = ?", id).Update("deleted_at", time.Now()).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除物流商失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

// MarkLogisticsHighRisk 标记高风险物流商
func MarkLogisticsHighRisk(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的物流商 ID",
		})
		return
	}

	if err := db.GetDB().Model(&model.LogisticsProvider{}).Where("id = ?", id).Update("is_high_risk", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "标记高风险失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "标记成功",
	})
}

func logisticsToResponse(provider *model.LogisticsProvider) *LogisticsResponse {
	var coverageCountries []string
	if provider.CoverageCountries != "" {
		coverageCountries = strings.Split(provider.CoverageCountries, ",")
		for i, country := range coverageCountries {
			coverageCountries[i] = strings.TrimSpace(country)
		}
	} else {
		coverageCountries = []string{}
	}
	return &LogisticsResponse{
		ID:                provider.ID,
		ProviderName:      provider.ProviderName,
		BusinessLicenseNo: provider.BusinessLicenseNo,
		ServiceType:       provider.ServiceType,
		CoverageCountries: coverageCountries,
		IsHighRisk:        provider.IsHighRisk,
		CreatedAt:         provider.CreatedAt,
		UpdatedAt:         provider.UpdatedAt,
	}
}
