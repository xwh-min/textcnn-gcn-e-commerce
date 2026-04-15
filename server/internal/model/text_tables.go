package model

import (
	"time"
)

// PolicyNews 政策新闻表
type PolicyNews struct {
	ID               int64     `gorm:"column:id;primaryKey;autoIncrement"`
	Title            string    `gorm:"column:title;size:500;not null"`                    // 新闻标题
	Content          string    `gorm:"column:content;type:text;not null"`                  // 新闻正文（TextCNN 核心输入）
	Source           string    `gorm:"column:source;size:200"`                              // 来源（如：海关总署、商务部）
	PublishDate      time.Time `gorm:"column:publish_date;type:date;not null;index"`       // 发布时间
	RelatedRegions   string    `gorm:"column:related_regions;type:text[];index"`            // 关联地区（数组）
	RelatedCompanies string    `gorm:"column:related_companies;type:bigint[]"`              // 关联企业ID（数组，可选）
	CreatedAt        time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
}

// TableName 指定表名
func (PolicyNews) TableName() string {
	return "policy_news"
}

// UserComplaint 用户投诉表
type UserComplaint struct {
	ID               int64     `gorm:"column:id;primaryKey;autoIncrement"`
	ComplaintContent string    `gorm:"column:complaint_content;type:text;not null"`        // 投诉内容（TextCNN 核心输入）
	ComplaintType    string    `gorm:"column:complaint_type;size:100"`                     // 投诉类型（如：物流延误、支付问题、商品质量）
	TargetCompanyID  int64     `gorm:"column:target_company_id;not null;index"`            // 被投诉企业ID（关联 eco_company）
	TargetLogisticsID int64     `gorm:"column:target_logistics_id"`                         // 关联物流商ID（可选）
	ComplaintDate    time.Time `gorm:"column:complaint_date;type:date;not null;index"`      // 投诉时间
	IsProcessed      bool      `gorm:"column:is_processed;default:false"`                   // 是否处理
	CreatedAt        time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	
	// 外键关联
	TargetCompany    EcoCompany `gorm:"foreignKey:TargetCompanyID"`
}

// TableName 指定表名
func (UserComplaint) TableName() string {
	return "user_complaint"
}
