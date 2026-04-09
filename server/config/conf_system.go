package config

type ONNX struct {
	ModelPath string `yaml:"model_path"`
	InputSize int    `yaml:"input_size"`
}

type InitConfig struct {
	System   System   `yaml:"system"`
	Log      Log      `yaml:"log"`
	Database Database `yaml:"db"`
	ONNX     ONNX     `yaml:"onnx"`
}
