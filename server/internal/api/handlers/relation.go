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

// CreateRelationRequest 创建关系请求
type CreateRelationRequest struct {
	SourceType   string    `json:"source_type" binding:"required,oneof=eco_company logistics_provider customs"`
	SourceID     int64     `json:"source_id" binding:"required"`
	TargetType   string    `json:"target_type" binding:"required,oneof=eco_company logistics_provider customs"`
	TargetID     int64     `json:"target_id" binding:"required"`
	RelationType string    `json:"relation_type" binding:"required,oneof=cooperation compliance"`
	Weight       float64   `json:"weight" binding:"omitempty,min=0,max=5"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
	Remark       string    `json:"remark"`
}

// UpdateRelationRequest 更新关系请求
type UpdateRelationRequest struct {
	Weight     float64   `json:"weight"`
	StartDate  time.Time `json:"start_date"`
	EndDate    time.Time `json:"end_date"`
	Remark     string    `json:"remark"`
}

// RelationResponse 关系响应
type RelationResponse struct {
	ID           int64     `json:"id"`
	SourceType   string    `json:"source_type"`
	SourceID     int64     `json:"source_id"`
	TargetType   string    `json:"target_type"`
	TargetID     int64     `json:"target_id"`
	RelationType string    `json:"relation_type"`
	Weight       float64   `json:"weight"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
	Remark       string    `json:"remark"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	// 关联的节点信息
	SourceNode   interface{} `json:"source_node,omitempty"`
	TargetNode   interface{} `json:"target_node,omitempty"`
}

// RelationListResponse 关系列表响应
type RelationListResponse struct {
	Code    int                 `json:"code"`
	Message string              `json:"message"`
	Data    []RelationResponse  `json:"data"`
	Total   int64               `json:"total"`
}

// RelationDetailResponse 关系详情响应
type RelationDetailResponse struct {
	Code    int                `json:"code"`
	Message string             `json:"message"`
	Data    *RelationResponse  `json:"data"`
}

// CreateRelation 创建关系
func CreateRelation(c *gin.Context) {
	var req CreateRelationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	// 校验源节点是否存在
	if err := validateNodeExists(req.SourceType, req.SourceID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "源节点不存在：" + err.Error(),
		})
		return
	}

	// 校验目标节点是否存在
	if err := validateNodeExists(req.TargetType, req.TargetID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "目标节点不存在：" + err.Error(),
		})
		return
	}

	// 检查关系是否已存在
	var existingRelation model.GraphRelation
	result := db.GetDB().Where(
		"source_type = ? AND source_id = ? AND target_type = ? AND target_id = ? AND relation_type = ?",
		req.SourceType, req.SourceID, req.TargetType, req.TargetID, req.RelationType,
	).First(&existingRelation)
	
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "该关系已存在",
		})
		return
	}

	relation := model.GraphRelation{
		SourceType:   req.SourceType,
		SourceID:     req.SourceID,
		TargetType:   req.TargetType,
		TargetID:     req.TargetID,
		RelationType: req.RelationType,
		Weight:       req.Weight,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Remark:       req.Remark,
	}

	if err := db.GetDB().Create(&relation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建关系失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, RelationDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    relationToResponse(&relation),
	})
}

// GetRelationList 获取关系列表
func GetRelationList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	
	sourceType := c.Query("source_type")
	sourceID := c.Query("source_id")
	targetType := c.Query("target_type")
	targetID := c.Query("target_id")
	relationType := c.Query("relation_type")
	isActive := c.Query("is_active")

	query := db.GetDB().Model(&model.GraphRelation{})

	if sourceType != "" {
		query = query.Where("source_type = ?", sourceType)
	}
	if sourceID != "" {
		query = query.Where("source_id = ?", sourceID)
	}
	if targetType != "" {
		query = query.Where("target_type = ?", targetType)
	}
	if targetID != "" {
		query = query.Where("target_id = ?", targetID)
	}
	if relationType != "" {
		query = query.Where("relation_type = ?", relationType)
	}
	if isActive != "" {
		if isActive == "true" {
			query = query.Where("end_date IS NULL OR end_date > ?", time.Now())
		} else {
			query = query.Where("end_date IS NOT NULL AND end_date <= ?", time.Now())
		}
	}

	var total int64
	query.Count(&total)

	var relations []model.GraphRelation
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&relations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, RelationListResponse{
			Code:    500,
			Message: "获取关系列表失败",
		})
		return
	}

	data := make([]RelationResponse, len(relations))
	for i, relation := range relations {
		resp := relationToResponse(&relation)
		// 加载关联的节点信息
		loadNodeInfo(resp)
		data[i] = *resp
	}

	c.JSON(http.StatusOK, RelationListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetRelationDetail 获取关系详情
func GetRelationDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的关系 ID",
		})
		return
	}

	var relation model.GraphRelation
	if err := db.GetDB().First(&relation, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "关系不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取关系详情失败",
		})
		return
	}

	resp := relationToResponse(&relation)
	loadNodeInfo(resp)

	c.JSON(http.StatusOK, RelationDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    resp,
	})
}

// UpdateRelation 更新关系
func UpdateRelation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的关系 ID",
		})
		return
	}

	var req UpdateRelationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var relation model.GraphRelation
	if err := db.GetDB().First(&relation, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "关系不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新关系失败",
		})
		return
	}

	// 更新字段
	if req.Weight > 0 {
		relation.Weight = req.Weight
	}
	if !req.StartDate.IsZero() {
		relation.StartDate = req.StartDate
	}
	if !req.EndDate.IsZero() {
		relation.EndDate = req.EndDate
	}
	if req.Remark != "" {
		relation.Remark = req.Remark
	}

	if err := db.GetDB().Save(&relation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新关系失败：" + err.Error(),
		})
		return
	}

	resp := relationToResponse(&relation)
	loadNodeInfo(resp)

	c.JSON(http.StatusOK, RelationDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    resp,
	})
}

// TerminateRelation 终止关系
func TerminateRelation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的关系 ID",
		})
		return
	}

	var relation model.GraphRelation
	if err := db.GetDB().First(&relation, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "关系不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "终止关系失败",
		})
		return
	}

	// 更新结束时间为当前时间
	if err := db.GetDB().Model(&relation).Updates(map[string]interface{}{
		"end_date": time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "终止关系失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "关系已终止",
	})
}

// GetCompanyGraph 获取企业关系图谱
func GetCompanyGraph(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的企业 ID",
		})
		return
	}

	// 查询企业作为源节点的关系
	var sourceRelations []model.GraphRelation
	if err := db.GetDB().Where(
		"source_type = 'eco_company' AND source_id = ?", id,
	).Find(&sourceRelations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取企业关系失败",
		})
		return
	}

	// 查询企业作为目标节点的关系
	var targetRelations []model.GraphRelation
	if err := db.GetDB().Where(
		"target_type = 'eco_company' AND target_id = ?", id,
	).Find(&targetRelations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取企业关系失败",
		})
		return
	}

	// 合并关系
	allRelations := append(sourceRelations, targetRelations...)
	
	// 转换为响应格式
	data := make([]RelationResponse, len(allRelations))
	for i, relation := range allRelations {
		resp := relationToResponse(&relation)
		loadNodeInfo(resp)
		data[i] = *resp
	}

	c.JSON(http.StatusOK, RelationListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   int64(len(allRelations)),
	})
}

// validateNodeExists 校验节点是否存在
func validateNodeExists(nodeType string, nodeID int64) error {
	switch nodeType {
	case "eco_company":
		var company model.EcoCompany
		result := db.GetDB().First(&company, nodeID)
		return result.Error
	case "logistics_provider":
		var provider model.LogisticsProvider
		result := db.GetDB().First(&provider, nodeID)
		return result.Error
	case "customs":
		var customs model.Customs
		result := db.GetDB().First(&customs, nodeID)
		return result.Error
	default:
		return gorm.ErrRecordNotFound
	}
}

// relationToResponse 转换为响应格式
func relationToResponse(relation *model.GraphRelation) *RelationResponse {
	isActive := true
	if !relation.EndDate.IsZero() && relation.EndDate.Before(time.Now()) {
		isActive = false
	}

	return &RelationResponse{
		ID:           relation.ID,
		SourceType:   relation.SourceType,
		SourceID:     relation.SourceID,
		TargetType:   relation.TargetType,
		TargetID:     relation.TargetID,
		RelationType: relation.RelationType,
		Weight:       relation.Weight,
		StartDate:    relation.StartDate,
		EndDate:      relation.EndDate,
		Remark:       relation.Remark,
		IsActive:     isActive,
		CreatedAt:    relation.CreatedAt,
		UpdatedAt:    relation.UpdatedAt,
	}
}

// loadNodeInfo 加载节点信息
func loadNodeInfo(resp *RelationResponse) {
	// 加载源节点信息
	switch resp.SourceType {
	case "eco_company":
		var company model.EcoCompany
		if err := db.GetDB().First(&company, resp.SourceID).Error; err == nil {
			resp.SourceNode = company
		}
	case "logistics_provider":
		var provider model.LogisticsProvider
		if err := db.GetDB().First(&provider, resp.SourceID).Error; err == nil {
			resp.SourceNode = provider
		}
	case "customs":
		var customs model.Customs
		if err := db.GetDB().First(&customs, resp.SourceID).Error; err == nil {
			resp.SourceNode = customs
		}
	}

	// 加载目标节点信息
	switch resp.TargetType {
	case "eco_company":
		var company model.EcoCompany
		if err := db.GetDB().First(&company, resp.TargetID).Error; err == nil {
			resp.TargetNode = company
		}
	case "logistics_provider":
		var provider model.LogisticsProvider
		if err := db.GetDB().First(&provider, resp.TargetID).Error; err == nil {
			resp.TargetNode = provider
		}
	case "customs":
		var customs model.Customs
		if err := db.GetDB().First(&customs, resp.TargetID).Error; err == nil {
			resp.TargetNode = customs
		}
	}
}
