package inference

import (
	"log"
	"os"
)

type ONNXInference struct {
	modelPath string
	isMock    bool
	inputSize int
}

type Config struct {
	ModelPath string
	InputSize int
}

func NewONNXInference(config Config) (*ONNXInference, error) {
	log.Printf("Loading ONNX model from: %s", config.ModelPath)

	if _, err := os.Stat(config.ModelPath); err != nil {
		log.Printf("⚠️  ONNX model file not found: %v", err)
		log.Printf("   Using mock implementation")
		return &ONNXInference{
			modelPath: config.ModelPath,
			isMock:    true,
			inputSize: config.InputSize,
		}, nil
	}

	log.Printf("✓ ONNX model file found")
	log.Printf("⚠️  Note: Real ONNX inference requires CGO and ONNX Runtime")
	log.Printf("   To enable real inference, rename onnx_real.go to onnx.go (replacing this file)")
	log.Printf("   Current implementation uses mock for demonstration")

	return &ONNXInference{
		modelPath: config.ModelPath,
		isMock:    true,
		inputSize: config.InputSize,
	}, nil
}

func (i *ONNXInference) IsMock() bool {
	return i.isMock
}

func (i *ONNXInference) Predict(input []float32) ([]float32, error) {
	if len(input) == 0 {
		return nil, ErrInvalidInputSize
	}

	log.Printf("Running inference with input size: %d", len(input))

	return i.mockPredict(input)
}

func (i *ONNXInference) mockPredict(input []float32) ([]float32, error) {
	log.Printf("Using mock prediction")

	sum := float32(0)
	for _, v := range input {
		sum += v
	}
	avg := sum / float32(len(input))

	complianceScore := 0.4 + avg*0.3
	paymentScore := 0.3 + avg*0.2

	if complianceScore > 1.0 {
		complianceScore = 1.0
	}
	if paymentScore > 1.0 {
		paymentScore = 1.0
	}
	if complianceScore < 0.0 {
		complianceScore = 0.0
	}
	if paymentScore < 0.0 {
		paymentScore = 0.0
	}

	log.Printf("Mock prediction - Compliance: %.2f, Payment: %.2f", complianceScore, paymentScore)
	return []float32{complianceScore, paymentScore}, nil
}

func (i *ONNXInference) Close() error {
	log.Printf("ONNX inference closed")
	return nil
}
