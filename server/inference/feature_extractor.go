package inference

import (
	"math"
	"strings"
)

type FeatureExtractor struct {
	textFeatureSize int
	graphFeatureSize int
}

func NewFeatureExtractor(textSize, graphSize int) *FeatureExtractor {
	return &FeatureExtractor{
		textFeatureSize: textSize,
		graphFeatureSize: graphSize,
	}
}

func (fe *FeatureExtractor) ExtractTextFeatures(policyNews, userComplaints []string, recentData string) []float32 {
	features := make([]float32, fe.textFeatureSize)
	
	newsCount := len(policyNews)
	complaintsCount := len(userComplaints)
	dataLength := len(recentData)
	
	riskKeywords := []string{"风险", "违规", "投诉", "问题", "异常", "警告", "违法", "欺诈"}
	keywordCount := 0
	for _, text := range policyNews {
		for _, keyword := range riskKeywords {
			keywordCount += strings.Count(text, keyword)
		}
	}
	for _, text := range userComplaints {
		for _, keyword := range riskKeywords {
			keywordCount += strings.Count(text, keyword)
		}
	}
	
	for i := range features {
		features[i] = float32(newsCount*(i+1) + complaintsCount*(i+2) + keywordCount) / float32(dataLength+1)
		if features[i] > 1.0 {
			features[i] = 1.0
		}
	}
	
	return features
}

func (fe *FeatureExtractor) ExtractGraphFeatures(graphStructure map[string][]string) []float32 {
	features := make([]float32, fe.graphFeatureSize)
	
	nodeCount := len(graphStructure)
	edgeCount := 0
	maxDegree := 0
	
	for _, neighbors := range graphStructure {
		edgeCount += len(neighbors)
		if len(neighbors) > maxDegree {
			maxDegree = len(neighbors)
		}
	}
	
	avgDegree := float64(0)
	if nodeCount > 0 {
		avgDegree = float64(edgeCount) / float64(nodeCount)
	}
	
	density := float64(0)
	if nodeCount > 1 {
		maxEdges := nodeCount * (nodeCount - 1)
		if maxEdges > 0 {
			density = float64(edgeCount) / float64(maxEdges)
		}
	}
	
	for i := range features {
		features[i] = float32(
			math.Sin(float64(i+1)*0.1)*float64(nodeCount)/10.0 +
			math.Cos(float64(i+1)*0.2)*avgDegree/5.0 +
			float64(maxDegree)/20.0 +
			density,
		)
		if features[i] > 1.0 {
			features[i] = 1.0
		}
		if features[i] < 0 {
			features[i] = 0
		}
	}
	
	return features
}

func (fe *FeatureExtractor) CombineFeatures(textFeatures, graphFeatures []float32) []float32 {
	combined := make([]float32, len(textFeatures)+len(graphFeatures))
	copy(combined, textFeatures)
	copy(combined[len(textFeatures):], graphFeatures)
	return combined
}
