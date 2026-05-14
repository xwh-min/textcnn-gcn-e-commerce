package inference

import (
	"fmt"
	"log"
	"runtime"
	"strings"

	"server/config"
)

func NewPredictor(conf *config.InitConfig) (Predictor, error) {
	backend := strings.ToLower(strings.TrimSpace(conf.Inference.Backend))
	if backend == "" {
		backend = "auto"
	}

	if backend == "auto" {
		if runtime.GOOS == "windows" {
			backend = "remote"
		} else {
			backend = "onnx"
		}
	}

	switch backend {
	case "remote":
		return buildRemoteChain(conf)
	case "onnx":
		return buildONNXChain(conf)
	case "mock":
		return buildMock(conf)
	default:
		return nil, fmt.Errorf("unsupported inference backend: %s", backend)
	}
}

func buildRemoteChain(conf *config.InitConfig) (Predictor, error) {
	remoteURL := strings.TrimSpace(conf.Inference.Remote.URL)
	if remoteURL == "" {
		if conf.Inference.Strict {
			return nil, fmt.Errorf("inference.remote.url is required when backend=remote")
		}
		return buildONNXChain(conf)
	}

	primary := NewRemoteAIInference(remoteURL, conf.Inference.Remote.TimeoutMS, conf.Inference.Remote.APIKey)

	if conf.Inference.Remote.Username != "" && conf.Inference.Remote.Password != "" {
		primary.SetCredentials(conf.Inference.Remote.Username, conf.Inference.Remote.Password)
		log.Printf("AI service credentials configured, will auto-acquire token")
	}

	if conf.Inference.Strict {
		return primary, nil
	}

	onnxOrMock, err := buildONNXChain(conf)
	if err != nil {
		return primary, nil
	}
	if onnxOrMock.Backend() == "mock" {
		return primary, nil
	}

	mockPred, _ := buildMock(conf)
	return NewCompositePredictor(primary, NewCompositePredictor(onnxOrMock, mockPred, false), false), nil
}

func buildONNXChain(conf *config.InitConfig) (Predictor, error) {
	onnxPred, err := NewONNXInference(Config{ModelPath: conf.ONNX.ModelPath, InputSize: conf.ONNX.InputSize})
	if err != nil {
		if conf.Inference.Strict {
			return nil, err
		}
		log.Printf("⚠️  ONNX predictor init failed, fallback to mock: %v", err)
		return buildMock(conf)
	}

	if onnxPred.IsMock() {
		log.Printf("ℹ️  ONNX backend currently running in mock mode")
	} else {
		log.Printf("✓ ONNX runtime backend enabled")
	}

	if conf.Inference.Strict {
		return onnxPred, nil
	}

	if onnxPred.IsMock() {
		return onnxPred, nil
	}

	mockPred, _ := buildMock(conf)
	return NewCompositePredictor(onnxPred, mockPred, false), nil
}

func buildMock(conf *config.InitConfig) (Predictor, error) {
	return NewONNXInference(Config{ModelPath: "", InputSize: conf.ONNX.InputSize})
}
