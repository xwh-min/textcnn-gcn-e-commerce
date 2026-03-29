package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// 测试风险预测API
func main() {
	// 测试数据
	testData := map[string]interface{}{
		"company_name": "测试跨境电商企业",
		"recent_data":  "近3个月业务数据：销售额1000万，订单量5000单，退货率5%",
		"policy_news": []string{
			"海关发布新的跨境电商监管政策",
			"外汇管理局调整跨境支付规定",
		},
		"user_complaints": []string{
			"物流延迟",
			"产品质量问题",
		},
		"graph_structure": map[string][]string{
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

	// 转换为JSON
	jsonData, err := json.Marshal(testData)
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return
	}

	// 发送请求
	resp, err := http.Post("http://localhost:9090/api/risk/predict", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// 读取响应
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		fmt.Printf("Error decoding response: %v\n", err)
		return
	}

	// 打印响应
	fmt.Printf("Response: %+v\n", response)
}
