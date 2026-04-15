package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"server/globle"
	"server/inference"
	"server/internal/db"
	"server/repository"
	"server/service"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var (
	ErrDatabaseNotInitialized = errors.New("database not initialized")
)

var (
	riskService      *service.RiskPredictionService
	riskPredictor    inference.Predictor
	featureSpecCheck inference.FeatureSpecCheckResult
)

func InitRiskPredictor() error {
	predictor, err := inference.NewPredictor(globle.Conf)
	if err != nil {
		logrus.WithError(err).Error("Failed to initialize inference predictor")
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

	riskPredictor = predictor
	meta := featureExtractor.FeatureMeta()
	featureSpecCheck = inference.CheckFeatureSpec(globle.Conf.ONNX.FeatureSpecPath, meta, globle.Conf.ONNX.InputSize)
	if !featureSpecCheck.Aligned {
		logrus.WithFields(logrus.Fields{
			"spec_path":   featureSpecCheck.Path,
			"spec_loaded": featureSpecCheck.Loaded,
			"error":       featureSpecCheck.Error,
		}).Warn("Feature spec is not aligned with runtime extractor")
		if globle.Conf.Inference.Strict {
			return errors.New("feature spec check failed in strict mode: " + featureSpecCheck.Error)
		}
	} else {
		logrus.WithFields(logrus.Fields{
			"schema": featureSpecCheck.ActualSchema,
			"total":  featureSpecCheck.ActualTotal,
			"source": featureSpecCheck.ActualSource,
		}).Info("Feature spec aligned")
	}

	riskService = service.NewRiskPredictionService(
		predictor,
		featureExtractor,
		riskRepo,
		companyRepo,
		policyNewsRepo,
		complaintRepo,
		orderRepo,
		logisticsRepo,
		relationRepo,
	)

	healthErr := predictor.Health(context.Background())
	logFields := logrus.Fields{
		"backend": predictor.Backend(),
		"is_mock": predictor.IsMock(),
	}
	if healthErr != nil {
		if globle.Conf.Inference.Strict {
			return healthErr
		}
		logrus.WithFields(logFields).WithError(healthErr).Warn("Predictor health check failed, service continues with configured fallback")
	} else {
		logrus.WithFields(logFields).Info("Risk prediction service initialized successfully")
	}

	return nil
}

func CloseRiskPredictor() error {
	if riskPredictor != nil {
		if err := riskPredictor.Close(); err != nil {
			logrus.WithError(err).Warn("Failed to close risk predictor")
			return err
		}
	}
	logrus.Info("Risk prediction service closed")
	return nil
}

type APIResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func respond(c *gin.Context, status int, code int, message string, data interface{}) {
	c.JSON(status, APIResponse{Code: code, Message: message, Data: data})
}

type PredictRequest struct {
	CompanyName string `json:"company_name" binding:"required"`
	RecentData  struct {
		PolicyNews     string `json:"policy_news"`
		UserComplaints string `json:"user_complaints"`
	} `json:"recent_data"`
}

type PredictData struct {
	ComplianceRisk     string                     `json:"compliance_risk"`
	PaymentRisk        string                     `json:"payment_risk"`
	Scores             service.RiskPredictionScore `json:"scores"`
	PredictionID       uint                       `json:"prediction_id,omitempty"`
	FeatureSpecAligned bool                       `json:"feature_spec_aligned"`
}

func Predict(c *gin.Context) {
	var req PredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid predict request")
		respond(c, http.StatusBadRequest, 400, "请求参数错误: "+err.Error(), nil)
		return
	}

	if riskService == nil {
		logrus.Error("Risk service not initialized")
		respond(c, http.StatusInternalServerError, 500, "risk service not initialized", nil)
		return
	}

	recentDataRaw := ""
	if req.RecentData.PolicyNews != "" || req.RecentData.UserComplaints != "" {
		recentDataRawBytes, err := json.Marshal(req.RecentData)
		if err == nil {
			recentDataRaw = string(recentDataRawBytes)
		}
	}

	result, err := riskService.Predict(c.Request.Context(), &service.RiskPredictionRequest{
		CompanyName:    req.CompanyName,
		RecentData:     recentDataRaw,
		PolicyNews:     toSliceIfNotEmpty(req.RecentData.PolicyNews),
		UserComplaints: toSliceIfNotEmpty(req.RecentData.UserComplaints),
	})
	if err != nil {
		logrus.WithError(err).WithField("company", req.CompanyName).Error("Prediction failed")
		respond(c, http.StatusInternalServerError, 500, "prediction failed: "+err.Error(), nil)
		return
	}

	logrus.WithField("company", req.CompanyName).Info("Prediction completed successfully")
	respond(c, http.StatusOK, 200, "ok", PredictData{
		ComplianceRisk:     result.ComplianceRisk,
		PaymentRisk:        result.PaymentRisk,
		Scores:             result.Scores,
		PredictionID:       result.PredictionID,
		FeatureSpecAligned: featureSpecCheck.Aligned,
	})
}

func toSliceIfNotEmpty(s string) []string {
	if s == "" {
		return nil
	}
	return []string{s}
}

type BatchPredictRequest struct {
	CompanyNames []string `json:"company_names" binding:"required"`
}

type BatchPredictData struct {
	Items []*service.RiskPredictionResult `json:"items"`
	Count int                             `json:"count"`
}

func BatchPredict(c *gin.Context) {
	var req BatchPredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Warn("Invalid batch predict request")
		respond(c, http.StatusBadRequest, 400, "请求参数错误: "+err.Error(), nil)
		return
	}

	if riskService == nil {
		logrus.Error("Risk service not initialized")
		respond(c, http.StatusInternalServerError, 500, "risk service not initialized", nil)
		return
	}

	results, err := riskService.BatchPredict(c.Request.Context(), req.CompanyNames)
	if err != nil {
		logrus.WithError(err).Error("Batch prediction failed")
		respond(c, http.StatusInternalServerError, 500, "batch prediction failed: "+err.Error(), nil)
		return
	}

	logrus.Infof("Batch prediction completed: %d results", len(results))
	respond(c, http.StatusOK, 200, "ok", BatchPredictData{Items: results, Count: len(results)})
}

type PredictionHistoryData struct {
	Items []*repository.RiskPrediction `json:"items"`
	Count int                          `json:"count"`
}

func PredictionHistory(c *gin.Context) {
	companyName := c.Query("company_name")
	if companyName == "" {
		respond(c, http.StatusBadRequest, 400, "company_name is required", nil)
		return
	}

	limit := 10
	if rawLimit := c.Query("limit"); rawLimit != "" {
		if n, err := strconv.Atoi(rawLimit); err == nil && n > 0 {
			limit = n
		}
	}

	if riskService == nil {
		logrus.Error("Risk service not initialized")
		respond(c, http.StatusInternalServerError, 500, "risk service not initialized", nil)
		return
	}

	results, err := riskService.GetPredictionHistory(c.Request.Context(), companyName, limit)
	if err != nil {
		logrus.WithError(err).WithField("company", companyName).Error("Failed to get prediction history")
		respond(c, http.StatusInternalServerError, 500, "failed to get prediction history: "+err.Error(), nil)
		return
	}

	logrus.WithField("company", companyName).Infof("Retrieved %d prediction records", len(results))
	respond(c, http.StatusOK, 200, "ok", PredictionHistoryData{Items: results, Count: len(results)})
}

type PredictorHealthData struct {
	Backend string `json:"backend"`
	IsMock  bool   `json:"is_mock"`
	Healthy bool   `json:"healthy"`
	Strict  bool   `json:"strict"`
}

func PredictorHealth(c *gin.Context) {
	data := PredictorHealthData{Strict: globle.Conf.Inference.Strict}

	if riskPredictor == nil {
		data.Healthy = false
		respond(c, http.StatusInternalServerError, 500, "predictor not initialized", data)
		return
	}

	data.Backend = riskPredictor.Backend()
	data.IsMock = riskPredictor.IsMock()

	if err := riskPredictor.Health(c.Request.Context()); err != nil {
		data.Healthy = false
		respond(c, http.StatusInternalServerError, 500, "predictor unhealthy: "+err.Error(), data)
		return
	}

	data.Healthy = true
	respond(c, http.StatusOK, 200, "ok", data)
}

// PredictionReport 风险预测报告占位接口（避免前端调用 404）
func PredictionReport(c *gin.Context) {
	predictionID := c.Query("prediction_id")
	companyName := c.Query("company_name")

	if predictionID == "" && companyName == "" {
		respond(c, http.StatusBadRequest, 400, "prediction_id or company_name is required", nil)
		return
	}

	respond(c, http.StatusNotFound, 404, "risk report generation is not implemented yet", gin.H{
		"prediction_id": predictionID,
		"company_name":  companyName,
	})
}
