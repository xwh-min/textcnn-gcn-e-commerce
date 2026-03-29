package router

import (
	"server/api/handler/risk"

	"github.com/gin-gonic/gin"
)

// RegisterRiskRoutes 注册风险预测相关路由
func RegisterRiskRoutes(r *gin.Engine) {
	// 公开路由
	public := r.Group("/api")
	{
		public.POST("/risk/predict", risk.Predict)
	}
}
