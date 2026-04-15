package inference

import (
	"fmt"
	"math"
	"strings"
)

const (
	FeatureSchemaVersion = "v1"
)

type FeatureExtractor struct {
	textFeatureSize  int
	graphFeatureSize int
}

type FeatureMeta struct {
	SchemaVersion    string `json:"schema_version"`
	TextFeatureSize  int    `json:"text_feature_size"`
	GraphFeatureSize int    `json:"graph_feature_size"`
	TotalFeatureSize int    `json:"total_feature_size"`
	TextNorm         string `json:"text_norm"`
	GraphNorm        string `json:"graph_norm"`
	MissingPolicy    string `json:"missing_policy"`
	FeatureSource    string `json:"feature_source"`
}

func NewFeatureExtractor(textSize, graphSize int) *FeatureExtractor {
	return &FeatureExtractor{
		textFeatureSize:  textSize,
		graphFeatureSize: graphSize,
	}
}

func (fe *FeatureExtractor) FeatureMeta() FeatureMeta {
	return FeatureMeta{
		SchemaVersion:    FeatureSchemaVersion,
		TextFeatureSize:  fe.textFeatureSize,
		GraphFeatureSize: fe.graphFeatureSize,
		TotalFeatureSize: fe.textFeatureSize + fe.graphFeatureSize,
		TextNorm:         "clip[0,1], denominator=(utf8_len(recent_data)+1)",
		GraphNorm:        "derived stats + clip[0,1]",
		MissingPolicy:    "empty text/list/graph => zero-safe fallback",
		FeatureSource:    "heuristic-v1",
	}
}

func (fe *FeatureExtractor) ValidateCombinedFeatures(combined []float32) error {
	expected := fe.textFeatureSize + fe.graphFeatureSize
	if len(combined) != expected {
		return fmt.Errorf("invalid feature length: got=%d expected=%d", len(combined), expected)
	}
	for idx, val := range combined {
		if val < 0 || val > 1 {
			return fmt.Errorf("feature out of range [0,1] at index=%d value=%f", idx, val)
		}
	}
	return nil
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

func (fe *FeatureExtractor) ExtractGraphFeatures(graphStructure map[string]interface{}) []float32 {
	features := make([]float32, fe.graphFeatureSize)

	// 兼容两种结构：
	// 1) 旧版邻接表：map[string][]string
	// 2) 新版前端结构：{ nodes: [...], edges: [...] }
	nodeCount := 0
	edgeCount := 0
	maxDegree := 0

	if rawNodes, ok := graphStructure["nodes"]; ok {
		if nodes, ok := rawNodes.([]interface{}); ok {
			nodeCount = len(nodes)
		}
	}

	if rawEdges, ok := graphStructure["edges"]; ok {
		if edges, ok := rawEdges.([]interface{}); ok {
			edgeCount = len(edges)
			if nodeCount > 0 {
				maxDegree = int(math.Ceil(float64(2*edgeCount) / float64(nodeCount)))
			}
		}
	}

	if nodeCount == 0 {
		nodeCount = len(graphStructure)
		for _, value := range graphStructure {
			if neighbors, ok := value.([]string); ok {
				edgeCount += len(neighbors)
				if len(neighbors) > maxDegree {
					maxDegree = len(neighbors)
				}
			}
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
