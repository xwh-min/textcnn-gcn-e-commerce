package flags

import "flag"

type Flags struct {
	File    string
	DB      bool
	Version bool
}

var FlagsOptions = new(Flags)

func Parse() {
	flag.StringVar(&FlagsOptions.File, "f", "settings.yaml", "配置文件")
	flag.BoolVar(&FlagsOptions.DB, "db", false, "数据库迁移")
	flag.BoolVar(&FlagsOptions.Version, "v", false, "版本")
	flag.Parse()
}
