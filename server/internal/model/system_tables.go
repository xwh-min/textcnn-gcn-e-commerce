package model

import (
	"time"
)

// SysUser 后台用户表
type SysUser struct {
	ID           int64     `gorm:"column:id;primaryKey;autoIncrement"`
	Username     string    `gorm:"column:username;size:50;not null;uniqueIndex"`
	PasswordHash string    `gorm:"column:password_hash;size:255;not null"`
	RealName     string    `gorm:"column:real_name;size:100"`
	RoleID       int64     `gorm:"column:role_id;not null;index"`
	IsActive     bool      `gorm:"column:is_active;default:true"`
	CreatedAt    time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
	
	// 外键关联
	Role SysRole `gorm:"foreignKey:RoleID"`
}

// TableName 指定表名
func (SysUser) TableName() string {
	return "sys_user"
}

// SysRole 角色表
type SysRole struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	RoleName    string    `gorm:"column:role_name;size:50;not null;uniqueIndex"` // 角色名称
	Description string    `gorm:"column:description;size:200"`                    // 角色描述
	Permissions string    `gorm:"column:permissions;type:jsonb"`                  // 权限列表（JSON 格式）
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP"`
}

// TableName 指定表名
func (SysRole) TableName() string {
	return "sys_role"
}

// SysOperationLog 操作日志表
type SysOperationLog struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	UserID      int64     `gorm:"column:user_id;not null;index"`           // 操作用户 ID
	Username    string    `gorm:"column:username;size:50;index"`           // 操作用户名
	Operation   string    `gorm:"column:operation;size:100;not null;index"` // 操作类型（如：CREATE, UPDATE, DELETE）
	Module      string    `gorm:"column:module;size:50;index"`             // 操作模块（如：company, logistics, customs）
	RequestData string    `gorm:"column:request_data;type:jsonb"`          // 请求数据（JSON 格式）
	Response    string    `gorm:"column:response;type:text"`               // 响应结果
	IPAddress   string    `gorm:"column:ip_address;size:50"`               // IP 地址
	UserAgent   string    `gorm:"column:user_agent;size:500"`              // 用户代理
	CreatedAt   time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP;index"`
}

// TableName 指定表名
func (SysOperationLog) TableName() string {
	return "sys_operation_log"
}
