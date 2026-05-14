package db

import (
	"fmt"
	"log"
	"server/internal/model"
)

// MigrateDB 自动迁移数据库表结构
func MigrateDB() error {
	// 自动迁移表结构
	// 注意：由于时间类型转换问题，我们先尝试迁移新表，然后再处理现有表
	tables := []interface{}{
		// 节点实体表
		&model.EcoCompany{},
		&model.LogisticsProvider{},
		&model.Customs{},
		// 图关系边表
		&model.GraphRelation{},
		// 多模态文本数据表
		&model.PolicyNews{},
		&model.UserComplaint{},
		// 业务行为数据表
		&model.OrderData{},
		&model.LogisticsRecord{},
		// 风险预测结果表
		&model.RiskPrediction{},
		// 系统管理表
		&model.SysUser{},
		&model.SysRole{},
		&model.SysOperationLog{},
	}

	// 迁移新表
	for _, table := range tables {
		if err := DB.AutoMigrate(table); err != nil {
			log.Printf("Warning: failed to migrate table %T: %v", table, err)
			// 继续迁移其他表
		}
	}

	// 迁移用户查询相关表（方案A：依赖 sys_user）
	if err := DB.AutoMigrate(&model.UserQuery{}); err != nil {
		log.Printf("Warning: failed to migrate user query table %T: %v", &model.UserQuery{}, err)
	}

	fmt.Println("Database migration completed with possible warnings")
	return nil
}
