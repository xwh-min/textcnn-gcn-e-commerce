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

// CreatePolicyNewsRequest 创建政策新闻请求
type CreatePolicyNewsRequest struct {
	Title            string    `json:"title" binding:"required"`
	Content          string    `json:"content" binding:"required"`
	Source           string    `json:"source"`
	PublishDate      time.Time `json:"publish_date" binding:"required"`
	RelatedRegions   []string  `json:"related_regions"`
	RelatedCompanies []int64   `json:"related_companies"`
}

// UpdatePolicyNewsRequest 更新政策新闻请求
type UpdatePolicyNewsRequest struct {
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	Source         string    `json:"source"`
	PublishDate    time.Time `json:"publish_date"`
	RelatedRegions []string  `json:"related_regions"`
}

// PolicyNewsResponse 政策新闻响应
type PolicyNewsResponse struct {
	ID               int64     `json:"id"`
	Title            string    `json:"title"`
	Content          string    `json:"content"`
	Source           string    `json:"source"`
	PublishDate      time.Time `json:"publish_date"`
	RelatedRegions   []string  `json:"related_regions"`
	RelatedCompanies []int64   `json:"related_companies"`
	CreatedAt        time.Time `json:"created_at"`
}

// PolicyNewsListResponse 政策新闻列表响应
type PolicyNewsListResponse struct {
	Code    int                    `json:"code"`
	Message string                 `json:"message"`
	Data    []PolicyNewsResponse   `json:"data"`
	Total   int64                  `json:"total"`
}

// PolicyNewsDetailResponse 政策新闻详情响应
type PolicyNewsDetailResponse struct {
	Code    int                   `json:"code"`
	Message string                `json:"message"`
	Data    *PolicyNewsResponse   `json:"data"`
}

// CreatePolicyNews 创建政策新闻
func CreatePolicyNews(c *gin.Context) {
	var req CreatePolicyNewsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	// 校验关联企业是否存在（如果提供了）
	if req.RelatedCompanies != nil && len(req.RelatedCompanies) > 0 {
		for _, companyID := range req.RelatedCompanies {
			var company model.EcoCompany
			if err := db.GetDB().First(&company, companyID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"code":    400,
					"message": "关联企业不存在，ID: " + strconv.FormatInt(companyID, 10),
				})
				return
			}
		}
	}

	// 将数组转换为字符串（GORM 的 text[] 类型）
	var regionsStr string
	if req.RelatedRegions != nil && len(req.RelatedRegions) > 0 {
		for i, region := range req.RelatedRegions {
			if i == 0 {
				regionsStr = region
			} else {
				regionsStr += "," + region
			}
		}
	}

	// 将企业 ID 列表转换为字符串
	var companiesStr string
	if req.RelatedCompanies != nil && len(req.RelatedCompanies) > 0 {
		for i, companyID := range req.RelatedCompanies {
			if i == 0 {
				companiesStr = strconv.FormatInt(companyID, 10)
			} else {
				companiesStr += "," + strconv.FormatInt(companyID, 10)
			}
		}
	}

	news := model.PolicyNews{
		Title:            req.Title,
		Content:          req.Content,
		Source:           req.Source,
		PublishDate:      req.PublishDate,
		RelatedRegions:   regionsStr,
		RelatedCompanies: companiesStr,
	}

	if err := db.GetDB().Create(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建政策新闻失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, PolicyNewsDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    policyNewsToResponse(&news),
	})
}

// GetPolicyNewsList 获取政策新闻列表
func GetPolicyNewsList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	source := c.Query("source")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	relatedRegion := c.Query("related_region")

	query := db.GetDB().Model(&model.PolicyNews{})

	if source != "" {
		query = query.Where("source = ?", source)
	}
	if startDate != "" {
		query = query.Where("publish_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("publish_date <= ?", endDate)
	}
	if relatedRegion != "" {
		query = query.Where("related_regions LIKE ?", "%"+relatedRegion+"%")
	}

	var total int64
	query.Count(&total)

	var newsList []model.PolicyNews
	offset := (page - 1) * pageSize
	if err := query.Order("publish_date DESC").Offset(offset).Limit(pageSize).Find(&newsList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, PolicyNewsListResponse{
			Code:    500,
			Message: "获取政策新闻列表失败",
		})
		return
	}

	data := make([]PolicyNewsResponse, len(newsList))
	for i, news := range newsList {
		data[i] = *policyNewsToResponse(&news)
	}

	c.JSON(http.StatusOK, PolicyNewsListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetPolicyNewsDetail 获取政策新闻详情
func GetPolicyNewsDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的新闻 ID",
		})
		return
	}

	var news model.PolicyNews
	if err := db.GetDB().First(&news, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "新闻不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取政策新闻详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, PolicyNewsDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    policyNewsToResponse(&news),
	})
}

// UpdatePolicyNews 更新政策新闻
func UpdatePolicyNews(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的新闻 ID",
		})
		return
	}

	var req UpdatePolicyNewsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var news model.PolicyNews
	if err := db.GetDB().First(&news, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "新闻不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新政策新闻失败",
		})
		return
	}

	// 更新字段
	if req.Title != "" {
		news.Title = req.Title
	}
	if req.Content != "" {
		news.Content = req.Content
	}
	if req.Source != "" {
		news.Source = req.Source
	}
	if !req.PublishDate.IsZero() {
		news.PublishDate = req.PublishDate
	}
	if req.RelatedRegions != nil {
		regionsStr := ""
		for i, region := range req.RelatedRegions {
			if i == 0 {
				regionsStr = region
			} else {
				regionsStr += "," + region
			}
		}
		news.RelatedRegions = regionsStr
	}

	if err := db.GetDB().Save(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新政策新闻失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, PolicyNewsDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    policyNewsToResponse(&news),
	})
}

// DeletePolicyNews 删除政策新闻
func DeletePolicyNews(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的新闻 ID",
		})
		return
	}

	if err := db.GetDB().Delete(&model.PolicyNews{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除政策新闻失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func policyNewsToResponse(news *model.PolicyNews) *PolicyNewsResponse {
	// 将字符串转换为数组
	var regions []string
	if news.RelatedRegions != "" {
		regions = splitString(news.RelatedRegions)
	}

	var companies []int64
	if news.RelatedCompanies != "" {
		companyStrs := splitString(news.RelatedCompanies)
		for _, s := range companyStrs {
			if id, err := strconv.ParseInt(s, 10, 64); err == nil {
				companies = append(companies, id)
			}
		}
	}

	return &PolicyNewsResponse{
		ID:               news.ID,
		Title:            news.Title,
		Content:          news.Content,
		Source:           news.Source,
		PublishDate:      news.PublishDate,
		RelatedRegions:   regions,
		RelatedCompanies: companies,
		CreatedAt:        news.CreatedAt,
	}
}

func splitString(s string) []string {
	result := []string{}
	current := ""
	for _, r := range s {
		if r == ',' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(r)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}
