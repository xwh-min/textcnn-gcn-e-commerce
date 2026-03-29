package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// TestRegister 测试注册接口
func TestRegister() {
	// 注册请求数据
	data := map[string]string{
		"username": "newuser",
		"password": "test123",
		"phone":    "13800138001",
	}

	// 转换为 JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("JSON 序列化失败:", err)
		return
	}

	// 发送 POST 请求
	resp, err := http.Post("http://localhost:9090/api/register", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("请求失败:", err)
		return
	}
	defer resp.Body.Close()

	// 读取响应
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		fmt.Println("响应解析失败:", err)
		return
	}

	// 打印响应
	fmt.Printf("状态码: %d\n", resp.StatusCode)
	fmt.Println("响应数据:")
	for k, v := range response {
		fmt.Printf("%s: %v\n", k, v)
	}
}
