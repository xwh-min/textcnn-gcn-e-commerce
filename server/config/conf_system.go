package config

type InitConfig struct {
	System   System   `yaml:"system"`
	Log      Log      `yaml:"log"`
	Database Database `yaml:"db"`
}
