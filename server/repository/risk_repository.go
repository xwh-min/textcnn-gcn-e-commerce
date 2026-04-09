package repository

import (
	"context"
	"server/internal/model"
	"errors"
	"time"

	"gorm.io/gorm"
)

var (
	ErrRecordNotFound = errors.New("record not found")
	ErrDuplicateRecord = errors.New("duplicate record")
)

type RiskPredictionRepository interface {
	SavePrediction(ctx context.Context, prediction *RiskPrediction) error
	GetPredictionsByCompany(ctx context.Context, companyName string, limit int) ([]*RiskPrediction, error)
	GetLatestPrediction(ctx context.Context, companyName string) (*RiskPrediction, error)
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

type RiskPrediction struct {
	ID             uint      `json:"id"`
	CompanyName    string    `json:"company_name"`
	ComplianceRisk string    `json:"compliance_risk"`
	PaymentRisk    string    `json:"payment_risk"`
	ComplianceScore float32  `json:"compliance_score"`
	PaymentScore   float32   `json:"payment_score"`
	InputData      string    `json:"input_data"`
	CreatedAt      time.Time `json:"created_at"`
}

type riskPredictionRepository struct {
	db *gorm.DB
}

func NewRiskPredictionRepository(db *gorm.DB) RiskPredictionRepository {
	return &riskPredictionRepository{db: db}
}

func (r *riskPredictionRepository) SavePrediction(ctx context.Context, prediction *RiskPrediction) error {
	return r.db.WithContext(ctx).Create(prediction).Error
}

func (r *riskPredictionRepository) GetPredictionsByCompany(ctx context.Context, companyName string, limit int) ([]*RiskPrediction, error) {
	var predictions []*RiskPrediction
	err := r.db.WithContext(ctx).
		Where("company_name = ?", companyName).
		Order("created_at DESC").
		Limit(limit).
		Find(&predictions).Error
	
	if err != nil {
		return nil, err
	}
	return predictions, nil
}

func (r *riskPredictionRepository) GetLatestPrediction(ctx context.Context, companyName string) (*RiskPrediction, error) {
	var prediction RiskPrediction
	err := r.db.WithContext(ctx).
		Where("company_name = ?", companyName).
		Order("created_at DESC").
		First(&prediction).Error
	
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRecordNotFound
	}
	if err != nil {
		return nil, err
	}
	return &prediction, nil
}

type companyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) CompanyRepository {
	return &companyRepository{db: db}
}

func (r *companyRepository) GetByName(ctx context.Context, name string) (*model.EcoCompany, error) {
	var company model.EcoCompany
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&company).Error
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
	err := r.db.WithContext(ctx).
		Where("company_name = ? AND created_at >= ?", companyName, since).
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
	err := r.db.WithContext(ctx).
		Where("company_name = ? AND created_at >= ?", companyName, since).
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
	err := r.db.WithContext(ctx).
		Where("company_name = ? AND created_at >= ?", companyName, since).
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
	err := r.db.WithContext(ctx).Where("name = ?", companyName).First(&company).Error
	if err != nil {
		return graph, nil
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
