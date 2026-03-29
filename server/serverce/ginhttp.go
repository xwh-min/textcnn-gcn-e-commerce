package serverce

import (
	"fmt"
	"server/api/handler/user"
	"server/api/middleware"
	"server/globle"

	"github.com/gin-gonic/gin"
)

func GetGIn() {
	ginServer := gin.Default()

	// 添加 CORS 中间件
	ginServer.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 登录路由
	ginServer.POST("/api/login", user.Login)
	// 注册路由
	ginServer.POST("/api/register", user.Register)

	// 受保护的路由组
	protected := ginServer.Group("/api")
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

	// 启动服务器
	addr := fmt.Sprintf(":%s", globle.Conf.System.Port)
	fmt.Println("Starting Gin server on", addr)
	ginServer.Run(addr)
}
