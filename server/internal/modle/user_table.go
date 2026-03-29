package modle

import (
	"time"
)

// User 对应数据库中的 users 表
type User struct {
	ID        int       `gorm:"column:id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
	DeletedAt time.Time `gorm:"column:deleted_at"`
	Username  string    `gorm:"column:username"`
	Password  string    `gorm:"column:password"`
	Email     string    `gorm:"column:email"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
