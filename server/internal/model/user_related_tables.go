package model

import (
	"time"
)


// UserQuery 用户查询历史表
type UserQuery struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserID      int64     `gorm:"column:user_id;not null;index"`                     // 用户ID
	QueryType   string    `gorm:"column:query_type;size:50;not null;index"`          // 查询类型（如：risk, company, policy等）
	QueryText   string    `gorm:"column:query_text;size:500"`                        // 查询内容
	QueryParams string    `gorm:"column:query_params;size:1000"`                     // 查询参数（JSON格式）
	Result      string    `gorm:"column:result;type:text"`                           // 查询结果摘要
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP;index"` // 查询时间

	// 外键关联（方案A：关联 sys_user）
	SysUser SysUser `gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (UserQuery) TableName() string {
	return "user_queries"
}
