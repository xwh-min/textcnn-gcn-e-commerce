package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"server/inference"
	"server/internal/model"
	"server/repository"
	"time"
)

type RiskPredictionService struct {
	inference         inference.Predictor
	featureExtractor  *inference.FeatureExtractor
	repo              repository.RiskPredictionRepository
	companyRepo       repository.CompanyRepository
	policyNewsRepo    repository.PolicyNewsRepository
	complaintRepo     repository.UserComplaintRepository
	orderRepo         repository.OrderRepository
	logisticsRepo     repository.LogisticsRecordRepository
	relationRepo      repository.RelationRepository
}

type RiskPredictionRequest struct {
	CompanyName    string                 `json:"company_name"`
	RecentData     string                 `json:"recent_data"`
	PolicyNews     []string               `json:"policy_news"`
	UserComplaints []string               `json:"user_complaints"`
	GraphStructure map[string]interface{} `json:"graph_structure"`
}

type RiskPredictionScore struct {
	ComplianceScore float32 `json:"compliance_score"`
	PaymentScore    float32 `json:"payment_score"`
}

type RiskPredictionResult struct {
	ComplianceRisk string                `json:"compliance_risk"`
	PaymentRisk    string                `json:"payment_risk"`
	Scores         RiskPredictionScore   `json:"scores"`
	PredictionID   int64                 `json:"prediction_id,omitempty"`
	FeatureMeta    inference.FeatureMeta `json:"feature_meta"`
}

func NewRiskPredictionService(
	inf inference.Predictor,
	featureExtractor *inference.FeatureExtractor,
	repo repository.RiskPredictionRepository,
	companyRepo repository.CompanyRepository,
	policyNewsRepo repository.PolicyNewsRepository,
	complaintRepo repository.UserComplaintRepository,
	orderRepo repository.OrderRepository,
	logisticsRepo repository.LogisticsRecordRepository,
	relationRepo repository.RelationRepository,
) *RiskPredictionService {
	return &RiskPredictionService{
		inference:        inf,
		featureExtractor: featureExtractor,
		repo:             repo,
		companyRepo:      companyRepo,
		policyNewsRepo:   policyNewsRepo,
		complaintRepo:    complaintRepo,
		orderRepo:        orderRepo,
		logisticsRepo:    logisticsRepo,
		relationRepo:     relationRepo,
	}
}

func (s *RiskPredictionService) Predict(ctx context.Context, req *RiskPredictionRequest) (*RiskPredictionResult, error) {
	log.Printf("Starting risk prediction for company: %s", req.CompanyName)

	if req.CompanyName == "" {
		return nil, ErrInvalidCompanyName
	}

	if len(req.PolicyNews) == 0 {
		policyNews, err := s.policyNewsRepo.GetRecent(ctx, 30)
		if err == nil && len(policyNews) > 0 {
			req.PolicyNews = make([]string, len(policyNews))
			for i, news := range policyNews {
				req.PolicyNews[i] = news.Title + ": " + news.Content
			}
		}
	}

	if len(req.UserComplaints) == 0 {
		complaints, err := s.complaintRepo.GetByCompany(ctx, req.CompanyName, 90)
		if err == nil && len(complaints) > 0 {
			req.UserComplaints = make([]string, len(complaints))
			for i, complaint := range complaints {
				req.UserComplaints[i] = complaint.ComplaintContent
			}
		}
	}

	if req.RecentData == "" {
		orders, err := s.orderRepo.GetRecentByCompany(ctx, req.CompanyName, 90)
		if err == nil && len(orders) > 0 {
			data, _ := json.Marshal(orders)
			req.RecentData = string(data)
		}
	}

	if len(req.GraphStructure) == 0 {
		graph, err := s.relationRepo.GetGraphStructure(ctx, req.CompanyName)
		if err == nil {
			converted := make(map[string]interface{}, len(graph))
			for k, v := range graph {
				converted[k] = v
			}
			req.GraphStructure = converted
		}
	}

	textFeatures := s.featureExtractor.ExtractTextFeatures(
		req.PolicyNews,
		req.UserComplaints,
		req.RecentData,
	)

	graphFeatures := s.featureExtractor.ExtractGraphFeatures(req.GraphStructure)

	combinedFeatures := s.featureExtractor.CombineFeatures(textFeatures, graphFeatures)
	featureMeta := s.featureExtractor.FeatureMeta()
	if err := s.featureExtractor.ValidateCombinedFeatures(combinedFeatures); err != nil {
		log.Printf("Feature validation failed: %v", err)
		return nil, err
	}

	output, err := s.inference.PredictWithPayload(ctx, inference.InferencePayload{
		Features:       combinedFeatures,
		CompanyName:    req.CompanyName,
		RecentData:     req.RecentData,
		PolicyNews:     req.PolicyNews,
		UserComplaints: req.UserComplaints,
		GraphStructure: req.GraphStructure,
	})
	if err != nil {
		log.Printf("Inference failed: %v", err)
		return nil, err
	}

	if len(output) < 2 {
		return nil, ErrInvalidModelOutput
	}

	result := &RiskPredictionResult{
		ComplianceRisk: getRiskLevel(output[0]),
		PaymentRisk:    getRiskLevel(output[1]),
		Scores: RiskPredictionScore{
			ComplianceScore: output[0],
			PaymentScore:    output[1],
		},
		FeatureMeta: featureMeta,
	}

	complianceRiskInt := 0
	if result.ComplianceRisk != "low" {
		complianceRiskInt = 1
	}

	paymentRiskInt := 0
	if result.PaymentRisk != "low" {
		paymentRiskInt = 1
	}

	now := time.Now()
	startDate := now.AddDate(0, 0, -90)

	var companyID int64 = 0
	var companyName string = req.CompanyName
	if company, err := s.companyRepo.GetByName(ctx, req.CompanyName); err == nil {
		companyID = company.ID
		companyName = company.CompanyName
	}

	prediction := &model.RiskPrediction{
		CompanyID:          companyID,
		CompanyName:        companyName,
		StartDate:          startDate,
		EndDate:            now,
		ComplianceRisk:     complianceRiskInt,
		ComplianceProb:     float64(result.Scores.ComplianceScore),
		PaymentRisk:        paymentRiskInt,
		PaymentProb:        float64(result.Scores.PaymentScore),
		RiskLevel:          getRiskLevelFromScores(result.Scores.ComplianceScore, result.Scores.PaymentScore),
		RiskReason:         "Risk prediction based on model output",
		GraphFeatureSummary: fmt.Sprintf("Graph features analyzed"),
		TextFeatureSummary:  fmt.Sprintf("Text features analyzed"),
		ModelVersion:       "v1.0",
		PredictedAt:        now,
	}

	if err := s.repo.SavePrediction(ctx, prediction); err != nil {
		log.Printf("Failed to save prediction: %v", err)
	} else {
		result.PredictionID = prediction.ID
		log.Printf("Prediction saved with ID: %d", prediction.ID)
	}

	log.Printf("Risk prediction completed - Compliance: %s (%.2f), Payment: %s (%.2f), feature_schema=%s, feature_source=%s",
		result.ComplianceRisk, result.Scores.ComplianceScore,
		result.PaymentRisk, result.Scores.PaymentScore,
		result.FeatureMeta.SchemaVersion, result.FeatureMeta.FeatureSource)

	return result, nil
}

func (s *RiskPredictionService) BatchPredict(ctx context.Context, companyNames []string) ([]*RiskPredictionResult, error) {
	log.Printf("Starting batch prediction for %d companies", len(companyNames))

	results := make([]*RiskPredictionResult, 0, len(companyNames))

	for _, companyName := range companyNames {
		req := &RiskPredictionRequest{
			CompanyName: companyName,
		}

		result, err := s.Predict(ctx, req)
		if err != nil {
			log.Printf("Failed to predict for %s: %v", companyName, err)
			continue
		}

		results = append(results, result)
	}

	log.Printf("Batch prediction completed: %d/%d successful", len(results), len(companyNames))
	return results, nil
}

func (s *RiskPredictionService) GetPredictionHistory(ctx context.Context, companyName string, limit int) ([]*model.RiskPrediction, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.repo.GetPredictionsByCompany(ctx, companyName, limit)
}

func (s *RiskPredictionService) GetMonthlyStatistics(ctx context.Context, months int) ([]map[string]interface{}, error) {
	if months <= 0 {
		months = 6
	}
	return s.repo.GetMonthlyStatistics(ctx, months)
}

func (s *RiskPredictionService) GetLatestPrediction(ctx context.Context, companyName string) (*model.RiskPrediction, error) {
	return s.repo.GetLatestPrediction(ctx, companyName)
}

func getRiskLevel(score float32) string {
	if score >= 0.7 {
		return "high"
	} else if score >= 0.4 {
		return "medium"
	}
	return "low"
}

func getRiskLevelFromScores(compliance, payment float32) string {
	if compliance >= 0.7 || payment >= 0.7 {
		return "high"
	} else if compliance >= 0.4 || payment >= 0.4 {
		return "medium"
	}
	return "low"
}

var (
	ErrInvalidCompanyName = fmt.Errorf("invalid company name")
	ErrInvalidModelOutput = fmt.Errorf("invalid model output")
)

type PredictionRecord struct {
	ID              uint      `json:"id"`
	CompanyName     string    `json:"company_name"`
	ComplianceRisk  string    `json:"compliance_risk"`
	PaymentRisk     string    `json:"payment_risk"`
	ComplianceScore float32   `json:"compliance_score"`
	PaymentScore    float32   `json:"payment_score"`
	CreatedAt       time.Time `json:"created_at"`
}
