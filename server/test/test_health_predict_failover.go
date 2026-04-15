package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "http://localhost:9090"

func main() {
	fmt.Println("=== Risk API Smoke Tests ===")
	checkHealth()
	checkPredict()
	fmt.Println("提示: failover 验证请先停止 AI 服务，再执行本文件观察 predict 是否仍返回。")
}

func checkHealth() {
	url := baseURL + "/api/risk/health"
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	// 如需 JWT，请在这里补 Authorization
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("[health] request error: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("[health] status=%d body=%s\n", resp.StatusCode, string(body))
}

func checkPredict() {
	payload := map[string]interface{}{
		"company_name": "联调测试企业",
		"recent_data":  "最近3个月",
		"policy_news":  []string{"海关加强监管", "跨境电商政策调整"},
		"user_complaints": []string{"物流延迟", "退款缓慢"},
		"graph_structure": map[string]interface{}{
			"nodes": []map[string]interface{}{
				{"id": "e1", "type": "enterprise"},
				{"id": "l1", "type": "logistics"},
			},
			"edges": []map[string]interface{}{
				{"source": "e1", "target": "l1", "type": "cooperation"},
			},
		},
	}

	b, _ := json.Marshal(payload)
	url := baseURL + "/api/risk/predict"
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	// 如需 JWT，请在这里补 Authorization

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("[predict] request error: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("[predict] status=%d body=%s\n", resp.StatusCode, string(body))
}
