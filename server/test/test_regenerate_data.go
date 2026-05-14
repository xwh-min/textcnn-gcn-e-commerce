package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost port=5432 user=postgres password=xwh20040916 dbname=service sslmode=disable"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("=== 重新生成订单和物流数据 ===")
	fmt.Println("")

	fmt.Println("1. 清空现有数据...")
	err = db.Exec("TRUNCATE TABLE logistics_record CASCADE").Error
	if err != nil {
		log.Fatalf("Failed to truncate logistics_record: %v", err)
	}

	err = db.Exec("TRUNCATE TABLE order_data CASCADE").Error
	if err != nil {
		log.Fatalf("Failed to truncate order_data: %v", err)
	}

	fmt.Println("2. 插入订单数据...")
	orderData := []map[string]interface{}{
		{"company_id": 1, "order_no": "ORD20260101001", "product_name": "Apple iPhone 14 Pro Max", "quantity": 30, "order_amount": 7500.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 1, "order_date": "2026-01-05", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 1, "order_no": "ORD20260201002", "product_name": "Nike Air Max运动鞋", "quantity": 150, "order_amount": 6675.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 2, "order_date": "2026-02-10", "payment_status": "completed", "extra_info": `{"product": "服装"}`},
		{"company_id": 1, "order_no": "ORD20260301003", "product_name": "Dyson V15吸尘器", "quantity": 80, "order_amount": 12480.00, "currency": "USD", "destination_country": "日本", "logistics_provider_id": 1, "order_date": "2026-03-15", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 1, "order_no": "ORD20260401004", "product_name": "Swarovski水晶饰品", "quantity": 60, "order_amount": 17550.00, "currency": "USD", "destination_country": "澳大利亚", "logistics_provider_id": 2, "order_date": "2026-04-20", "payment_status": "confirmed", "extra_info": `{"product": "饰品"}`},
		{"company_id": 1, "order_no": "ORD20260501005", "product_name": "Samsung Galaxy S24", "quantity": 45, "order_amount": 14850.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 1, "order_date": "2026-05-25", "payment_status": "confirmed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 1, "order_no": "ORD20260601006", "product_name": "Sony WH-1000XM5耳机", "quantity": 70, "order_amount": 11900.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 2, "order_date": "2026-06-30", "payment_status": "pending", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 2, "order_no": "ORD20260102007", "product_name": "资生堂护肤套装", "quantity": 200, "order_amount": 6500.00, "currency": "USD", "destination_country": "东南亚", "logistics_provider_id": 3, "order_date": "2026-01-08", "payment_status": "completed", "extra_info": `{"product": "化妆品"}`},
		{"company_id": 2, "order_no": "ORD20260202008", "product_name": "Apple MacBook Pro", "quantity": 40, "order_amount": 12400.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 3, "order_date": "2026-02-12", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 2, "order_no": "ORD20260302009", "product_name": "Lululemon瑜伽服", "quantity": 120, "order_amount": 8900.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 3, "order_date": "2026-03-18", "payment_status": "completed", "extra_info": `{"product": "服装"}`},
		{"company_id": 2, "order_no": "ORD20260402010", "product_name": "SK-II神仙水", "quantity": 90, "order_amount": 10980.00, "currency": "USD", "destination_country": "日本", "logistics_provider_id": 3, "order_date": "2026-04-22", "payment_status": "confirmed", "extra_info": `{"product": "化妆品"}`},
		{"company_id": 3, "order_no": "ORD20260103011", "product_name": "戴森空气净化器", "quantity": 50, "order_amount": 11500.00, "currency": "USD", "destination_country": "澳大利亚", "logistics_provider_id": 4, "order_date": "2026-01-10", "payment_status": "completed", "extra_info": `{"product": "家居用品"}`},
		{"company_id": 3, "order_no": "ORD20260203012", "product_name": "乐高积木", "quantity": 180, "order_amount": 12240.00, "currency": "USD", "destination_country": "东南亚", "logistics_provider_id": 4, "order_date": "2026-02-15", "payment_status": "completed", "extra_info": `{"product": "玩具"}`},
		{"company_id": 3, "order_no": "ORD20260303013", "product_name": "小米智能电视", "quantity": 30, "order_amount": 6600.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 4, "order_date": "2026-03-20", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 4, "order_no": "ORD20260104014", "product_name": "华为Mate 60 Pro", "quantity": 55, "order_amount": 13410.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 5, "order_date": "2026-01-12", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 4, "order_no": "ORD20260204015", "product_name": "飞利浦剃须刀", "quantity": 100, "order_amount": 4500.00, "currency": "USD", "destination_country": "日本", "logistics_provider_id": 5, "order_date": "2026-02-18", "payment_status": "completed", "extra_info": `{"product": "个人护理"}`},
		{"company_id": 4, "order_no": "ORD20260304016", "product_name": "欧莱雅礼盒", "quantity": 150, "order_amount": 6600.00, "currency": "USD", "destination_country": "东南亚", "logistics_provider_id": 5, "order_date": "2026-03-22", "payment_status": "completed", "extra_info": `{"product": "化妆品"}`},
		{"company_id": 5, "order_no": "ORD20260105017", "product_name": "佳能EOS R6", "quantity": 25, "order_amount": 20000.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 1, "order_date": "2026-01-15", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 5, "order_no": "ORD20260205018", "product_name": "雅诗兰黛眼霜", "quantity": 120, "order_amount": 8400.00, "currency": "USD", "destination_country": "日本", "logistics_provider_id": 1, "order_date": "2026-02-20", "payment_status": "completed", "extra_info": `{"product": "化妆品"}`},
		{"company_id": 5, "order_no": "ORD20260305019", "product_name": "海尔冰箱", "quantity": 20, "order_amount": 12000.00, "currency": "USD", "destination_country": "澳大利亚", "logistics_provider_id": 1, "order_date": "2026-03-25", "payment_status": "confirmed", "extra_info": `{"product": "大家电"}`},
		{"company_id": 6, "order_no": "ORD20260106020", "product_name": "美的空调", "quantity": 35, "order_amount": 12250.00, "currency": "USD", "destination_country": "东南亚", "logistics_provider_id": 2, "order_date": "2026-01-18", "payment_status": "completed", "extra_info": `{"product": "大家电"}`},
		{"company_id": 6, "order_no": "ORD20260206021", "product_name": "OPPO Find X7", "quantity": 50, "order_amount": 8500.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 2, "order_date": "2026-02-22", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 6, "order_no": "ORD20260306022", "product_name": "iPad Pro", "quantity": 40, "order_amount": 10400.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 2, "order_date": "2026-03-28", "payment_status": "confirmed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 7, "order_no": "ORD20260107023", "product_name": "膳魔师保温杯", "quantity": 200, "order_amount": 3000.00, "currency": "USD", "destination_country": "日本", "logistics_provider_id": 3, "order_date": "2026-01-20", "payment_status": "completed", "extra_info": `{"product": "家居用品"}`},
		{"company_id": 7, "order_no": "ORD20260207024", "product_name": "华硕笔记本", "quantity": 35, "order_amount": 12250.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 3, "order_date": "2026-02-25", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 8, "order_no": "ORD20260108025", "product_name": "戴尔显示器", "quantity": 60, "order_amount": 9000.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 10, "order_date": "2026-01-22", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 8, "order_no": "ORD20260208026", "product_name": "惠普打印机", "quantity": 40, "order_amount": 7200.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 10, "order_date": "2026-02-28", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 9, "order_no": "ORD20260109027", "product_name": "联想ThinkPad", "quantity": 30, "order_amount": 11400.00, "currency": "USD", "destination_country": "美国", "logistics_provider_id": 1, "order_date": "2026-01-25", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 9, "order_no": "ORD20260209028", "product_name": "漫步者音响", "quantity": 100, "order_amount": 3500.00, "currency": "USD", "destination_country": "东南亚", "logistics_provider_id": 1, "order_date": "2026-02-28", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
		{"company_id": 10, "order_no": "ORD20260110029", "product_name": "海信电视", "quantity": 25, "order_amount": 8750.00, "currency": "USD", "destination_country": "东南亚", "logistics_provider_id": 10, "order_date": "2026-01-28", "payment_status": "completed", "extra_info": `{"product": "大家电"}`},
		{"company_id": 10, "order_no": "ORD20260210030", "product_name": "vivo X100", "quantity": 55, "order_amount": 9900.00, "currency": "USD", "destination_country": "欧洲", "logistics_provider_id": 10, "order_date": "2026-02-28", "payment_status": "completed", "extra_info": `{"product": "电子产品"}`},
	}

	for _, order := range orderData {
		err := db.Table("order_data").Create(order).Error
		if err != nil {
			log.Fatalf("Failed to insert order %s: %v", order["order_no"], err)
		}
	}
	fmt.Println("   ✓ 订单数据插入完成")

	fmt.Println("3. 插入物流记录数据...")
	logisticsData := []map[string]interface{}{
		{"order_no": "ORD20260101001", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF1234567890", "customs_name": "深圳海关", "status": "delivered", "shipped_date": "2026-01-06", "cleared_date": "2026-01-10", "delayed_days": 0, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260201002", "provider_name": "中通国际物流股份有限公司", "tracking_no": "ZT9876543210", "customs_name": "上海海关", "status": "delivered", "shipped_date": "2026-02-11", "cleared_date": "2026-02-15", "delayed_days": 1, "extra_info": `{"weight": "8kg"}`},
		{"order_no": "ORD20260301003", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF2345678901", "customs_name": "深圳海关", "status": "delivered", "shipped_date": "2026-03-16", "cleared_date": "2026-03-19", "delayed_days": 0, "extra_info": `{"weight": "4kg"}`},
		{"order_no": "ORD20260401004", "provider_name": "中通国际物流股份有限公司", "tracking_no": "ZT3456789012", "customs_name": "上海海关", "status": "shipped", "shipped_date": "2026-04-21", "cleared_date": nil, "delayed_days": 0, "extra_info": `{"weight": "6kg"}`},
		{"order_no": "ORD20260501005", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF3456789012", "customs_name": "深圳海关", "status": "shipped", "shipped_date": "2026-05-26", "cleared_date": nil, "delayed_days": 0, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260601006", "provider_name": "中通国际物流股份有限公司", "tracking_no": "ZT4567890123", "customs_name": "上海海关", "status": "pending", "shipped_date": "2026-07-01", "cleared_date": nil, "delayed_days": 1, "extra_info": `{"weight": "7kg"}`},
		{"order_no": "ORD20260102007", "provider_name": "韵达国际物流有限公司", "tracking_no": "YD5678901234", "customs_name": "广州海关", "status": "delivered", "shipped_date": "2026-01-09", "cleared_date": "2026-01-12", "delayed_days": 0, "extra_info": `{"weight": "10kg"}`},
		{"order_no": "ORD20260202008", "provider_name": "韵达国际物流有限公司", "tracking_no": "YD6789012345", "customs_name": "广州海关", "status": "delivered", "shipped_date": "2026-02-13", "cleared_date": "2026-02-16", "delayed_days": 0, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260302009", "provider_name": "韵达国际物流有限公司", "tracking_no": "YD7890123456", "customs_name": "杭州海关", "status": "delivered", "shipped_date": "2026-03-19", "cleared_date": "2026-03-22", "delayed_days": 0, "extra_info": `{"weight": "4kg"}`},
		{"order_no": "ORD20260402010", "provider_name": "韵达国际物流有限公司", "tracking_no": "YD8901234567", "customs_name": "广州海关", "status": "shipped", "shipped_date": "2026-04-23", "cleared_date": nil, "delayed_days": 0, "extra_info": `{"weight": "7kg"}`},
		{"order_no": "ORD20260103011", "provider_name": "申通国际物流有限公司", "tracking_no": "ST8901234567", "customs_name": "上海海关", "status": "delivered", "shipped_date": "2026-01-11", "cleared_date": "2026-01-15", "delayed_days": 2, "extra_info": `{"weight": "6kg"}`},
		{"order_no": "ORD20260203012", "provider_name": "申通国际物流有限公司", "tracking_no": "ST9012345678", "customs_name": "上海海关", "status": "delivered", "shipped_date": "2026-02-16", "cleared_date": "2026-02-20", "delayed_days": 1, "extra_info": `{"weight": "12kg"}`},
		{"order_no": "ORD20260303013", "provider_name": "申通国际物流有限公司", "tracking_no": "ST0123456789", "customs_name": "上海海关", "status": "delivered", "shipped_date": "2026-03-21", "cleared_date": "2026-03-25", "delayed_days": 1, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260104014", "provider_name": "圆通国际物流有限公司", "tracking_no": "YT0123456789", "customs_name": "广州海关", "status": "delivered", "shipped_date": "2026-01-13", "cleared_date": "2026-01-17", "delayed_days": 0, "extra_info": `{"weight": "4kg"}`},
		{"order_no": "ORD20260204015", "provider_name": "圆通国际物流有限公司", "tracking_no": "YT1234567890", "customs_name": "广州海关", "status": "delivered", "shipped_date": "2026-02-19", "cleared_date": "2026-02-23", "delayed_days": 0, "extra_info": `{"weight": "3kg"}`},
		{"order_no": "ORD20260304016", "provider_name": "圆通国际物流有限公司", "tracking_no": "YT2345678901", "customs_name": "广州海关", "status": "delivered", "shipped_date": "2026-03-23", "cleared_date": "2026-03-27", "delayed_days": 0, "extra_info": `{"weight": "10kg"}`},
		{"order_no": "ORD20260105017", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF4567890123", "customs_name": "宁波海关", "status": "delivered", "shipped_date": "2026-01-16", "cleared_date": "2026-01-19", "delayed_days": 0, "extra_info": `{"weight": "4kg"}`},
		{"order_no": "ORD20260205018", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF5678901234", "customs_name": "宁波海关", "status": "delivered", "shipped_date": "2026-02-21", "cleared_date": "2026-02-24", "delayed_days": 0, "extra_info": `{"weight": "6kg"}`},
		{"order_no": "ORD20260305019", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF6789012345", "customs_name": "宁波海关", "status": "shipped", "shipped_date": "2026-03-26", "cleared_date": nil, "delayed_days": 0, "extra_info": `{"weight": "8kg"}`},
		{"order_no": "ORD20260106020", "provider_name": "中通国际物流股份有限公司", "tracking_no": "ZT5678901234", "customs_name": "杭州海关", "status": "delivered", "shipped_date": "2026-01-19", "cleared_date": "2026-01-23", "delayed_days": 0, "extra_info": `{"weight": "12kg"}`},
		{"order_no": "ORD20260206021", "provider_name": "中通国际物流股份有限公司", "tracking_no": "ZT6789012345", "customs_name": "杭州海关", "status": "delivered", "shipped_date": "2026-02-23", "cleared_date": "2026-02-27", "delayed_days": 0, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260306022", "provider_name": "中通国际物流股份有限公司", "tracking_no": "ZT7890123456", "customs_name": "深圳海关", "status": "shipped", "shipped_date": "2026-03-29", "cleared_date": nil, "delayed_days": 0, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260107023", "provider_name": "韵达国际物流有限公司", "tracking_no": "YD9012345678", "customs_name": "厦门海关", "status": "delivered", "shipped_date": "2026-01-21", "cleared_date": "2026-01-24", "delayed_days": 0, "extra_info": `{"weight": "15kg"}`},
		{"order_no": "ORD20260207024", "provider_name": "韵达国际物流有限公司", "tracking_no": "YD0123456789", "customs_name": "厦门海关", "status": "delivered", "shipped_date": "2026-02-26", "cleared_date": "2026-03-01", "delayed_days": 1, "extra_info": `{"weight": "6kg"}`},
		{"order_no": "ORD20260108025", "provider_name": "中外运敦豪国际航空快递", "tracking_no": "ST1234567890", "customs_name": "天津海关", "status": "delivered", "shipped_date": "2026-01-23", "cleared_date": "2026-01-27", "delayed_days": 2, "extra_info": `{"weight": "5kg"}`},
		{"order_no": "ORD20260208026", "provider_name": "中外运敦豪国际航空快递", "tracking_no": "ST2345678901", "customs_name": "天津海关", "status": "delivered", "shipped_date": "2026-03-01", "cleared_date": "2026-03-05", "delayed_days": 2, "extra_info": `{"weight": "4kg"}`},
		{"order_no": "ORD20260109027", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF7890123456", "customs_name": "南京海关", "status": "delivered", "shipped_date": "2026-01-26", "cleared_date": "2026-01-29", "delayed_days": 0, "extra_info": `{"weight": "4kg"}`},
		{"order_no": "ORD20260209028", "provider_name": "顺丰国际物流有限公司", "tracking_no": "SF8901234567", "customs_name": "南京海关", "status": "delivered", "shipped_date": "2026-03-01", "cleared_date": "2026-03-04", "delayed_days": 0, "extra_info": `{"weight": "8kg"}`},
		{"order_no": "ORD20260110029", "provider_name": "中外运敦豪国际航空快递", "tracking_no": "ST3456789012", "customs_name": "深圳海关", "status": "delivered", "shipped_date": "2026-01-29", "cleared_date": "2026-02-02", "delayed_days": 1, "extra_info": `{"weight": "8kg"}`},
		{"order_no": "ORD20260210030", "provider_name": "中外运敦豪国际航空快递", "tracking_no": "ST4567890123", "customs_name": "深圳海关", "status": "delivered", "shipped_date": "2026-03-01", "cleared_date": "2026-03-05", "delayed_days": 1, "extra_info": `{"weight": "5kg"}`},
	}

	for _, logistics := range logisticsData {
		var orderID int64
		err := db.Table("order_data").Where("order_no = ?", logistics["order_no"]).Pluck("id", &orderID).Error
		if err != nil {
			log.Fatalf("Failed to get order ID for %s: %v", logistics["order_no"], err)
		}

		var providerID int64
		err = db.Table("logistics_provider").Where("provider_name = ?", logistics["provider_name"]).Pluck("id", &providerID).Error
		if err != nil {
			log.Fatalf("Failed to get provider ID for %s: %v", logistics["provider_name"], err)
		}

		var customsID *int64
		if logistics["customs_name"] != nil {
			var cID int64
			err = db.Table("customs").Where("customs_name = ?", logistics["customs_name"]).Pluck("id", &cID).Error
			if err != nil {
				log.Fatalf("Failed to get customs ID for %s: %v", logistics["customs_name"], err)
			}
			customsID = &cID
		}

		logisticsRecord := map[string]interface{}{
			"order_id":              orderID,
			"logistics_provider_id": providerID,
			"tracking_no":           logistics["tracking_no"],
			"customs_id":            customsID,
			"status":                logistics["status"],
			"shipped_date":          logistics["shipped_date"],
			"cleared_date":          logistics["cleared_date"],
			"delayed_days":          logistics["delayed_days"],
			"extra_info":            logistics["extra_info"],
		}

		err = db.Table("logistics_record").Create(logisticsRecord).Error
		if err != nil {
			log.Fatalf("Failed to insert logistics record for %s: %v", logistics["tracking_no"], err)
		}
	}
	fmt.Println("   ✓ 物流记录数据插入完成")

	fmt.Println("")
	fmt.Println("=== 数据生成完成 ===")

	var orderCount, logisticsCount int64
	db.Table("order_data").Count(&orderCount)
	db.Table("logistics_record").Count(&logisticsCount)

	fmt.Printf("订单数据: %d 条\n", orderCount)
	fmt.Printf("物流记录: %d 条\n", logisticsCount)
	fmt.Println("✓ 外键约束验证通过！")
}
