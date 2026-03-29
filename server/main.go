package main

import (
	"fmt"
	"server/api/handler/risk"
	"server/api/router"
	"server/core"
	"server/flags"
	"server/globle"
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

	// 初始化风险预测器
	if err := risk.InitRiskPredictor(); err != nil {
		fmt.Printf("Failed to initialize risk predictor: %v\n", err)
		return
	}
	defer risk.CloseRiskPredictor()

	// 设置路由
	r := router.SetupRouter()

	// 启动服务器
	addr := fmt.Sprintf(":%s", globle.Conf.System.Port)
	fmt.Println("Starting Gin server on", addr)
	r.Run(addr)
}
