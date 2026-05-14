package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type OrderData struct {
	ID         int64  `gorm:"column:id"`
	OrderNo    string `gorm:"column:order_no"`
	CompanyID  int64  `gorm:"column:company_id"`
	ProductName string `gorm:"column:product_name"`
}

func (OrderData) TableName() string {
	return "order_data"
}

type LogisticsRecord struct {
	ID      int64 `gorm:"column:id"`
	OrderID int64 `gorm:"column:order_id"`
}

func (LogisticsRecord) TableName() string {
	return "logistics_record"
}

func main() {
	dsn := "host=localhost port=5432 user=postgres password=xwh20040916 dbname=service sslmode=disable"
	
	fmt.Println("=== 数据库调试工具 ===")
	fmt.Println("连接字符串:", dsn)
	fmt.Println("")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ 数据库连接失败: %v", err)
	}
	fmt.Println("✅ 数据库连接成功")
	fmt.Println("")

	fmt.Println("=== 数据统计 ===")
	var orderCount, logisticsCount int64
	db.Table("order_data").Count(&orderCount)
	db.Table("logistics_record").Count(&logisticsCount)
	
	fmt.Printf("order_data 表记录数: %d\n", orderCount)
	fmt.Printf("logistics_record 表记录数: %d\n", logisticsCount)
	fmt.Println("")

	fmt.Println("=== 订单数据前5条 ===")
	var orders []OrderData
	err = db.Limit(5).Find(&orders).Error
	if err != nil {
		log.Fatalf("❌ 查询订单失败: %v", err)
	}
	
	for _, order := range orders {
		fmt.Printf("ID: %d, OrderNo: %s, CompanyID: %d, Product: %s\n", 
			order.ID, order.OrderNo, order.CompanyID, order.ProductName)
	}
	fmt.Println("")

	fmt.Println("=== 物流记录前5条 ===")
	var logistics []LogisticsRecord
	err = db.Limit(5).Find(&logistics).Error
	if err != nil {
		log.Fatalf("❌ 查询物流记录失败: %v", err)
	}
	
	for _, lr := range logistics {
		fmt.Printf("ID: %d, OrderID: %d\n", lr.ID, lr.OrderID)
	}
	fmt.Println("")

	fmt.Println("=== 外键约束验证 ===")
	var problematicRecords []LogisticsRecord
	err = db.Raw(`
		SELECT lr.id, lr.order_id 
		FROM logistics_record lr 
		LEFT JOIN order_data od ON lr.order_id = od.id 
		WHERE od.id IS NULL
	`).Scan(&problematicRecords).Error

	if err != nil {
		log.Fatalf("❌ 验证外键约束失败: %v", err)
	}

	if len(problematicRecords) == 0 {
		fmt.Println("✅ 外键约束验证通过：所有物流记录都有对应的订单")
	} else {
		fmt.Printf("❌ 发现 %d 条无效物流记录:\n", len(problematicRecords))
		for _, record := range problematicRecords {
			fmt.Printf("  - 物流记录ID: %d, 引用订单ID: %d (不存在)\n", record.ID, record.OrderID)
		}
	}
	fmt.Println("")

	fmt.Println("=== 检查订单ID是否连续 ===")
	var maxOrderID int64
	err = db.Table("order_data").Select("MAX(id)").Scan(&maxOrderID).Error
	if err != nil {
		log.Fatalf("❌ 查询最大订单ID失败: %v", err)
	}
	
	fmt.Printf("最大订单ID: %d\n", maxOrderID)
	if maxOrderID != orderCount {
		fmt.Printf("⚠️ 注意: 订单ID不连续，最大ID(%d) != 记录数(%d)\n", maxOrderID, orderCount)
	}
}
