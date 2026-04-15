package api

import (
	"server/internal/api/handlers"
	"server/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter 设置路由
func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())
	r.Use(middleware.OperationLogger())

	RegisterUserRoutes(r)
	RegisterRiskRoutes(r)
	RegisterCompanyRoutes(r)
	RegisterLogisticsRoutes(r)
	RegisterCustomsRoutes(r)
	RegisterRelationRoutes(r)
	RegisterPolicyNewsRoutes(r)
	RegisterComplaintRoutes(r)
	RegisterOrderRoutes(r)
	RegisterLogisticsRecordRoutes(r)
	RegisterRoleRoutes(r)
	RegisterOperationLogRoutes(r)
	RegisterAPIKeyRoutes(r)

	return r
}

// RegisterUserRoutes 注册用户相关路由
func RegisterUserRoutes(r *gin.Engine) {
	public := r.Group("/api")
	{
		public.POST("/login", handlers.Login)
		public.POST("/register", handlers.Register)
	}

	protected := r.Group("/api")
	protected.Use(middleware.JWTAuth())
	{
		protected.GET("/user", handlers.GetCurrentUser)
		protected.GET("/query-history", handlers.GetQueryHistory)
		protected.DELETE("/query-history/:id", handlers.DeleteQueryHistory)
	}

	admin := r.Group("/api")
	admin.Use(middleware.JWTAuth(), middleware.AdminOnly())
	{
		admin.GET("/users", handlers.GetUserList)
		admin.POST("/user", handlers.CreateUser)
		admin.PUT("/user/:id", handlers.UpdateUser)
		admin.POST("/user/:id/reset-password", handlers.ResetUserPassword)
		admin.POST("/user/:id/status", handlers.SetUserStatus)
	}
}

// RegisterRiskRoutes 注册风险预测相关路由
func RegisterRiskRoutes(r *gin.Engine) {
	protected := r.Group("/api/v1/risk")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("/predict", handlers.Predict)
		protected.POST("/predict/batch", handlers.BatchPredict)
		protected.GET("/predictions", handlers.PredictionHistory)
		protected.GET("/report", handlers.PredictionReport)
		protected.GET("/health", handlers.PredictorHealth)
	}
}

// RegisterCompanyRoutes 注册企业相关路由
func RegisterCompanyRoutes(r *gin.Engine) {
	protected := r.Group("/api/company")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateCompany)
		protected.GET("", handlers.GetCompanyList)
		protected.GET("/:id", handlers.GetCompanyDetail)
		protected.PUT("/:id", handlers.UpdateCompany)
		protected.DELETE("/:id", handlers.DeleteCompany)
		protected.POST("/:id/mark-high-risk", handlers.MarkHighRisk)
	}
}

// RegisterLogisticsRoutes 注册物流商相关路由
func RegisterLogisticsRoutes(r *gin.Engine) {
	protected := r.Group("/api/logistics")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateLogistics)
		protected.GET("", handlers.GetLogisticsList)
		protected.GET("/:id", handlers.GetLogisticsDetail)
		protected.PUT("/:id", handlers.UpdateLogistics)
		protected.DELETE("/:id", handlers.DeleteLogistics)
		protected.POST("/:id/mark-high-risk", handlers.MarkLogisticsHighRisk)
	}
}

// RegisterCustomsRoutes 注册海关相关路由
func RegisterCustomsRoutes(r *gin.Engine) {
	protected := r.Group("/api/customs")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateCustoms)
		protected.GET("", handlers.GetCustomsList)
		protected.GET("/:id", handlers.GetCustomsDetail)
		protected.PUT("/:id", handlers.UpdateCustoms)
		protected.DELETE("/:id", handlers.DeleteCustoms)
	}
}

// RegisterRoleRoutes 注册角色相关路由
func RegisterRoleRoutes(r *gin.Engine) {
	protected := r.Group("/api/role")
	protected.Use(middleware.JWTAuth(), middleware.AdminOnly())
	{
		protected.POST("", handlers.CreateRole)
		protected.GET("", handlers.GetRoleList)
		protected.GET("/:id", handlers.GetRoleDetail)
		protected.PUT("/:id", handlers.UpdateRole)
		protected.DELETE("/:id", handlers.DeleteRole)
	}
}

// RegisterRelationRoutes 注册图关系相关路由
func RegisterRelationRoutes(r *gin.Engine) {
	protected := r.Group("/api/relation")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateRelation)
		protected.GET("", handlers.GetRelationList)
		protected.GET("/:id", handlers.GetRelationDetail)
		protected.PUT("/:id", handlers.UpdateRelation)
		protected.POST("/:id/terminate", handlers.TerminateRelation)

		// 企业关系图谱专用路由
		protected.GET("/company/:id", handlers.GetCompanyGraph)
	}
}

// RegisterPolicyNewsRoutes 注册政策新闻相关路由
func RegisterPolicyNewsRoutes(r *gin.Engine) {
	protected := r.Group("/api/policy-news")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreatePolicyNews)
		protected.GET("", handlers.GetPolicyNewsList)
		protected.GET("/:id", handlers.GetPolicyNewsDetail)
		protected.PUT("/:id", handlers.UpdatePolicyNews)
		protected.DELETE("/:id", handlers.DeletePolicyNews)
	}
}

// RegisterComplaintRoutes 注册用户投诉相关路由
func RegisterComplaintRoutes(r *gin.Engine) {
	protected := r.Group("/api/complaint")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateComplaint)
		protected.GET("", handlers.GetComplaintList)
		protected.GET("/:id", handlers.GetComplaintDetail)
		protected.PUT("/:id", handlers.UpdateComplaint)
		protected.DELETE("/:id", handlers.DeleteComplaint)
		protected.POST("/:id/mark-processed", handlers.MarkComplaintProcessed)
	}
}

// RegisterOrderRoutes 注册订单数据相关路由
func RegisterOrderRoutes(r *gin.Engine) {
	protected := r.Group("/api/order")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateOrder)
		protected.POST("/batch-import", handlers.BatchImportOrders)
		protected.GET("", handlers.GetOrderList)
		protected.GET("/:id", handlers.GetOrderDetail)
		protected.PUT("/:id", handlers.UpdateOrder)
		protected.DELETE("/:id", handlers.DeleteOrder)
	}
}

// RegisterLogisticsRecordRoutes 注册物流记录相关路由
func RegisterLogisticsRecordRoutes(r *gin.Engine) {
	protected := r.Group("/api/logistics-record")
	protected.Use(middleware.JWTAuth())
	{
		protected.POST("", handlers.CreateLogisticsRecord)
		protected.GET("", handlers.GetLogisticsRecordList)
		protected.GET("/:id", handlers.GetLogisticsRecordDetail)
		protected.PUT("/:id", handlers.UpdateLogisticsRecord)
		protected.DELETE("/:id", handlers.DeleteLogisticsRecord)
	}
}

// RegisterOperationLogRoutes 注册操作日志相关路由
func RegisterOperationLogRoutes(r *gin.Engine) {
	protected := r.Group("/api/operation-log")
	protected.Use(middleware.JWTAuth())
	{
		protected.GET("", handlers.GetOperationLogList)
		protected.GET("/:id", handlers.GetOperationLogDetail)
	}
}
