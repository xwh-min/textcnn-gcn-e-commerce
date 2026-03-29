package router

import (
	"server/api/handler/user"
	"server/api/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterUserRoutes 注册用户相关路由
func RegisterUserRoutes(r *gin.Engine) {
	// 公开路由
	public := r.Group("/api")
	{
		public.POST("/login", user.Login)
		public.POST("/register", user.Register)
	}

	// 受保护的路由
	protected := r.Group("/api")
	protected.Use(middleware.JWTAuth())
	{
		protected.GET("/user", func(c *gin.Context) {
			userID := c.GetInt("userID")
			username := c.GetString("username")
			c.JSON(200, gin.H{
				"code":    200,
				"message": "获取用户信息成功",
				"user": gin.H{
					"id":       userID,
					"username": username,
				},
			})
		})
	}
}
