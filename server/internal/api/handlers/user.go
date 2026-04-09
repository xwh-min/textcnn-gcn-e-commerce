package handlers

import (
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"server/internal/utils"
	"strconv"

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
	ID       int    `json:"id"`
	Username string `json:"username"`
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

// Login 处理登录请求
func Login(c *gin.Context) {
	var req LoginRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Warn("登录请求参数错误")
		c.JSON(http.StatusBadRequest, LoginResponse{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	if req.Username == "" && req.Email == "" {
		logrus.Warn("未提供用户名或邮箱")
		c.JSON(http.StatusBadRequest, LoginResponse{
			Code:    400,
			Message: "请提供用户名或邮箱",
		})
		return
	}

	logrus.WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Info("收到登录请求")

	type UserResult struct {
		ID       int
		Email    string
		Username string
		Password string
	}
	var user UserResult
	var query string
	var result interface{}

	if req.Email != "" {
		query = `SELECT id, email, username, password FROM users WHERE email = ?`
		result = db.GetDB().Raw(query, req.Email).Scan(&user)
	} else {
		query = `SELECT id, email, username, password FROM users WHERE username = ?`
		result = db.GetDB().Raw(query, req.Username).Scan(&user)
	}

	if result.(*gorm.DB).Error != nil {
		logrus.WithError(result.(*gorm.DB).Error).WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Warn("用户不存在")
		c.JSON(http.StatusUnauthorized, LoginResponse{
			Code:    401,
			Message: "用户不存在",
		})
		return
	}
	if user.ID == 0 {
		logrus.WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Warn("用户不存在")
		c.JSON(http.StatusUnauthorized, LoginResponse{
			Code:    401,
			Message: "用户不存在",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		logrus.WithError(err).WithField("username", req.Username).Warn("密码验证失败")
		c.JSON(http.StatusUnauthorized, LoginResponse{
			Code:    401,
			Message: "密码错误",
		})
		return
	}

	cleanUsername := user.Username

	token, err := utils.GenerateToken(user.ID, cleanUsername)
	if err != nil {
		logrus.WithError(err).WithField("username", req.Username).Error("生成 token 失败")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Code:    500,
			Message: "生成 token 失败: " + err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"username": cleanUsername,
		"user_id":  user.ID,
	}).Info("登录成功")

	c.JSON(http.StatusOK, LoginResponse{
		Code:    200,
		Message: "登录成功",
		Token:   token,
		User: &UserInfo{
			ID:       user.ID,
			Username: cleanUsername,
		},
	})
}

// Register 处理注册请求
func Register(c *gin.Context) {
	var req RegisterRequest
	var err error
	if err = c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).WithField("username", req.Username).Warn("注册请求参数错误")
		c.JSON(http.StatusBadRequest, RegisterResponse{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Info("收到注册请求")

	var existingUser model.User
	result := db.GetDB().Where("username = ?", req.Username).First(&existingUser)
	if result.Error == nil {
		logrus.WithField("username", req.Username).Warn("用户名已存在")
		c.JSON(http.StatusConflict, RegisterResponse{
			Code:    409,
			Message: "用户名已存在",
		})
		return
	}

	result = db.GetDB().Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		logrus.WithField("email", req.Email).Warn("邮箱已存在")
		c.JSON(http.StatusConflict, RegisterResponse{
			Code:    409,
			Message: "邮箱已存在",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Error("密码哈希失败")
		c.JSON(http.StatusInternalServerError, RegisterResponse{
			Code:    500,
			Message: "密码处理失败: " + err.Error(),
		})
		return
	}

	user := model.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Email:    req.Email,
	}

	if err := db.GetDB().Create(&user).Error; err != nil {
		logrus.WithError(err).WithField("username", req.Username).Error("创建用户失败")
		c.JSON(http.StatusInternalServerError, RegisterResponse{
			Code:    500,
			Message: "创建用户失败: " + err.Error(),
		})
		return
	}

	token, err := utils.GenerateToken(int(user.ID), user.Username)
	if err != nil {
		logrus.WithError(err).WithField("username", req.Username).Error("生成 token 失败")
		c.JSON(http.StatusInternalServerError, RegisterResponse{
			Code:    500,
			Message: "生成 token 失败: " + err.Error(),
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"username": user.Username,
		"user_id":  user.ID,
	}).Info("注册成功")

	c.JSON(http.StatusOK, RegisterResponse{
		Code:    200,
		Message: "注册成功",
		Token:   token,
		User: &UserInfo{
			ID:       int(user.ID),
			Username: user.Username,
		},
	})
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
