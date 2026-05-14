package model

import (
	"time"
)

// OrderData 订单数据表
type OrderData struct {
	ID                 int64     `gorm:"column:id;primaryKey;autoIncrement"`
	CompanyID          int64     `gorm:"column:company_id;not null;index:idx_company_order_date,priority:1"` // 所属企业ID
	OrderNo            string    `gorm:"column:order_no;size:100;not null;uniqueIndex"`                      // 订单号
	ProductName        string    `gorm:"column:product_name;size:200"`                                       // 商品名称
	Quantity           int       `gorm:"column:quantity;default:0"`                                          // 商品数量
	OrderAmount        float64   `gorm:"column:order_amount;type:decimal(15,2);not null"`                  // 订单金额
	Currency           string    `gorm:"column:currency;size:10;default:'USD'"`                              // 币种
	DestinationCountry string    `gorm:"column:destination_country;size:100"`                                 // 目的国家
	LogisticsProviderID int64     `gorm:"column:logistics_provider_id"`                                       // 关联物流商ID
	OrderDate          time.Time `gorm:"column:order_date;type:date;not null;index:idx_company_order_date,priority:2"` // 订单时间
	PaymentStatus      string    `gorm:"column:payment_status;size:50"`                                       // 支付状态
	ExtraInfo          string    `gorm:"column:extra_info;type:jsonb"`                                        // 扩展字段
	CreatedAt          time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	
	// 外键关联
	Company            EcoCompany        `gorm:"foreignKey:CompanyID"`
	LogisticsProvider  LogisticsProvider `gorm:"foreignKey:LogisticsProviderID"`
}

// TableName 指定表名
func (OrderData) TableName() string {
	return "order_data"
}

// LogisticsRecord 物流记录表
type LogisticsRecord struct {
	ID                 int64     `gorm:"column:id;primaryKey;autoIncrement"`
	OrderID            int64     `gorm:"column:order_id;not null"`                  // 关联订单ID
	LogisticsProviderID int64     `gorm:"column:logistics_provider_id;not null;index"` // 物流商ID
	TrackingNo         string    `gorm:"column:tracking_no;size:100;not null;index"` // 物流单号
	CustomsID          int64     `gorm:"column:customs_id"`                          // 通关海关ID
	Status             string    `gorm:"column:status;size:50"`                      // 物流状态（shipped/cleared/delayed/delivered）
	ShippedDate        time.Time `gorm:"column:shipped_date;type:date"`              // 发货时间
	ClearedDate        time.Time `gorm:"column:cleared_date;type:date"`              // 通关时间
	DelayedDays        int       `gorm:"column:delayed_days;default:0"`              // 延误天数
	ExtraInfo          string    `gorm:"column:extra_info;type:jsonb"`                // 扩展字段（物流轨迹、查验信息等）
	CreatedAt          time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	
	// 外键关联
	Order              OrderData         `gorm:"foreignKey:OrderID"`
	LogisticsProvider  LogisticsProvider `gorm:"foreignKey:LogisticsProviderID"`
	Customs            Customs           `gorm:"foreignKey:CustomsID"`
}

// TableName 指定表名
func (LogisticsRecord) TableName() string {
	return "logistics_record"
}
