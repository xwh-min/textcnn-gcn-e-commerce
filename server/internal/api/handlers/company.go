package handlers

import (
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// CreateCompanyRequest 创建企业请求
type CreateCompanyRequest struct {
	CompanyName         string    `json:"company_name" binding:"required"`
	CreditCode          string    `json:"credit_code" binding:"required,len=18"`
	RegisteredAddress   string    `json:"registered_address"`
	BusinessScope       string    `json:"business_scope"`
	EstablishedDate     time.Time `json:"established_date"`
	LegalRepresentative string    `json:"legal_representative"`
	ContactPhone        string    `json:"contact_phone"`
	ContactEmail        string    `json:"contact_email"`
}

// UpdateCompanyRequest 更新企业请求
type UpdateCompanyRequest struct {
	CompanyName         string    `json:"company_name"`
	RegisteredAddress   string    `json:"registered_address"`
	BusinessScope       string    `json:"business_scope"`
	EstablishedDate     time.Time `json:"established_date"`
	LegalRepresentative string    `json:"legal_representative"`
	ContactPhone        string    `json:"contact_phone"`
	ContactEmail        string    `json:"contact_email"`
}

// CompanyResponse 企业响应
type CompanyResponse struct {
	ID                  int64     `json:"id"`
	CompanyName         string    `json:"company_name"`
	CreditCode          string    `json:"credit_code"`
	RegisteredAddress   string    `json:"registered_address"`
	BusinessScope       string    `json:"business_scope"`
	EstablishedDate     time.Time `json:"established_date"`
	LegalRepresentative string    `json:"legal_representative"`
	ContactPhone        string    `json:"contact_phone"`
	ContactEmail        string    `json:"contact_email"`
	IsHighRisk          bool      `json:"is_high_risk"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// CompanyListResponse 企业列表响应
type CompanyListResponse struct {
	Code    int                 `json:"code"`
	Message string              `json:"message"`
	Data    []CompanyResponse   `json:"data"`
	Total   int64               `json:"total"`
}

// CompanyDetailResponse 企业详情响应
type CompanyDetailResponse struct {
	Code    int               `json:"code"`
	Message string            `json:"message"`
	Data    *CompanyResponse  `json:"data"`
}

// CreateCompany 创建企业
func CreateCompany(c *gin.Context) {
	var req CreateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("创建企业请求参数错误")
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	// 检查企业是否已存在
	var existingCompany model.EcoCompany
	result := db.GetDB().Where("company_name = ? OR credit_code = ?", req.CompanyName, req.CreditCode).First(&existingCompany)
	if result.Error == nil {
		logrus.WithField("company_name", req.CompanyName).Warn("企业已存在")
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "该企业已存在",
		})
		return
	}

	company := model.EcoCompany{
		CompanyName:         req.CompanyName,
		CreditCode:          req.CreditCode,
		RegisteredAddress:   req.RegisteredAddress,
		BusinessScope:       req.BusinessScope,
		EstablishedDate:     req.EstablishedDate,
		LegalRepresentative: req.LegalRepresentative,
		ContactPhone:        req.ContactPhone,
		ContactEmail:        req.ContactEmail,
		IsHighRisk:          false,
	}

	if err := db.GetDB().Create(&company).Error; err != nil {
		logrus.WithError(err).WithField("company_name", req.CompanyName).Error("创建企业失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建企业失败：" + err.Error(),
		})
		return
	}

	logrus.WithField("company_id", company.ID).Info("企业创建成功")
	c.JSON(http.StatusOK, CompanyDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    companyToResponse(&company),
	})
}

// GetCompanyList 获取企业列表
func GetCompanyList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	companyName := c.Query("company_name")
	isHighRisk := c.Query("is_high_risk")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := db.GetDB().Model(&model.EcoCompany{})

	if companyName != "" {
		query = query.Where("company_name LIKE ?", "%"+companyName+"%")
	}
	if isHighRisk != "" {
		query = query.Where("is_high_risk = ?", isHighRisk == "true")
	}
	if startDate != "" {
		query = query.Where("established_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("established_date <= ?", endDate)
	}

	var total int64
	query.Count(&total)

	var companies []model.EcoCompany
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&companies).Error; err != nil {
		logrus.WithError(err).Error("获取企业列表失败")
		c.JSON(http.StatusInternalServerError, CompanyListResponse{
			Code:    500,
			Message: "获取企业列表失败",
		})
		return
	}

	data := make([]CompanyResponse, len(companies))
	for i, company := range companies {
		data[i] = *companyToResponse(&company)
	}

	c.JSON(http.StatusOK, CompanyListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetCompanyDetail 获取企业详情
func GetCompanyDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的企业 ID",
		})
		return
	}

	var company model.EcoCompany
	if err := db.GetDB().First(&company, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "企业不存在",
			})
			return
		}
		logrus.WithError(err).Error("获取企业详情失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取企业详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, CompanyDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    companyToResponse(&company),
	})
}

// UpdateCompany 更新企业
func UpdateCompany(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的企业 ID",
		})
		return
	}

	var req UpdateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var company model.EcoCompany
	if err := db.GetDB().First(&company, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "企业不存在",
			})
			return
		}
		logrus.WithError(err).Error("更新企业失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新企业失败",
		})
		return
	}

	// 更新字段
	if req.CompanyName != "" {
		company.CompanyName = req.CompanyName
	}
	if req.RegisteredAddress != "" {
		company.RegisteredAddress = req.RegisteredAddress
	}
	if req.BusinessScope != "" {
		company.BusinessScope = req.BusinessScope
	}
	if !req.EstablishedDate.IsZero() {
		company.EstablishedDate = req.EstablishedDate
	}
	if req.LegalRepresentative != "" {
		company.LegalRepresentative = req.LegalRepresentative
	}
	if req.ContactPhone != "" {
		company.ContactPhone = req.ContactPhone
	}
	if req.ContactEmail != "" {
		company.ContactEmail = req.ContactEmail
	}

	if err := db.GetDB().Save(&company).Error; err != nil {
		logrus.WithError(err).WithField("company_id", id).Error("更新企业失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新企业失败：" + err.Error(),
		})
		return
	}

	logrus.WithField("company_id", id).Info("企业更新成功")
	c.JSON(http.StatusOK, CompanyDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    companyToResponse(&company),
	})
}

// DeleteCompany 删除企业（逻辑删除）
func DeleteCompany(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的企业 ID",
		})
		return
	}

	// 检查是否存在关联关系
	var relationCount int64
	if err := db.GetDB().Model(&model.GraphRelation{}).Where(
		"(source_type = 'eco_company' AND source_id = ?) OR (target_type = 'eco_company' AND target_id = ?)", id, id,
	).Count(&relationCount).Error; err != nil {
		logrus.WithError(err).Error("检查关联关系失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "检查关联关系失败",
		})
		return
	}

	if relationCount > 0 {
		logrus.WithField("company_id", id).Warn("企业存在关联关系，不可删除")
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "该企业存在关联关系，不可删除",
		})
		return
	}

	// 逻辑删除
	if err := db.GetDB().Model(&model.EcoCompany{}).Where("id = ?", id).Update("deleted_at", time.Now()).Error; err != nil {
		logrus.WithError(err).WithField("company_id", id).Error("删除企业失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除企业失败：" + err.Error(),
		})
		return
	}

	logrus.WithField("company_id", id).Info("企业删除成功")
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

// MarkHighRisk 标记高风险企业
func MarkHighRisk(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的企业 ID",
		})
		return
	}

	if err := db.GetDB().Model(&model.EcoCompany{}).Where("id = ?", id).Update("is_high_risk", true).Error; err != nil {
		logrus.WithError(err).WithField("company_id", id).Error("标记高风险失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "标记高风险失败：" + err.Error(),
		})
		return
	}

	logrus.WithField("company_id", id).Info("标记高风险成功")
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "标记成功",
	})
}

func companyToResponse(company *model.EcoCompany) *CompanyResponse {
	return &CompanyResponse{
		ID:                  company.ID,
		CompanyName:         company.CompanyName,
		CreditCode:          company.CreditCode,
		RegisteredAddress:   company.RegisteredAddress,
		BusinessScope:       company.BusinessScope,
		EstablishedDate:     company.EstablishedDate,
		LegalRepresentative: company.LegalRepresentative,
		ContactPhone:        company.ContactPhone,
		ContactEmail:        company.ContactEmail,
		IsHighRisk:          company.IsHighRisk,
		CreatedAt:           company.CreatedAt,
		UpdatedAt:           company.UpdatedAt,
	}
}
