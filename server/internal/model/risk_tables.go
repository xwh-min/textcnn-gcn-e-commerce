package model

import (
	"time"
)

// RiskPrediction 风险预测结果表
type RiskPrediction struct {
	ID                 int64     `gorm:"column:id;primaryKey;autoIncrement"`
	CompanyID          int64     `gorm:"column:company_id;not null;index:idx_company_predicted,priority:1"` // 预测企业ID
	CompanyName        string    `gorm:"column:company_name;size:200;not null"`                              // 冗余存企业名（方便查询）
	// 输入参数
	StartDate          time.Time `gorm:"column:start_date;type:date;not null"`                                 // 近3个月起始时间
	EndDate            time.Time `gorm:"column:end_date;type:date;not null"`                                   // 近3个月结束时间
	// 预测输出
	ComplianceRisk     int       `gorm:"column:compliance_risk;not null"`                                        // 合规风险：0=正常，1=风险
	ComplianceProb     float64   `gorm:"column:compliance_prob;type:decimal(5,4);not null"`                      // 合规风险概率（0.0000-1.0000）
	PaymentRisk        int       `gorm:"column:payment_risk;not null"`                                           // 支付风险：0=正常，1=风险
	PaymentProb        float64   `gorm:"column:payment_prob;type:decimal(5,4);not null"`                         // 支付风险概率
	RiskLevel          string    `gorm:"column:risk_level;size:20;not null;index"`                               // 风险等级：低/中/高
	// 解释信息
	RiskReason         string    `gorm:"column:risk_reason;type:text"`                                            // 风险原因（如：与3家高风险物流商合作、投诉率超标）
	GraphFeatureSummary string    `gorm:"column:graph_feature_summary;type:text"`                                 // 图特征摘要（如：关联2个物流商、1个A类海关）
	TextFeatureSummary  string    `gorm:"column:text_feature_summary;type:text"`                                  // 文本特征摘要（如：涉及2条监管政策、5条支付投诉）
	// 元数据
	ModelVersion       string    `gorm:"column:model_version;size:50;not null"`                                  // 模型版本（如：v1.0.0）
	PredictedAt        time.Time `gorm:"column:predicted_at;default:CURRENT_TIMESTAMP;index:idx_company_predicted,priority:2,sort:desc"`
	
	// 外键关联
	Company            EcoCompany `gorm:"foreignKey:CompanyID"`
}

// TableName 指定表名
func (RiskPrediction) TableName() string {
	return "risk_prediction"
}
