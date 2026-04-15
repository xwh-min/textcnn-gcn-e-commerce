package main

import (
	"fmt"
	"server/core"
	"server/flags"
	"server/globle"
	"server/internal/api"
	"server/internal/api/handlers"
	"server/internal/db"
)

func main() {
	flags.Parse()
	fmt.Println(flags.FlagsOptions)
	core.ReadConf()

	// 初始化数据库连接
	if err := db.InitDB(); err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		return
	}

	// 数据库表结构迁移
	if err := db.MigrateDB(); err != nil {
		fmt.Printf("Failed to migrate database: %v\n", err)
		return
	}

	// 初始化风险预测器
	if err := handlers.InitRiskPredictor(); err != nil {
		fmt.Printf("Failed to initialize risk predictor: %v\n", err)
		return
	}
	defer handlers.CloseRiskPredictor()

	// 设置路由
	r := api.SetupRouter()

	// 启动服务器
	addr := fmt.Sprintf(":%s", globle.Conf.System.Port)
	fmt.Println("Starting Gin server on", addr)
	r.Run(addr)
}
