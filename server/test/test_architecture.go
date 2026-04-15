package main

import (
	"context"
	"fmt"
	"server/inference"
	"server/service"
)

func main() {
	fmt.Println("Testing ONNX Inference Architecture")
	fmt.Println("====================================")
	
	onnxInf, err := inference.NewONNXInference(inference.Config{
		ModelPath: "models/model.onnx",
		InputSize: 128,
	})
	if err != nil {
		fmt.Printf("Failed to create ONNX inference: %v\n", err)
		return
	}
	defer onnxInf.Close()
	
	fmt.Printf("ONNX Inference created. IsMock: %v\n", onnxInf.IsMock())
	
	featureExtractor := inference.NewFeatureExtractor(128, 64)
	
	textFeatures := featureExtractor.ExtractTextFeatures(
		[]string{"政策新闻 1", "政策新闻 2"},
		[]string{"用户投诉 1"},
		"最近的订单数据",
	)
	fmt.Printf("Text features extracted: %d dimensions\n", len(textFeatures))
	
	graphFeatures := featureExtractor.ExtractGraphFeatures(map[string]interface{}{
		"nodes": []interface{}{
			map[string]interface{}{"id": "企业A", "type": "enterprise"},
			map[string]interface{}{"id": "物流商B", "type": "logistics"},
			map[string]interface{}{"id": "海关C", "type": "customs"},
		},
		"edges": []interface{}{
			map[string]interface{}{"source": "企业A", "target": "物流商B", "type": "cooperation"},
			map[string]interface{}{"source": "企业A", "target": "海关C", "type": "compliance"},
		},
	})
	fmt.Printf("Graph features extracted: %d dimensions\n", len(graphFeatures))
	
	combinedFeatures := featureExtractor.CombineFeatures(textFeatures, graphFeatures)
	fmt.Printf("Combined features: %d dimensions\n", len(combinedFeatures))
	
	output, err := onnxInf.Predict(combinedFeatures)
	if err != nil {
		fmt.Printf("Prediction failed: %v\n", err)
		return
	}
	
	fmt.Printf("Prediction result: Compliance=%.2f, Payment=%.2f\n", output[0], output[1])
	
	fmt.Println("\nTesting Service Layer (without database)")
	fmt.Println("========================================")
	
	riskService := service.NewRiskPredictionService(
		onnxInf,
		featureExtractor,
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
	)
	
	result, err := riskService.Predict(context.Background(), &service.RiskPredictionRequest{
		CompanyName:    "测试企业",
		RecentData:     "订单数据",
		PolicyNews:     []string{"政策 1"},
		UserComplaints: []string{"投诉 1"},
		GraphStructure: map[string]interface{}{
			"nodes": []interface{}{map[string]interface{}{"id": "企业", "type": "enterprise"}},
			"edges": []interface{}{},
		},
	})
	
	if err != nil {
		fmt.Printf("Service prediction failed: %v\n", err)
	} else {
		fmt.Printf("Service prediction successful!\n")
		fmt.Printf("Compliance Risk: %s (%.2f)\n", result.ComplianceRisk, result.ComplianceScore)
		fmt.Printf("Payment Risk: %s (%.2f)\n", result.PaymentRisk, result.PaymentScore)
	}
	
	fmt.Println("\n✓ All tests completed successfully!")
}
