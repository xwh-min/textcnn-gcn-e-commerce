package core

import (
	"fmt"
	"os"
	"server/config"
	"server/flags"
	"server/globle"

	"gopkg.in/yaml.v2"
)

func ReadConf() {
	BateData, err := os.ReadFile(flags.FlagsOptions.File)
	if err != nil {
		panic(err)
	}
	c := new(config.InitConfig)
	err = yaml.Unmarshal(BateData, &c)
	if err != nil {
		panic(err)
	}
	
	// 支持从环境变量覆盖 API Key
	if apiKey := os.Getenv("INFERENCE_REMOTE_API_KEY"); apiKey != "" {
		c.Inference.Remote.APIKey = apiKey
	}
	
	globle.Conf = c
	fmt.Println(c)
	InitLogger()
}
