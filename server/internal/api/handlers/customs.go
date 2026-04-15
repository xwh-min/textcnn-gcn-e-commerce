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

// CreateCustomsRequest 创建海关请求
type CreateCustomsRequest struct {
	CustomsName      string `json:"customs_name" binding:"required"`
	CustomsCode      string `json:"customs_code" binding:"required"`
	Region           string `json:"region"`
	SupervisionLevel string `json:"supervision_level"`
}

// UpdateCustomsRequest 更新海关请求
type UpdateCustomsRequest struct {
	CustomsName      string `json:"customs_name"`
	Region           string `json:"region"`
	SupervisionLevel string `json:"supervision_level"`
}

// CustomsResponse 海关响应
type CustomsResponse struct {
	ID               int64     `json:"id"`
	CustomsName      string    `json:"customs_name"`
	CustomsCode      string    `json:"customs_code"`
	Region           string    `json:"region"`
	SupervisionLevel string    `json:"supervision_level"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CustomsListResponse 海关列表响应
type CustomsListResponse struct {
	Code    int                `json:"code"`
	Message string             `json:"message"`
	Data    []CustomsResponse  `json:"data"`
	Total   int64              `json:"total"`
}

// CustomsDetailResponse 海关详情响应
type CustomsDetailResponse struct {
	Code    int                `json:"code"`
	Message string             `json:"message"`
	Data    *CustomsResponse   `json:"data"`
}

// CreateCustoms 创建海关
func CreateCustoms(c *gin.Context) {
	var req CreateCustomsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var existing model.Customs
	result := db.GetDB().Where("customs_name = ? OR customs_code = ?", req.CustomsName, req.CustomsCode).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "该海关已存在",
		})
		return
	}

	customs := model.Customs{
		CustomsName:      req.CustomsName,
		CustomsCode:      req.CustomsCode,
		Region:           req.Region,
		SupervisionLevel: req.SupervisionLevel,
	}

	if err := db.GetDB().Create(&customs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建海关失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, CustomsDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    customsToResponse(&customs),
	})
}

// GetCustomsList 获取海关列表
func GetCustomsList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	customsName := c.Query("customs_name")
	region := c.Query("region")
	supervisionLevel := c.Query("supervision_level")

	query := db.GetDB().Model(&model.Customs{})

	if customsName != "" {
		query = query.Where("customs_name LIKE ?", "%"+customsName+"%")
	}
	if region != "" {
		query = query.Where("region = ?", region)
	}
	if supervisionLevel != "" {
		query = query.Where("supervision_level = ?", supervisionLevel)
	}

	var total int64
	query.Count(&total)

	var customsList []model.Customs
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&customsList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, CustomsListResponse{
			Code:    500,
			Message: "获取海关列表失败",
		})
		return
	}

	data := make([]CustomsResponse, len(customsList))
	for i, customs := range customsList {
		data[i] = *customsToResponse(&customs)
	}

	c.JSON(http.StatusOK, CustomsListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetCustomsDetail 获取海关详情
func GetCustomsDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的海关 ID",
		})
		return
	}

	var customs model.Customs
	if err := db.GetDB().First(&customs, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "海关不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取海关详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, CustomsDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    customsToResponse(&customs),
	})
}

// UpdateCustoms 更新海关
func UpdateCustoms(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的海关 ID",
		})
		return
	}

	var req UpdateCustomsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var customs model.Customs
	if err := db.GetDB().First(&customs, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "海关不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新海关失败",
		})
		return
	}

	if req.CustomsName != "" {
		customs.CustomsName = req.CustomsName
	}
	if req.Region != "" {
		customs.Region = req.Region
	}
	if req.SupervisionLevel != "" {
		customs.SupervisionLevel = req.SupervisionLevel
	}

	if err := db.GetDB().Save(&customs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新海关失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, CustomsDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    customsToResponse(&customs),
	})
}

// DeleteCustoms 删除海关（逻辑删除）
func DeleteCustoms(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的海关 ID",
		})
		return
	}

	var relationCount int64
	if err := db.GetDB().Model(&model.GraphRelation{}).Where(
		"(source_type = 'customs' AND source_id = ?) OR (target_type = 'customs' AND target_id = ?)", id, id,
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
			"message": "该海关存在关联关系，不可删除",
		})
		return
	}

	if err := db.GetDB().Model(&model.Customs{}).Where("id = ?", id).Update("deleted_at", time.Now()).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除海关失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func customsToResponse(customs *model.Customs) *CustomsResponse {
	return &CustomsResponse{
		ID:               customs.ID,
		CustomsName:      customs.CustomsName,
		CustomsCode:      customs.CustomsCode,
		Region:           customs.Region,
		SupervisionLevel: customs.SupervisionLevel,
		CreatedAt:        customs.CreatedAt,
		UpdatedAt:        customs.UpdatedAt,
	}
}
