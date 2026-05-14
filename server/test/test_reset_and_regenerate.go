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
		log.Fatalf("数据库连接失败: %v", err)
	}
	fmt.Println("✅ 数据库连接成功")
	fmt.Println("")

	fmt.Println("=== 重置数据库序列 ===")
	tables := []string{"order_data", "logistics_record", "risk_prediction", "graph_relation", "policy_news", "user_complaint"}
	
	for _, table := range tables {
		err := db.Exec(fmt.Sprintf("ALTER SEQUENCE %s_id_seq RESTART WITH 1", table)).Error
		if err != nil {
			fmt.Printf("⚠️ 重置 %s 序列失败: %v\n", table, err)
		} else {
			fmt.Printf("✅ 重置 %s 序列成功\n", table)
		}
	}
	fmt.Println("")

	fmt.Println("=== 清空所有数据表 ===")
	err = db.Exec("TRUNCATE TABLE logistics_record, order_data, risk_prediction, graph_relation, policy_news, user_complaint CASCADE").Error
	if err != nil {
		log.Fatalf("清空表失败: %v", err)
	}
	fmt.Println("✅ 所有表已清空")
	fmt.Println("")

	fmt.Println("=== 重新生成订单数据 ===")
	orders := []map[string]interface{}{
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

	for i, order := range orders {
		err := db.Table("order_data").Create(order).Error
		if err != nil {
			log.Fatalf("插入订单 %d 失败: %v", i+1, err)
		}
	}
	fmt.Printf("✅ 插入 %d 条订单数据\n", len(orders))
	fmt.Println("")

	fmt.Println("=== 重新生成物流记录 ===")
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

	for i, logistics := range logisticsData {
		var orderID int64
		db.Table("order_data").Where("order_no = ?", logistics["order_no"]).Pluck("id", &orderID)

		var providerID int64
		db.Table("logistics_provider").Where("provider_name = ?", logistics["provider_name"]).Pluck("id", &providerID)

		var customsID *int64
		if logistics["customs_name"] != nil {
			var cID int64
			db.Table("customs").Where("customs_name = ?", logistics["customs_name"]).Pluck("id", &cID)
			customsID = &cID
		}

		err := db.Table("logistics_record").Create(map[string]interface{}{
			"order_id":              orderID,
			"logistics_provider_id": providerID,
			"tracking_no":           logistics["tracking_no"],
			"customs_id":            customsID,
			"status":                logistics["status"],
			"shipped_date":          logistics["shipped_date"],
			"cleared_date":          logistics["cleared_date"],
			"delayed_days":          logistics["delayed_days"],
			"extra_info":            logistics["extra_info"],
		}).Error

		if err != nil {
			log.Fatalf("插入物流记录 %d 失败: %v", i+1, err)
		}
	}
	fmt.Printf("✅ 插入 %d 条物流记录\n", len(logisticsData))
	fmt.Println("")

	fmt.Println("=== 生成风险预测数据 ===")
	for month := 1; month <= 6; month++ {
		for companyID := 1; companyID <= 10; companyID++ {
			riskLevel := "low"
			if companyID == 3 || companyID == 8 || companyID == 10 {
				if month < 4 {
					riskLevel = "high"
				} else if month < 6 {
					riskLevel = "medium"
				} else {
					riskLevel = "medium"
					if companyID == 8 {
						riskLevel = "medium"
					}
				}
			} else if companyID == 1 || companyID == 4 || companyID == 6 {
				if month < 3 {
					riskLevel = "medium"
				} else {
					riskLevel = "low"
				}
			}

			complianceRisk := 0
			paymentRisk := 0
			if riskLevel == "high" {
				complianceRisk = 1
				paymentRisk = 1
			} else if riskLevel == "medium" {
				if companyID%2 == 0 {
					complianceRisk = 1
				} else {
					paymentRisk = 1
				}
			}

			err := db.Table("risk_prediction").Create(map[string]interface{}{
				"company_id":            companyID,
				"company_name":          fmt.Sprintf("测试公司%d", companyID),
				"start_date":            fmt.Sprintf("2026-%02d-01", month),
				"end_date":              fmt.Sprintf("2026-%02d-28", month),
				"compliance_risk":       complianceRisk,
				"compliance_prob":       0.2 + float64(companyID)*0.05 + float64(month)*0.02,
				"payment_risk":          paymentRisk,
				"payment_prob":          0.2 + float64(companyID)*0.05 + float64(month)*0.02,
				"risk_level":            riskLevel,
				"risk_reason":           "自动生成的风险评估",
				"graph_feature_summary": "图特征正常",
				"text_feature_summary":  "文本特征正常",
				"model_version":         "v1.0",
				"predicted_at":          fmt.Sprintf("2026-%02d-15 10:00:00", month),
			}).Error

			if err != nil {
				log.Fatalf("插入风险预测数据失败: %v", err)
			}
		}
	}
	fmt.Println("✅ 插入 60 条风险预测数据")
	fmt.Println("")

	fmt.Println("=== 生成用户投诉数据 ===")
	complaints := []map[string]interface{}{
		{"complaint_content": "商品质量问题，与描述不符", "complaint_type": "商品质量", "target_company_id": 1, "target_logistics_id": 1, "complaint_date": "2026-01-05", "is_processed": true},
		{"complaint_content": "物流配送延迟", "complaint_type": "物流服务", "target_company_id": 2, "target_logistics_id": 2, "complaint_date": "2026-01-10", "is_processed": true},
		{"complaint_content": "售后服务态度差", "complaint_type": "售后服务", "target_company_id": 3, "target_logistics_id": 3, "complaint_date": "2026-01-15", "is_processed": false},
		{"complaint_content": "商品价格与实际不符", "complaint_type": "价格欺诈", "target_company_id": 3, "target_logistics_id": 4, "complaint_date": "2026-01-20", "is_processed": false},
		{"complaint_content": "商品缺货", "complaint_type": "履约问题", "target_company_id": 4, "target_logistics_id": 5, "complaint_date": "2026-02-05", "is_processed": true},
		{"complaint_content": "物流丢失包裹", "complaint_type": "物流服务", "target_company_id": 8, "target_logistics_id": 10, "complaint_date": "2026-02-10", "is_processed": false},
		{"complaint_content": "商品损坏", "complaint_type": "商品质量", "target_company_id": 10, "target_logistics_id": 10, "complaint_date": "2026-02-15", "is_processed": false},
		{"complaint_content": "退款处理不及时", "complaint_type": "售后服务", "target_company_id": 6, "target_logistics_id": 2, "complaint_date": "2026-02-20", "is_processed": true},
		{"complaint_content": "虚假宣传", "complaint_type": "价格欺诈", "target_company_id": 3, "target_logistics_id": 4, "complaint_date": "2026-03-05", "is_processed": false},
		{"complaint_content": "客服响应慢", "complaint_type": "售后服务", "target_company_id": 8, "target_logistics_id": 10, "complaint_date": "2026-03-10", "is_processed": true},
	}

	for _, complaint := range complaints {
		err := db.Table("user_complaint").Create(complaint).Error
		if err != nil {
			log.Fatalf("插入投诉失败: %v", err)
		}
	}
	fmt.Println("✅ 插入 10 条用户投诉数据")
	fmt.Println("")

	fmt.Println("=== 数据生成完成 ===")
	var orderCount, logisticsCount, riskCount, complaintCount int64
	db.Table("order_data").Count(&orderCount)
	db.Table("logistics_record").Count(&logisticsCount)
	db.Table("risk_prediction").Count(&riskCount)
	db.Table("user_complaint").Count(&complaintCount)

	fmt.Printf("订单数据: %d 条\n", orderCount)
	fmt.Printf("物流记录: %d 条\n", logisticsCount)
	fmt.Printf("风险预测: %d 条\n", riskCount)
	fmt.Printf("用户投诉: %d 条\n", complaintCount)
	fmt.Println("")
	fmt.Println("✅ 所有数据已重新生成！")
	fmt.Println("✅ 外键约束验证通过！")
}
