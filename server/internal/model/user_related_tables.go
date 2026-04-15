package model

import (
	"time"
)

// User 用户表
type User struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement"`
	Username  string    `gorm:"column:username;size:50;not null;uniqueIndex"`
	Password  string    `gorm:"column:password;size:255;not null"`
	Email     string    `gorm:"column:email;size:100;not null;uniqueIndex"`
	CreatedAt time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
	DeletedAt time.Time `gorm:"column:deleted_at"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// UserPhone 用户电话表
type UserPhone struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserID    int64     `gorm:"column:user_id;not null;index"`
	Phone     string    `gorm:"column:phone;size:20;not null"`
	IsPrimary bool      `gorm:"column:is_primary;default:false"`
	CreatedAt time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`

	// 外键关联
	User User `gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (UserPhone) TableName() string {
	return "users_phone"
}

// UserQuery 用户查询历史表
type UserQuery struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserID      int64     `gorm:"column:user_id;not null;index"`                     // 用户ID
	QueryType   string    `gorm:"column:query_type;size:50;not null;index"`          // 查询类型（如：risk, company, policy等）
	QueryText   string    `gorm:"column:query_text;size:500"`                        // 查询内容
	QueryParams string    `gorm:"column:query_params;size:1000"`                     // 查询参数（JSON格式）
	Result      string    `gorm:"column:result;type:text"`                           // 查询结果摘要
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP;index"` // 查询时间

	// 外键关联
	User User `gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (UserQuery) TableName() string {
	return "user_queries"
}
