package user

import (
	"net/http"
	"server/internal/db"
	"server/internal/utils"

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

	// 检查是否提供了用户名或邮箱
	if req.Username == "" && req.Email == "" {
		logrus.Warn("未提供用户名或邮箱")
		c.JSON(http.StatusBadRequest, LoginResponse{
			Code:    400,
			Message: "请提供用户名或邮箱",
		})
		return
	}

	logrus.WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Info("收到登录请求")

	// 查询用户（使用 LIKE 操作符匹配 {username} 或 {email} 格式）
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
		// 通过邮箱查找
		query = `SELECT id, email, username, password FROM users WHERE email = ?`
		result = db.GetDB().Raw(query, req.Email).Scan(&user)
	} else {
		// 通过用户名查找
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

	// 验证密码
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		logrus.WithError(err).WithField("username", req.Username).Warn("密码验证失败")
		c.JSON(http.StatusUnauthorized, LoginResponse{
			Code:    401,
			Message: "密码错误",
		})
		return
	}

	// 处理用户名，去掉 { 和 } 字符
	cleanUsername := user.Username
	//if len(cleanUsername) > 0 && cleanUsername[0] == '{' && cleanUsername[len(cleanUsername)-1] == '}' {
	//	cleanUsername = cleanUsername[1 : len(cleanUsername)-1]
	//}

	// 生成 JWT token
	token, err := utils.GenerateToken(user.ID, cleanUsername)
	if err != nil {
		logrus.WithError(err).WithField("username", req.Username).Error("生成 token 失败")
		c.JSON(http.StatusInternalServerError, LoginResponse{
			Code:    500,
			Message: "生成 token 失败: " + err.Error(),
		})
		return
	}

	// 登录成功，记录日志
	logrus.WithFields(logrus.Fields{
		"username": cleanUsername,
		"user_id":  user.ID,
	}).Info("登录成功")

	// 返回登录成功响应
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
