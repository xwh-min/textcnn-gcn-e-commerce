package model

import (
	"log"
	"os"
	"path/filepath"
)

// RiskPredictor 风险预测器
type RiskPredictor struct {
	modelPath string
	useOnnxGo bool
}

// NewRiskPredictor 创建新的风险预测器
func NewRiskPredictor(modelPath string) (*RiskPredictor, error) {
	// 加载模型
	log.Printf("Loading model from: %s", modelPath)

	// 尝试使用 onnx-go 加载模型
	// 注意：onnx-go 的 API 可能需要调整，这里暂时使用模拟实现
	// 实际使用时需要根据 onnx-go 的正确 API 进行调整
	log.Printf("Using mock implementation for ONNX model")
	// 如果加载失败，使用模拟实现
	return &RiskPredictor{
		modelPath: modelPath,
		useOnnxGo: false,
	}, nil
}

// Close 关闭预测器
func (p *RiskPredictor) Close() error {
	// onnx-go 模型不需要显式关闭
	log.Printf("Closing model: %s", p.modelPath)
	return nil
}

// RiskData 风险预测输入数据
type RiskData struct {
	CompanyName    string              `json:"company_name"`
	RecentData     string              `json:"recent_data"`     // 近3个月数据
	PolicyNews     []string            `json:"policy_news"`     // 政策新闻
	UserComplaints []string            `json:"user_complaints"` // 用户投诉
	GraphStructure map[string][]string `json:"graph_structure"` // 图结构: 企业 -> 关联实体
}

// RiskResult 风险预测结果
type RiskResult struct {
	ComplianceRisk string `json:"compliance_risk"` // 合规风险等级: low, medium, high
	PaymentRisk    string `json:"payment_risk"`    // 支付风险等级: low, medium, high
	Scores         struct {
		ComplianceScore float32 `json:"compliance_score"`
		PaymentScore    float32 `json:"payment_score"`
	} `json:"scores"`
}

// Predict 预测风险
func (p *RiskPredictor) Predict(data *RiskData) (*RiskResult, error) {
	// 1. 提取文本特征（模拟 TextCNN）
	textFeatures := extractTextFeatures(data.PolicyNews, data.UserComplaints, data.RecentData)

	// 2. 提取图结构特征（模拟 GCN）
	graphFeatures := extractGraphFeatures(data.GraphStructure)

	// 3. 融合特征
	combinedFeatures := combineFeatures(textFeatures, graphFeatures)

	// 4. 使用模拟实现
	return p.mockPredict(combinedFeatures, data.PolicyNews, data.UserComplaints)
}

// 模拟预测
func (p *RiskPredictor) mockPredict(features []float32, policyNews, userComplaints []string) (*RiskResult, error) {
	result := &RiskResult{}

	// 基于特征生成模拟分数
	complianceScore := calculateComplianceScore(features, policyNews)
	paymentScore := calculatePaymentScore(features, userComplaints)

	result.Scores.ComplianceScore = complianceScore
	result.Scores.PaymentScore = paymentScore

	// 根据分数确定风险等级
	result.ComplianceRisk = getRiskLevel(complianceScore)
	result.PaymentRisk = getRiskLevel(paymentScore)

	return result, nil
}

// 提取文本特征（模拟 TextCNN）
func extractTextFeatures(policyNews, userComplaints []string, recentData string) []float32 {
	// 这里应该是实际的 TextCNN 特征提取
	// 为了演示，我们返回一个固定长度的特征向量
	features := make([]float32, 128)
	// 简单模拟：基于文本长度和关键词出现次数生成特征
	textLength := len(recentData)
	for i := range features {
		features[i] = float32(textLength%(i+1)) / 100.0
	}
	return features
}

// 提取图结构特征（模拟 GCN）
func extractGraphFeatures(graphStructure map[string][]string) []float32 {
	// 这里应该是实际的 GCN 特征提取
	// 为了演示，我们返回一个固定长度的特征向量
	features := make([]float32, 64)
	// 简单模拟：基于图的大小和连接数生成特征
	nodeCount := len(graphStructure)
	edgeCount := 0
	for _, neighbors := range graphStructure {
		edgeCount += len(neighbors)
	}
	for i := range features {
		features[i] = float32((nodeCount+edgeCount)%(i+1)) / 50.0
	}
	return features
}

// 融合特征
func combineFeatures(textFeatures, graphFeatures []float32) []float32 {
	// 简单拼接两个特征向量
	combined := make([]float32, len(textFeatures)+len(graphFeatures))
	copy(combined, textFeatures)
	copy(combined[len(textFeatures):], graphFeatures)
	return combined
}

// 计算合规风险分数
func calculateComplianceScore(features []float32, policyNews []string) float32 {
	// 基于特征和政策新闻计算合规风险分数
	baseScore := float32(0.5)

	// 政策新闻越多，合规风险可能越高
	policyScore := float32(len(policyNews)) * 0.1

	// 特征向量的平均值
	featureSum := float32(0)
	for _, f := range features {
		featureSum += f
	}
	featureAvg := featureSum / float32(len(features))

	// 综合计算
	score := baseScore + policyScore + featureAvg

	// 确保分数在 0-1 之间
	if score > 1.0 {
		score = 1.0
	} else if score < 0.0 {
		score = 0.0
	}

	return score
}

// 计算支付风险分数
func calculatePaymentScore(features []float32, userComplaints []string) float32 {
	// 基于特征和用户投诉计算支付风险分数
	baseScore := float32(0.3)

	// 用户投诉越多，支付风险可能越高
	complaintScore := float32(len(userComplaints)) * 0.15

	// 特征向量的平均值
	featureSum := float32(0)
	for _, f := range features {
		featureSum += f
	}
	featureAvg := featureSum / float32(len(features))

	// 综合计算
	score := baseScore + complaintScore + featureAvg

	// 确保分数在 0-1 之间
	if score > 1.0 {
		score = 1.0
	} else if score < 0.0 {
		score = 0.0
	}

	return score
}

// 处理模型输出
func (p *RiskPredictor) processModelOutput(output map[string]interface{}) (*RiskResult, error) {
	// 假设模型输出两个分数：合规风险和支付风险
	// 这里需要根据实际模型的输出格式进行调整

	// 模拟输出
	result := &RiskResult{}

	// 模拟分数
	complianceScore := float32(0.75)
	paymentScore := float32(0.35)

	// 尝试从模型输出中获取实际分数
	if output != nil {
		// 这里需要根据实际模型的输出格式进行调整
		// 例如：if scores, ok := output["output"].([]float32); ok && len(scores) >= 2 {
		//     complianceScore = scores[0]
		//     paymentScore = scores[1]
		// }
	}

	result.Scores.ComplianceScore = complianceScore
	result.Scores.PaymentScore = paymentScore

	// 根据分数确定风险等级
	result.ComplianceRisk = getRiskLevel(complianceScore)
	result.PaymentRisk = getRiskLevel(paymentScore)

	return result, nil
}

// 根据分数确定风险等级
func getRiskLevel(score float32) string {
	switch {
	case score < 0.3:
		return "low"
	case score < 0.7:
		return "medium"
	default:
		return "high"
	}
}

// GetModelPath 获取模型路径
func GetModelPath() string {
	// 尝试不同的模型路径
	possiblePaths := []string{
		"models/model.onnx", // 优先使用 models 文件夹中的模型
		"model.onnx",
		"./model.onnx",
		"./internal/model/model.onnx",
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			absPath, _ := filepath.Abs(path)
			log.Printf("Found model at: %s", absPath)
			return path
		}
	}

	// 默认返回 models 文件夹路径
	return "models/model.onnx"
}
