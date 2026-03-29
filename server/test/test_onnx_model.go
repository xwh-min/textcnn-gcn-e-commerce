package main

import (
	"fmt"
	"log"
	"server/internal/model"
)

func testOnnxModel() {
	// 1. 加载模型
	modelPath := model.GetModelPath()
	predictor, err := model.NewRiskPredictor(modelPath)
	if err != nil {
		log.Fatalf("Failed to create risk predictor: %v", err)
	}
	defer predictor.Close()

	// 2. 准备测试数据
	testData := &model.RiskData{
		CompanyName: "测试跨境电商企业",
		RecentData:  "近3个月业务数据：销售额1000万，订单量5000单，退货率5%",
		PolicyNews: []string{
			"海关发布新的跨境电商监管政策",
			"外汇管理局调整跨境支付规定",
		},
		UserComplaints: []string{
			"物流延迟",
			"产品质量问题",
		},
		GraphStructure: map[string][]string{
			"测试跨境电商企业": {
				"物流商A",
				"海关B",
				"供应商C",
			},
			"物流商A": {
				"测试跨境电商企业",
				"海关B",
			},
			"海关B": {
				"测试跨境电商企业",
				"物流商A",
			},
		},
	}

	// 3. 执行预测
	result, err := predictor.Predict(testData)
	if err != nil {
		log.Fatalf("Prediction failed: %v", err)
	}

	// 4. 输出预测结果
	fmt.Println("=== 风险预测结果 ===")
	fmt.Printf("企业名称: %s\n", testData.CompanyName)
	fmt.Printf("合规风险: %s (分数: %.4f)\n", result.ComplianceRisk, result.Scores.ComplianceScore)
	fmt.Printf("支付风险: %s (分数: %.4f)\n", result.PaymentRisk, result.Scores.PaymentScore)
	fmt.Println("====================")

	// 5. 测试不同数据
	testData2 := &model.RiskData{
		CompanyName: "低风险跨境电商企业",
		RecentData:  "近3个月业务数据：销售额500万，订单量2000单，退货率2%",
		PolicyNews: []string{
			"海关简化跨境电商通关流程",
		},
		UserComplaints: []string{
			"轻微物流延迟",
		},
		GraphStructure: map[string][]string{
			"低风险跨境电商企业": {
				"物流商A",
				"海关B",
			},
			"物流商A": {
				"低风险跨境电商企业",
			},
			"海关B": {
				"低风险跨境电商企业",
			},
		},
	}

	result2, err := predictor.Predict(testData2)
	if err != nil {
		log.Fatalf("Prediction failed: %v", err)
	}

	fmt.Println("\n=== 风险预测结果 ===")
	fmt.Printf("企业名称: %s\n", testData2.CompanyName)
	fmt.Printf("合规风险: %s (分数: %.4f)\n", result2.ComplianceRisk, result2.Scores.ComplianceScore)
	fmt.Printf("支付风险: %s (分数: %.4f)\n", result2.PaymentRisk, result2.Scores.PaymentScore)
	fmt.Println("====================")
}
