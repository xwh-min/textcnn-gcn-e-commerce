package model

import (
	"time"
)

// GraphRelation 图关系边表（异构图存储）
type GraphRelation struct {
	ID           int64     `gorm:"column:id;primaryKey;autoIncrement"`
	// 源节点
	SourceType   string    `gorm:"column:source_type;size:50;not null;index:idx_source,priority:1"` // 源节点类型：eco_company / logistics_provider / customs
	SourceID     int64     `gorm:"column:source_id;not null;index:idx_source,priority:2"`            // 源节点ID（关联对应表的主键）
	// 目标节点
	TargetType   string    `gorm:"column:target_type;size:50;not null;index:idx_target,priority:1"` // 目标节点类型：同上
	TargetID     int64     `gorm:"column:target_id;not null;index:idx_target,priority:2"`            // 目标节点ID
	// 关系属性
	RelationType string    `gorm:"column:relation_type;size:50;not null;index:idx_relation_type"`   // 关系类型：cooperation（合作） / compliance（合规）
	Weight       float64   `gorm:"column:weight;type:decimal(5,2);default:1.00"`                    // 关系权重（0.00-5.00，越高风险关联越强）
	StartDate    time.Time `gorm:"column:start_date;type:date"`                                      // 关系开始时间
	EndDate      time.Time `gorm:"column:end_date;type:date"`                                        // 关系结束时间（NULL表示持续）
	Remark       string    `gorm:"column:remark;type:text"`                                           // 备注（如：合作订单量、合规检查结果）
	CreatedAt    time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
}

// TableName 指定表名
func (GraphRelation) TableName() string {
	return "graph_relation"
}
