package config

type ONNX struct {
	ModelPath       string `yaml:"model_path"`
	InputSize       int    `yaml:"input_size"`
	FeatureSpecPath string `yaml:"feature_spec_path"`
}

type InferenceRemote struct {
	URL       string `yaml:"url"`
	TimeoutMS int    `yaml:"timeout_ms"`
}

type Inference struct {
	Backend string          `yaml:"backend"`
	Strict  bool            `yaml:"strict"`
	Remote  InferenceRemote `yaml:"remote"`
}

type InitConfig struct {
	System    System    `yaml:"system"`
	Log       Log       `yaml:"log"`
	Database  Database  `yaml:"db"`
	ONNX      ONNX      `yaml:"onnx"`
	Inference Inference `yaml:"inference"`
}
