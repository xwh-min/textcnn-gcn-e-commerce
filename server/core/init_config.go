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
	globle.Conf = c
	fmt.Println(c)
	InitLogger()
}
