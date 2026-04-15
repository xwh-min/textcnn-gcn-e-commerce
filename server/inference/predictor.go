package inference

import "context"

// InferencePayload 是统一推理请求载荷，兼容本地ONNX与远端AI服务。
type InferencePayload struct {
	Features       []float32
	CompanyName    string
	RecentData     string
	PolicyNews     []string
	UserComplaints []string
	GraphStructure map[string]interface{}
}

// Predictor 是统一推理引擎接口，支持 remote/onnx/mock 多后端。
type Predictor interface {
	Predict(input []float32) ([]float32, error)
	PredictWithPayload(ctx context.Context, payload InferencePayload) ([]float32, error)
	Health(ctx context.Context) error
	Close() error
	IsMock() bool
	Backend() string
}
