package risk

import (
	"net/http"
	"server/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// 全局预测器实例
var riskPredictor *model.RiskPredictor

// InitRiskPredictor 初始化风险预测器
func InitRiskPredictor() error {
	modelPath := model.GetModelPath()
	predictor, err := model.NewRiskPredictor(modelPath)
	if err != nil {
		logrus.WithError(err).Error("Failed to initialize risk predictor")
		return err
	}
	riskPredictor = predictor
	logrus.Info("Risk predictor initialized successfully")
	return nil
}

// CloseRiskPredictor 关闭风险预测器
func CloseRiskPredictor() error {
	if riskPredictor != nil {
		return riskPredictor.Close()
	}
	return nil
}

// PredictRequest 风险预测请求结构
type PredictRequest struct {
	CompanyName    string            `json:"company_name" binding:"required"`
	RecentData     string            `json:"recent_data" binding:"required"`     // 近3个月数据
	PolicyNews     []string          `json:"policy_news"`                      // 政策新闻
	UserComplaints []string          `json:"user_complaints"`                  // 用户投诉
	GraphStructure map[string][]string `json:"graph_structure"`                // 图结构: 企业 -> 关联实体
}

// PredictResponse 风险预测响应结构
type PredictResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Result  *model.RiskResult `json:"result,omitempty"`
}

// Predict 处理风险预测请求
func Predict(c *gin.Context) {
	var req PredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid predict request")
		c.JSON(http.StatusBadRequest, PredictResponse{
			Code:    400,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// 检查预测器是否初始化
	if riskPredictor == nil {
		logrus.Error("Risk predictor not initialized")
		c.JSON(http.StatusInternalServerError, PredictResponse{
			Code:    500,
			Message: "Risk predictor not initialized",
		})
		return
	}

	// 构建预测数据
	riskData := &model.RiskData{
		CompanyName:    req.CompanyName,
		RecentData:     req.RecentData,
		PolicyNews:     req.PolicyNews,
		UserComplaints: req.UserComplaints,
		GraphStructure: req.GraphStructure,
	}

	// 执行预测
	result, err := riskPredictor.Predict(riskData)
	if err != nil {
		logrus.WithError(err).WithField("company", req.CompanyName).Error("Prediction failed")
		c.JSON(http.StatusInternalServerError, PredictResponse{
			Code:    500,
			Message: "Prediction failed: " + err.Error(),
		})
		return
	}

	// 返回预测结果
	logrus.WithField("company", req.CompanyName).Info("Prediction completed successfully")
	c.JSON(http.StatusOK, PredictResponse{
		Code:    200,
		Message: "Prediction completed successfully",
		Result:  result,
	})
}
