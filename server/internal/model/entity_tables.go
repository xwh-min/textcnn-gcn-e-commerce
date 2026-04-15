package model

import (
	"time"
)

// EcoCompany 跨境电商企业表
type EcoCompany struct {
	ID                 int64     `gorm:"column:id;primaryKey;autoIncrement"`
	CompanyName        string    `gorm:"column:company_name;size:200;not null;uniqueIndex"` // 企业全称（唯一标识）
	CreditCode         string    `gorm:"column:credit_code;size:18;not null;uniqueIndex"`  // 统一社会信用代码
	RegisteredAddress  string    `gorm:"column:registered_address;size:500"`               // 注册地址
	BusinessScope      string    `gorm:"column:business_scope;type:text"`                  // 经营范围
	EstablishedDate    time.Time `gorm:"column:established_date;type:date"`                // 成立日期
	LegalRepresentative string    `gorm:"column:legal_representative;size:100"`           // 法定代表人
	ContactPhone       string    `gorm:"column:contact_phone;size:20"`                    // 联系电话
	ContactEmail       string    `gorm:"column:contact_email;size:100"`                    // 联系邮箱
	IsHighRisk         bool      `gorm:"column:is_high_risk;default:false"`                // 是否历史高风险（标记用）
	DeletedAt          time.Time `gorm:"column:deleted_at"`                                // 逻辑删除时间
	CreatedAt          time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt          time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
}

// TableName 指定表名
func (EcoCompany) TableName() string {
	return "eco_company"
}

// LogisticsProvider 物流商表
type LogisticsProvider struct {
	ID                int64     `gorm:"column:id;primaryKey;autoIncrement"`
	ProviderName      string    `gorm:"column:provider_name;size:200;not null;uniqueIndex"` // 物流商全称
	BusinessLicenseNo string    `gorm:"column:business_license_no;size:50;not null;uniqueIndex"` // 营业执照号
	ServiceType       string    `gorm:"column:service_type;size:100"`                        // 服务类型（海运/空运/陆运/快递）
	CoverageCountries string    `gorm:"column:coverage_countries;type:text[]"`               // 覆盖国家（数组）
	IsHighRisk        bool      `gorm:"column:is_high_risk;default:false"`                   // 是否历史高风险
	DeletedAt         time.Time `gorm:"column:deleted_at"`                                   // 逻辑删除时间
	CreatedAt         time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt         time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
}

// TableName 指定表名
func (LogisticsProvider) TableName() string {
	return "logistics_provider"
}

// Customs 海关表
type Customs struct {
	ID              int64     `gorm:"column:id;primaryKey;autoIncrement"`
	CustomsName     string    `gorm:"column:customs_name;size:200;not null;uniqueIndex"` // 海关名称（如：深圳海关、香港海关）
	CustomsCode     string    `gorm:"column:customs_code;size:20;not null;uniqueIndex"`  // 海关代码
	Region          string    `gorm:"column:region;size:100"`                           // 所属地区
	SupervisionLevel string    `gorm:"column:supervision_level;size:50"`                  // 监管等级（A 类/B 类/C 类）
	DeletedAt       time.Time `gorm:"column:deleted_at"`                                   // 逻辑删除时间
	CreatedAt       time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt       time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
}

// TableName 指定表名
func (Customs) TableName() string {
	return "customs"
}
