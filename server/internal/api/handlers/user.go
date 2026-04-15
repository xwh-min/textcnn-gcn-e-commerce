package handlers

import (
	"encoding/json"
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"server/internal/utils"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// LoginRequest 登录请求结构
type LoginRequest struct {
	Username string `json:"username" binding:"omitempty"`
	Email    string `json:"email" binding:"omitempty,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应结构
type LoginResponse struct {
	Code    int       `json:"code"`
	Message string    `json:"message"`
	Token   string    `json:"token,omitempty"`
	User    *UserInfo `json:"user,omitempty"`
}

// UserInfo 用户信息结构
type UserInfo struct {
	ID          int      `json:"id"`
	Username    string   `json:"username"`
	Email       string   `json:"email,omitempty"`
	Role        string   `json:"role,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
}

// RegisterRequest 注册请求结构
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
}

// RegisterResponse 注册响应结构
type RegisterResponse struct {
	Code    int       `json:"code"`
	Message string    `json:"message"`
	Token   string    `json:"token,omitempty"`
	User    *UserInfo `json:"user,omitempty"`
}

// GetQueryHistoryRequest 获取查询历史请求
type GetQueryHistoryRequest struct {
	Limit     int    `form:"limit" binding:"omitempty,min=1,max=100"`
	QueryType string `form:"type" binding:"omitempty"`
}

// GetQueryHistoryResponse 获取查询历史响应
type GetQueryHistoryResponse struct {
	Code    int                `json:"code"`
	Message string             `json:"message"`
	Queries []QueryHistoryItem `json:"queries"`
}

// QueryHistoryItem 查询历史项
type QueryHistoryItem struct {
	ID        int64  `json:"id"`
	QueryType string `json:"query_type"`
	QueryText string `json:"query_text"`
	Result    string `json:"result"`
	CreatedAt string `json:"created_at"`
}

type UserListItem struct {
	ID         int64  `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email,omitempty"`
	Role       string `json:"role"`
	Status     string `json:"status"`
	CreateTime string `json:"createTime"`
}

type UserListResponse struct {
	Code    int            `json:"code"`
	Message string         `json:"message"`
	Data    []UserListItem `json:"data"`
	Total   int64          `json:"total"`
}

type CreateSysUserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type UpdateSysUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required"`
}

type SetStatusRequest struct {
	Enabled bool `json:"enabled"`
}

func parseRolePermissions(role model.SysRole) []string {
	if strings.TrimSpace(role.Permissions) == "" {
		return []string{}
	}
	var perms []string
	if err := json.Unmarshal([]byte(role.Permissions), &perms); err != nil {
		return []string{}
	}
	return perms
}

func getDefaultRoleID() int64 {
	var role model.SysRole
	if err := db.GetDB().Where("role_name = ?", "普通用户").First(&role).Error; err == nil {
		return role.ID
	}
	if err := db.GetDB().Order("id asc").First(&role).Error; err == nil {
		return role.ID
	}

	defaultPerms, _ := json.Marshal([]string{"dashboard_view", "detection_single", "risks_view"})
	role = model.SysRole{RoleName: "普通用户", Description: "默认角色", Permissions: string(defaultPerms)}
	if err := db.GetDB().Create(&role).Error; err == nil {
		return role.ID
	}
	return 0
}

// Login 处理登录请求（方案A：优先 sys_user + sys_role）
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Warn("登录请求参数错误")
		c.JSON(http.StatusBadRequest, LoginResponse{Code: 400, Message: "请求参数错误: " + err.Error()})
		return
	}

	if req.Username == "" && req.Email == "" {
		c.JSON(http.StatusBadRequest, LoginResponse{Code: 400, Message: "请提供用户名或邮箱"})
		return
	}

	// 1) 先走 sys_user（RBAC）
	var sysUser model.SysUser
	sysQuery := db.GetDB().Preload("Role")
	if req.Username != "" {
		sysQuery = sysQuery.Where("username = ?", req.Username)
	} else {
		// sys_user 无 email 字段，邮箱登录降级到 legacy users
		sysQuery = sysQuery.Where("1 = 0")
	}
	err := sysQuery.First(&sysUser).Error
	if err == nil {
		if !sysUser.IsActive {
			c.JSON(http.StatusUnauthorized, LoginResponse{Code: 401, Message: "账号已被禁用"})
			return
		}
		if bcrypt.CompareHashAndPassword([]byte(sysUser.PasswordHash), []byte(req.Password)) != nil {
			c.JSON(http.StatusUnauthorized, LoginResponse{Code: 401, Message: "密码错误"})
			return
		}

		token, tkErr := utils.GenerateToken(int(sysUser.ID), sysUser.Username)
		if tkErr != nil {
			c.JSON(http.StatusInternalServerError, LoginResponse{Code: 500, Message: "生成 token 失败: " + tkErr.Error()})
			return
		}

		permissions := parseRolePermissions(sysUser.Role)
		c.JSON(http.StatusOK, LoginResponse{
			Code:    200,
			Message: "登录成功",
			Token:   token,
			User: &UserInfo{
				ID:          int(sysUser.ID),
				Username:    sysUser.Username,
				Role:        sysUser.Role.RoleName,
				Permissions: permissions,
			},
		})
		return
	}

	// 2) 兼容旧 users 表（避免现有注册用户无法登录）
	type UserResult struct {
		ID       int
		Email    string
		Username string
		Password string
	}
	var user UserResult
	var result *gorm.DB
	if req.Email != "" {
		result = db.GetDB().Raw(`SELECT id, email, username, password FROM users WHERE email = ?`, req.Email).Scan(&user)
	} else {
		result = db.GetDB().Raw(`SELECT id, email, username, password FROM users WHERE username = ?`, req.Username).Scan(&user)
	}
	if result.Error != nil || user.ID == 0 {
		c.JSON(http.StatusUnauthorized, LoginResponse{Code: 401, Message: "用户不存在"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, LoginResponse{Code: 401, Message: "密码错误"})
		return
	}

	token, tkErr := utils.GenerateToken(user.ID, user.Username)
	if tkErr != nil {
		c.JSON(http.StatusInternalServerError, LoginResponse{Code: 500, Message: "生成 token 失败: " + tkErr.Error()})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Code:    200,
		Message: "登录成功",
		Token:   token,
		User: &UserInfo{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			Role:        "普通用户",
			Permissions: []string{"dashboard_view", "detection_single", "risks_view"},
		},
	})
}

// Register 处理注册请求（兼容 legacy users）
func Register(c *gin.Context) {
	var req RegisterRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).WithField("username", req.Username).Warn("注册请求参数错误")
		c.JSON(http.StatusBadRequest, RegisterResponse{Code: 400, Message: "请求参数错误: " + err.Error()})
		return
	}

	var existingUser model.User
	result := db.GetDB().Where("username = ?", req.Username).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusConflict, RegisterResponse{Code: 409, Message: "用户名已存在"})
		return
	}
	result = db.GetDB().Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusConflict, RegisterResponse{Code: 409, Message: "邮箱已存在"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, RegisterResponse{Code: 500, Message: "密码处理失败: " + err.Error()})
		return
	}

	user := model.User{Username: req.Username, Password: string(hashedPassword), Email: req.Email}
	if err := db.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, RegisterResponse{Code: 500, Message: "创建用户失败: " + err.Error()})
		return
	}

	token, err := utils.GenerateToken(int(user.ID), user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, RegisterResponse{Code: 500, Message: "生成 token 失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, RegisterResponse{
		Code:    200,
		Message: "注册成功",
		Token:   token,
		User: &UserInfo{
			ID:          int(user.ID),
			Username:    user.Username,
			Email:       user.Email,
			Role:        "普通用户",
			Permissions: []string{"dashboard_view", "detection_single", "risks_view"},
		},
	})
}

// GetCurrentUser 获取当前登录用户（返回 role + permissions）
func GetCurrentUser(c *gin.Context) {
	userID := c.GetInt("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}

	var sysUser model.SysUser
	if err := db.GetDB().Preload("Role").First(&sysUser, userID).Error; err == nil {
		permissions := parseRolePermissions(sysUser.Role)
		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "获取用户信息成功",
			"data": gin.H{
				"id":          sysUser.ID,
				"username":    sysUser.Username,
				"role":        sysUser.Role.RoleName,
				"permissions": permissions,
			},
			"user": gin.H{
				"id":          sysUser.ID,
				"username":    sysUser.Username,
				"role":        sysUser.Role.RoleName,
				"permissions": permissions,
			},
		})
		return
	}

	// legacy fallback
	var user model.User
	if err := db.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "获取用户信息成功",
		"data": gin.H{
			"id":          user.ID,
			"username":    user.Username,
			"email":       user.Email,
			"role":        "普通用户",
			"permissions": []string{"dashboard_view", "detection_single", "risks_view"},
		},
		"user": gin.H{
			"id":          user.ID,
			"username":    user.Username,
			"email":       user.Email,
			"role":        "普通用户",
			"permissions": []string{"dashboard_view", "detection_single", "risks_view"},
		},
	})
}

// GetUserList 获取系统用户列表
func GetUserList(c *gin.Context) {
	username := c.Query("username")
	role := c.Query("role")

	query := db.GetDB().Model(&model.SysUser{}).Preload("Role")
	if username != "" {
		query = query.Where("username LIKE ?", "%"+username+"%")
	}
	if role != "" {
		query = query.Joins("JOIN sys_role ON sys_role.id = sys_user.role_id").Where("sys_role.role_name = ?", role)
	}

	var total int64
	query.Count(&total)

	var users []model.SysUser
	if err := query.Order("id desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, UserListResponse{Code: 500, Message: "获取用户列表失败"})
		return
	}

	data := make([]UserListItem, 0, len(users))
	for _, u := range users {
		status := "disabled"
		if u.IsActive {
			status = "active"
		}
		data = append(data, UserListItem{
			ID:         u.ID,
			Username:   u.Username,
			Role:       u.Role.RoleName,
			Status:     status,
			CreateTime: u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, UserListResponse{Code: 200, Message: "获取成功", Data: data, Total: total})
}

// CreateUser 创建系统用户
func CreateUser(c *gin.Context) {
	var req CreateSysUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	var existing model.SysUser
	if err := db.GetDB().Where("username = ?", req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"code": 409, "message": "用户名已存在"})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}

	roleID := getDefaultRoleID()
	if strings.TrimSpace(req.Role) != "" {
		var role model.SysRole
		if err := db.GetDB().Where("role_name = ?", req.Role).First(&role).Error; err == nil {
			roleID = role.ID
		}
	}

	user := model.SysUser{Username: req.Username, PasswordHash: string(passwordHash), RoleID: roleID, IsActive: true}
	if err := db.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "创建用户失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "创建成功", "data": gin.H{"id": user.ID}})
}

// UpdateUser 更新系统用户
func UpdateUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "无效的用户ID"})
		return
	}

	var req UpdateSysUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	var user model.SysUser
	if err := db.GetDB().First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "用户不存在"})
		return
	}

	if strings.TrimSpace(req.Username) != "" {
		user.Username = req.Username
	}
	if strings.TrimSpace(req.Role) != "" {
		var role model.SysRole
		if err := db.GetDB().Where("role_name = ?", req.Role).First(&role).Error; err == nil {
			user.RoleID = role.ID
		}
	}

	if err := db.GetDB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新失败: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "更新成功"})
}

// ResetUserPassword 重置用户密码
func ResetUserPassword(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "无效的用户ID"})
		return
	}

	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "密码加密失败"})
		return
	}

	if err := db.GetDB().Model(&model.SysUser{}).Where("id = ?", id).Update("password_hash", string(passwordHash)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "重置失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "重置成功"})
}

// SetUserStatus 设置用户启停状态
func SetUserStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "无效的用户ID"})
		return
	}

	var req SetStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "请求参数错误: " + err.Error()})
		return
	}

	if err := db.GetDB().Model(&model.SysUser{}).Where("id = ?", id).Update("is_active", req.Enabled).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "更新状态失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "更新成功"})
}

// GetQueryHistory 获取用户查询历史
func GetQueryHistory(c *gin.Context) {
	userID := c.GetInt("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, GetQueryHistoryResponse{
			Code:    401,
			Message: "未授权",
		})
		return
	}

	var req GetQueryHistoryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, GetQueryHistoryResponse{
			Code:    400,
			Message: "请求参数错误",
		})
		return
	}

	var queries []model.UserQuery
	var err error

	if c.Query("week") == "true" {
		if req.QueryType != "" {
			queries, err = utils.GetUserQueriesLastWeekByType(userID, req.QueryType)
		} else {
			queries, err = utils.GetUserQueriesLastWeek(userID)
		}
	} else {
		if req.Limit == 0 {
			req.Limit = 20
		}

		if req.QueryType != "" {
			queries, err = utils.GetUserQueriesByType(userID, req.QueryType, req.Limit)
		} else {
			queries, err = utils.GetUserQueries(userID, req.Limit)
		}
	}

	if err != nil {
		logrus.WithError(err).WithField("user_id", userID).Error("获取查询历史失败")
		c.JSON(http.StatusInternalServerError, GetQueryHistoryResponse{
			Code:    500,
			Message: "获取查询历史失败",
		})
		return
	}

	items := make([]QueryHistoryItem, len(queries))
	for i, q := range queries {
		items[i] = QueryHistoryItem{
			ID:        q.ID,
			QueryType: q.QueryType,
			QueryText: q.QueryText,
			Result:    q.Result,
			CreatedAt: q.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	c.JSON(http.StatusOK, GetQueryHistoryResponse{
		Code:    200,
		Message: "获取查询历史成功",
		Queries: items,
	})
}

// DeleteQueryHistory 删除查询历史
func DeleteQueryHistory(c *gin.Context) {
	userID := c.GetInt("userID")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "未授权",
		})
		return
	}

	queryIDStr := c.Param("id")
	queryID, err := strconv.Atoi(queryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的查询ID",
		})
		return
	}

	err = utils.DeleteUserQuery(queryID, userID)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{
			"user_id":  userID,
			"query_id": queryID,
		}).Error("删除查询历史失败")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除查询历史失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "删除查询历史成功",
	})
}
