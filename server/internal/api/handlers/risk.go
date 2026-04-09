package handlers

import (
	"server/globle"
	"server/inference"
	"server/internal/db"
	"server/repository"
	"server/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var (
	ErrDatabaseNotInitialized = errors.New("database not initialized")
)

var riskService *service.RiskPredictionService

func InitRiskPredictor() error {
	onnxConfig := globle.Conf.ONNX

	onnxInf, err := inference.NewONNXInference(inference.Config{
		ModelPath: onnxConfig.ModelPath,
		InputSize: onnxConfig.InputSize,
	})
	if err != nil {
		logrus.WithError(err).Error("Failed to initialize ONNX inference")
		return err
	}

	featureExtractor := inference.NewFeatureExtractor(128, 64)

	database := db.GetDB()
	if database == nil {
		logrus.Error("Database not initialized")
		return ErrDatabaseNotInitialized
	}

	riskRepo := repository.NewRiskPredictionRepository(database)
	companyRepo := repository.NewCompanyRepository(database)
	policyNewsRepo := repository.NewPolicyNewsRepository(database)
	complaintRepo := repository.NewUserComplaintRepository(database)
	orderRepo := repository.NewOrderRepository(database)
	logisticsRepo := repository.NewLogisticsRecordRepository(database)
	relationRepo := repository.NewRelationRepository(database)

	riskService = service.NewRiskPredictionService(
		onnxInf,
		featureExtractor,
		riskRepo,
		companyRepo,
		policyNewsRepo,
		complaintRepo,
		orderRepo,
		logisticsRepo,
		relationRepo,
	)

	logrus.Info("Risk prediction service initialized successfully")
	if onnxInf.IsMock() {
		logrus.Warn("⚠️  ONNX model not loaded, using mock implementation")
	} else {
		logrus.Info("✓ ONNX model loaded and ready")
	}

	return nil
}

func CloseRiskPredictor() error {
	logrus.Info("Risk prediction service closed")
	return nil
}

type PredictRequest struct {
	CompanyName    string              `json:"company_name" binding:"required"`
	RecentData     string              `json:"recent_data"`
	PolicyNews     []string            `json:"policy_news"`
	UserComplaints []string            `json:"user_complaints"`
	GraphStructure map[string][]string `json:"graph_structure"`
}

type PredictResponse struct {
	Code    int                           `json:"code"`
	Message string                        `json:"message"`
	Result  *service.RiskPredictionResult `json:"result,omitempty"`
}

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

	if riskService == nil {
		logrus.Error("Risk service not initialized")
		c.JSON(http.StatusInternalServerError, PredictResponse{
			Code:    500,
			Message: "Risk service not initialized",
		})
		return
	}

	result, err := riskService.Predict(c.Request.Context(), &service.RiskPredictionRequest{
		CompanyName:    req.CompanyName,
		RecentData:     req.RecentData,
		PolicyNews:     req.PolicyNews,
		UserComplaints: req.UserComplaints,
		GraphStructure: req.GraphStructure,
	})
	if err != nil {
		logrus.WithError(err).WithField("company", req.CompanyName).Error("Prediction failed")
		c.JSON(http.StatusInternalServerError, PredictResponse{
			Code:    500,
			Message: "Prediction failed: " + err.Error(),
		})
		return
	}

	logrus.WithField("company", req.CompanyName).Info("Prediction completed successfully")
	c.JSON(http.StatusOK, PredictResponse{
		Code:    200,
		Message: "Prediction completed successfully",
		Result:  result,
	})
}

type BatchPredictRequest struct {
	CompanyNames []string `json:"company_names" binding:"required"`
}

type BatchPredictResponse struct {
	Code    int                             `json:"code"`
	Message string                          `json:"message"`
	Results []*service.RiskPredictionResult `json:"results,omitempty"`
}

func BatchPredict(c *gin.Context) {
	var req BatchPredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid batch predict request")
		c.JSON(http.StatusBadRequest, BatchPredictResponse{
			Code:    400,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	if riskService == nil {
		logrus.Error("Risk service not initialized")
		c.JSON(http.StatusInternalServerError, BatchPredictResponse{
			Code:    500,
			Message: "Risk service not initialized",
		})
		return
	}

	results, err := riskService.BatchPredict(c.Request.Context(), req.CompanyNames)
	if err != nil {
		logrus.WithError(err).Error("Batch prediction failed")
		c.JSON(http.StatusInternalServerError, BatchPredictResponse{
			Code:    500,
			Message: "Batch prediction failed: " + err.Error(),
		})
		return
	}

	logrus.Infof("Batch prediction completed: %d results", len(results))
	c.JSON(http.StatusOK, BatchPredictResponse{
		Code:    200,
		Message: "Batch prediction completed successfully",
		Results: results,
	})
}

type PredictionHistoryRequest struct {
	CompanyName string `json:"company_name" binding:"required"`
	Limit       int    `json:"limit"`
}

type PredictionHistoryResponse struct {
	Code    int                          `json:"code"`
	Message string                       `json:"message"`
	Results []*repository.RiskPrediction `json:"results,omitempty"`
}

func PredictionHistory(c *gin.Context) {
	var req PredictionHistoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid history request")
		c.JSON(http.StatusBadRequest, PredictionHistoryResponse{
			Code:    400,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	if riskService == nil {
		logrus.Error("Risk service not initialized")
		c.JSON(http.StatusInternalServerError, PredictionHistoryResponse{
			Code:    500,
			Message: "Risk service not initialized",
		})
		return
	}

	if req.Limit <= 0 {
		req.Limit = 10
	}

	results, err := riskService.GetPredictionHistory(c.Request.Context(), req.CompanyName, req.Limit)
	if err != nil {
		logrus.WithError(err).WithField("company", req.CompanyName).Error("Failed to get prediction history")
		c.JSON(http.StatusInternalServerError, PredictionHistoryResponse{
			Code:    500,
			Message: "Failed to get prediction history: " + err.Error(),
		})
		return
	}

	logrus.WithField("company", req.CompanyName).Infof("Retrieved %d prediction records", len(results))
	c.JSON(http.StatusOK, PredictionHistoryResponse{
		Code:    200,
		Message: "Prediction history retrieved successfully",
		Results: results,
	})
}
