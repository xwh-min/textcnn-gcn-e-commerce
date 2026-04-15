package inference

import (
	"encoding/json"
	"fmt"
	"os"
)

type FeatureSpec struct {
	SchemaVersion    string `json:"schema_version"`
	TextFeatureSize  int    `json:"text_feature_size"`
	GraphFeatureSize int    `json:"graph_feature_size"`
	TotalFeatureSize int    `json:"total_feature_size"`
	FeatureSource    string `json:"feature_source"`
	TextNorm         string `json:"text_norm"`
	GraphNorm        string `json:"graph_norm"`
	MissingPolicy    string `json:"missing_policy"`
}

type FeatureSpecCheckResult struct {
	Path            string `json:"path"`
	Loaded          bool   `json:"loaded"`
	Aligned         bool   `json:"aligned"`
	Error           string `json:"error,omitempty"`
	ExpectedSchema  string `json:"expected_schema"`
	ExpectedTotal   int    `json:"expected_total"`
	ActualSchema    string `json:"actual_schema,omitempty"`
	ActualTotal     int    `json:"actual_total,omitempty"`
	ExpectedSource  string `json:"expected_source"`
	ActualSource    string `json:"actual_source,omitempty"`
}

func LoadFeatureSpec(path string) (*FeatureSpec, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var spec FeatureSpec
	if err := json.Unmarshal(b, &spec); err != nil {
		return nil, err
	}
	return &spec, nil
}

func CheckFeatureSpec(path string, meta FeatureMeta, onnxInputSize int) FeatureSpecCheckResult {
	res := FeatureSpecCheckResult{
		Path:           path,
		ExpectedSchema: meta.SchemaVersion,
		ExpectedTotal:  meta.TotalFeatureSize,
		ExpectedSource: meta.FeatureSource,
	}

	spec, err := LoadFeatureSpec(path)
	if err != nil {
		res.Error = err.Error()
		return res
	}
	res.Loaded = true
	res.ActualSchema = spec.SchemaVersion
	res.ActualTotal = spec.TotalFeatureSize
	res.ActualSource = spec.FeatureSource

	if spec.SchemaVersion != meta.SchemaVersion {
		res.Error = fmt.Sprintf("schema mismatch: spec=%s runtime=%s", spec.SchemaVersion, meta.SchemaVersion)
		return res
	}
	if spec.TotalFeatureSize != meta.TotalFeatureSize {
		res.Error = fmt.Sprintf("total feature size mismatch: spec=%d runtime=%d", spec.TotalFeatureSize, meta.TotalFeatureSize)
		return res
	}
	if onnxInputSize > 0 && spec.TotalFeatureSize != onnxInputSize {
		res.Error = fmt.Sprintf("onnx.input_size mismatch: spec=%d config=%d", spec.TotalFeatureSize, onnxInputSize)
		return res
	}
	if spec.FeatureSource != "" && spec.FeatureSource != meta.FeatureSource {
		res.Error = fmt.Sprintf("feature source mismatch: spec=%s runtime=%s", spec.FeatureSource, meta.FeatureSource)
		return res
	}

	res.Aligned = true
	return res
}
