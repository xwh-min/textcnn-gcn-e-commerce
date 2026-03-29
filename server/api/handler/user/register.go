package user

import (
	"net/http"
	"server/internal/db"
	"server/internal/modle"
	"server/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

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

	// 检查用户名是否已存在
	var existingUser modle.User
	result := db.GetDB().Where("username = ?", req.Username).First(&existingUser)
	if result.Error == nil {
		logrus.WithField("username", req.Username).Warn("用户名已存在")
		c.JSON(http.StatusConflict, RegisterResponse{
			Code:    409,
			Message: "用户名已存在",
		})
		return
	}

	// 检查邮箱是否已存在
	result = db.GetDB().Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		logrus.WithField("email", req.Email).Warn("邮箱已存在")
		c.JSON(http.StatusConflict, RegisterResponse{
			Code:    409,
			Message: "邮箱已存在",
		})
		return
	}

	// 对密码进行哈希处理
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logrus.WithError(err).WithFields(logrus.Fields{"username": req.Username, "email": req.Email}).Error("密码哈希失败")
		c.JSON(http.StatusInternalServerError, RegisterResponse{
			Code:    500,
			Message: "密码处理失败: " + err.Error(),
		})
		return
	}

	// 创建用户
	user := modle.User{
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

	// 生成 JWT token
	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		logrus.WithError(err).WithField("username", req.Username).Error("生成 token 失败")
		c.JSON(http.StatusInternalServerError, RegisterResponse{
			Code:    500,
			Message: "生成 token 失败: " + err.Error(),
		})
		return
	}

	// 注册成功，记录日志
	logrus.WithFields(logrus.Fields{
		"username": user.Username,
		"user_id":  user.ID,
	}).Info("注册成功")

	// 返回注册成功响应
	c.JSON(http.StatusOK, RegisterResponse{
		Code:    200,
		Message: "注册成功",
		Token:   token,
		User: &UserInfo{
			ID:       user.ID,
			Username: user.Username,
		},
	})
}
