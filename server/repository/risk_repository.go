package repository

import (
	"context"
	"errors"
	"fmt"
	"server/internal/model"
	"time"

	"gorm.io/gorm"
)

var (
	ErrRecordNotFound  = errors.New("record not found")
	ErrDuplicateRecord = errors.New("duplicate record")
)

type RiskPredictionRepository interface {
	SavePrediction(ctx context.Context, prediction *model.RiskPrediction) error
	GetPredictionsByCompany(ctx context.Context, companyName string, limit int) ([]*model.RiskPrediction, error)
	GetLatestPrediction(ctx context.Context, companyName string) (*model.RiskPrediction, error)
	GetMonthlyStatistics(ctx context.Context, months int) ([]map[string]interface{}, error)
}

type CompanyRepository interface {
	GetByName(ctx context.Context, name string) (*model.EcoCompany, error)
	GetAll(ctx context.Context) ([]model.EcoCompany, error)
}

type PolicyNewsRepository interface {
	GetRecent(ctx context.Context, days int) ([]model.PolicyNews, error)
}

type UserComplaintRepository interface {
	GetRecent(ctx context.Context, days int) ([]model.UserComplaint, error)
	GetByCompany(ctx context.Context, companyName string, days int) ([]model.UserComplaint, error)
}

type OrderRepository interface {
	GetRecentByCompany(ctx context.Context, companyName string, days int) ([]model.OrderData, error)
}

type LogisticsRecordRepository interface {
	GetRecentByCompany(ctx context.Context, companyName string, days int) ([]model.LogisticsRecord, error)
}

type RelationRepository interface {
	GetGraphStructure(ctx context.Context, companyName string) (map[string][]string, error)
}

type riskPredictionRepository struct {
	db *gorm.DB
}

func NewRiskPredictionRepository(db *gorm.DB) RiskPredictionRepository {
	return &riskPredictionRepository{db: db}
}

func (r *riskPredictionRepository) SavePrediction(ctx context.Context, prediction *model.RiskPrediction) error {
	return r.db.WithContext(ctx).Create(prediction).Error
}

func (r *riskPredictionRepository) GetPredictionsByCompany(ctx context.Context, companyName string, limit int) ([]*model.RiskPrediction, error) {
	var predictions []*model.RiskPrediction
	query := r.db.WithContext(ctx)

	if companyName != "" {
		query = query.Where("company_name = ?", companyName)
	}

	err := query.
		Order("predicted_at DESC").
		Limit(limit).
		Find(&predictions).Error

	if err != nil {
		return nil, err
	}
	return predictions, nil
}

func (r *riskPredictionRepository) GetLatestPrediction(ctx context.Context, companyName string) (*model.RiskPrediction, error) {
	var prediction model.RiskPrediction
	err := r.db.WithContext(ctx).
		Where("company_name = ?", companyName).
		Order("predicted_at DESC").
		First(&prediction).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}
	return &prediction, nil
}

func (r *riskPredictionRepository) GetMonthlyStatistics(ctx context.Context, months int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	err := r.db.WithContext(ctx).
		Raw(`
			SELECT 
				DATE_TRUNC('month', predicted_at) as month,
				COUNT(*) as total_detection,
				SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk_count,
				SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium_risk_count
			FROM risk_prediction
			WHERE predicted_at >= CURRENT_TIMESTAMP - INTERVAL ?
			GROUP BY DATE_TRUNC('month', predicted_at)
			ORDER BY month ASC
		`, fmt.Sprintf("%d months", months)).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}
	return results, nil
}

type companyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) CompanyRepository {
	return &companyRepository{db: db}
}

func (r *companyRepository) GetByName(ctx context.Context, name string) (*model.EcoCompany, error) {
	var company model.EcoCompany
	err := r.db.WithContext(ctx).Where("company_name = ?", name).First(&company).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = r.db.WithContext(ctx).Where("credit_code = ?", name).First(&company).Error
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *companyRepository) GetAll(ctx context.Context) ([]model.EcoCompany, error) {
	var companies []model.EcoCompany
	err := r.db.WithContext(ctx).Find(&companies).Error
	return companies, err
}

type policyNewsRepository struct {
	db *gorm.DB
}

func NewPolicyNewsRepository(db *gorm.DB) PolicyNewsRepository {
	return &policyNewsRepository{db: db}
}

func (r *policyNewsRepository) GetRecent(ctx context.Context, days int) ([]model.PolicyNews, error) {
	var news []model.PolicyNews
	since := time.Now().AddDate(0, 0, -days)
	err := r.db.WithContext(ctx).
		Where("created_at >= ?", since).
		Find(&news).Error
	return news, err
}

type userComplaintRepository struct {
	db *gorm.DB
}

func NewUserComplaintRepository(db *gorm.DB) UserComplaintRepository {
	return &userComplaintRepository{db: db}
}

func (r *userComplaintRepository) GetRecent(ctx context.Context, days int) ([]model.UserComplaint, error) {
	var complaints []model.UserComplaint
	since := time.Now().AddDate(0, 0, -days)
	err := r.db.WithContext(ctx).
		Where("created_at >= ?", since).
		Find(&complaints).Error
	return complaints, err
}

func (r *userComplaintRepository) GetByCompany(ctx context.Context, companyName string, days int) ([]model.UserComplaint, error) {
	var complaints []model.UserComplaint
	since := time.Now().AddDate(0, 0, -days)

	var company model.EcoCompany
	if err := r.db.WithContext(ctx).Where("company_name = ?", companyName).First(&company).Error; err != nil {
		if err := r.db.WithContext(ctx).Where("credit_code = ?", companyName).First(&company).Error; err != nil {
			return complaints, nil
		}
	}

	err := r.db.WithContext(ctx).
		Where("target_company_id = ? AND created_at >= ?", company.ID, since).
		Find(&complaints).Error
	return complaints, err
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) GetRecentByCompany(ctx context.Context, companyName string, days int) ([]model.OrderData, error) {
	var orders []model.OrderData
	since := time.Now().AddDate(0, 0, -days)

	var company model.EcoCompany
	if err := r.db.WithContext(ctx).Where("company_name = ?", companyName).First(&company).Error; err != nil {
		if err := r.db.WithContext(ctx).Where("credit_code = ?", companyName).First(&company).Error; err != nil {
			return orders, nil
		}
	}

	err := r.db.WithContext(ctx).
		Where("company_id = ? AND created_at >= ?", company.ID, since).
		Find(&orders).Error
	return orders, err
}

type logisticsRecordRepository struct {
	db *gorm.DB
}

func NewLogisticsRecordRepository(db *gorm.DB) LogisticsRecordRepository {
	return &logisticsRecordRepository{db: db}
}

func (r *logisticsRecordRepository) GetRecentByCompany(ctx context.Context, companyName string, days int) ([]model.LogisticsRecord, error) {
	var records []model.LogisticsRecord
	since := time.Now().AddDate(0, 0, -days)

	var company model.EcoCompany
	if err := r.db.WithContext(ctx).Where("company_name = ?", companyName).First(&company).Error; err != nil {
		if err := r.db.WithContext(ctx).Where("credit_code = ?", companyName).First(&company).Error; err != nil {
			return records, nil
		}
	}

	err := r.db.WithContext(ctx).
		Joins("JOIN order_data ON logistics_record.order_id = order_data.id").
		Where("order_data.company_id = ? AND logistics_record.created_at >= ?", company.ID, since).
		Find(&records).Error
	return records, err
}

type relationRepository struct {
	db *gorm.DB
}

func NewRelationRepository(db *gorm.DB) RelationRepository {
	return &relationRepository{db: db}
}

func (r *relationRepository) GetGraphStructure(ctx context.Context, companyName string) (map[string][]string, error) {
	graph := make(map[string][]string)

	var company model.EcoCompany
	err := r.db.WithContext(ctx).Where("company_name = ?", companyName).First(&company).Error
	if err != nil {
		err = r.db.WithContext(ctx).Where("credit_code = ?", companyName).First(&company).Error
		if err != nil {
			return graph, nil
		}
	}

	var relations []model.GraphRelation
	err = r.db.WithContext(ctx).
		Where("(source_type = 'eco_company' AND source_id = ?) OR (target_type = 'eco_company' AND target_id = ?)", company.ID, company.ID).
		Find(&relations).Error
	if err != nil {
		return nil, err
	}

	for _, rel := range relations {
		if rel.SourceID == company.ID {
			graph[rel.TargetType] = append(graph[rel.TargetType], rel.RelationType)
		} else {
			graph[rel.SourceType] = append(graph[rel.SourceType], rel.RelationType)
		}
	}

	return graph, nil
}
