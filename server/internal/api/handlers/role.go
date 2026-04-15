package handlers

import (
	"encoding/json"
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateRoleRequest 创建角色请求
type CreateRoleRequest struct {
	RoleName    string   `json:"role_name" binding:"required"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// UpdateRoleRequest 更新角色请求
type UpdateRoleRequest struct {
	RoleName    string   `json:"role_name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// RoleResponse 角色响应
type RoleResponse struct {
	ID          int64    `json:"id"`
	RoleName    string   `json:"role_name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
}

// RoleListResponse 角色列表响应
type RoleListResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    []RoleResponse  `json:"data"`
	Total   int64           `json:"total"`
}

// RoleDetailResponse 角色详情响应
type RoleDetailResponse struct {
	Code    int            `json:"code"`
	Message string         `json:"message"`
	Data    *RoleResponse  `json:"data"`
}

// CreateRole 创建角色
func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var existing model.SysRole
	result := db.GetDB().Where("role_name = ?", req.RoleName).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "该角色已存在",
		})
		return
	}

	permissionsJSON, _ := json.Marshal(req.Permissions)
	role := model.SysRole{
		RoleName:    req.RoleName,
		Description: req.Description,
		Permissions: string(permissionsJSON),
	}

	if err := db.GetDB().Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建角色失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, RoleDetailResponse{
		Code:    200,
		Message: "创建成功",
		Data:    roleToResponse(&role),
	})
}

// GetRoleList 获取角色列表
func GetRoleList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	roleName := c.Query("role_name")

	query := db.GetDB().Model(&model.SysRole{})

	if roleName != "" {
		query = query.Where("role_name LIKE ?", "%"+roleName+"%")
	}

	var total int64
	query.Count(&total)

	var roles []model.SysRole
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, RoleListResponse{
			Code:    500,
			Message: "获取角色列表失败",
		})
		return
	}

	data := make([]RoleResponse, len(roles))
	for i, role := range roles {
		data[i] = *roleToResponse(&role)
	}

	c.JSON(http.StatusOK, RoleListResponse{
		Code:    200,
		Message: "获取成功",
		Data:    data,
		Total:   total,
	})
}

// GetRoleDetail 获取角色详情
func GetRoleDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的角色 ID",
		})
		return
	}

	var role model.SysRole
	if err := db.GetDB().First(&role, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "角色不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取角色详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, RoleDetailResponse{
		Code:    200,
		Message: "获取成功",
		Data:    roleToResponse(&role),
	})
}

// UpdateRole 更新角色
func UpdateRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的角色 ID",
		})
		return
	}

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误：" + err.Error(),
		})
		return
	}

	var role model.SysRole
	if err := db.GetDB().First(&role, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "角色不存在",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新角色失败",
		})
		return
	}

	if req.RoleName != "" {
		role.RoleName = req.RoleName
	}
	if req.Description != "" {
		role.Description = req.Description
	}
	if req.Permissions != nil {
		permissionsJSON, _ := json.Marshal(req.Permissions)
		role.Permissions = string(permissionsJSON)
	}

	if err := db.GetDB().Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新角色失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, RoleDetailResponse{
		Code:    200,
		Message: "更新成功",
		Data:    roleToResponse(&role),
	})
}

// DeleteRole 删除角色
func DeleteRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的角色 ID",
		})
		return
	}

	var count int64
	if err := db.GetDB().Model(&model.SysUser{}).Where("role_id = ?", id).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "检查角色使用情况失败",
		})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "该角色下有用户，不可删除",
		})
		return
	}

	if err := db.GetDB().Delete(&model.SysRole{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除角色失败：" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除成功",
	})
}

func roleToResponse(role *model.SysRole) *RoleResponse {
	var permissions []string
	json.Unmarshal([]byte(role.Permissions), &permissions)

	return &RoleResponse{
		ID:          role.ID,
		RoleName:    role.RoleName,
		Description: role.Description,
		Permissions: permissions,
		CreatedAt:   role.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   role.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
