package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type OrderData struct {
	ID int64 `gorm:"column:id;primaryKey"`
}

func (OrderData) TableName() string {
	return "order_data"
}

type LogisticsRecord struct {
	ID      int64 `gorm:"column:id;primaryKey"`
	OrderID int64 `gorm:"column:order_id"`
}

func (LogisticsRecord) TableName() string {
	return "logistics_record"
}

func main() {
	dsn := "host=localhost port=5432 user=postgres password=xwh20040916 dbname=service sslmode=disable"
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("=== 外键约束修复工具 ===")
	fmt.Println("")

	var problematicRecords []LogisticsRecord
	err = db.Raw(`
		SELECT lr.id, lr.order_id 
		FROM logistics_record lr 
		LEFT JOIN order_data od ON lr.order_id = od.id 
		WHERE od.id IS NULL
	`).Scan(&problematicRecords).Error

	if err != nil {
		log.Fatalf("Failed to query problematic records: %v", err)
	}

	fmt.Printf("发现 %d 条无效的物流记录（引用不存在的订单）\n", len(problematicRecords))
	if len(problematicRecords) > 0 {
		fmt.Println("无效记录列表：")
		for _, record := range problematicRecords {
			fmt.Printf("  - 物流记录ID: %d, 引用订单ID: %d\n", record.ID, record.OrderID)
		}
		fmt.Println("")

		fmt.Println("正在删除无效记录...")
		err = db.Exec(`
			DELETE FROM logistics_record lr 
			WHERE NOT EXISTS (
				SELECT 1 FROM order_data od WHERE od.id = lr.order_id
			)
		`).Error

		if err != nil {
			log.Fatalf("Failed to delete problematic records: %v", err)
		}

		fmt.Println("删除完成！")
	}

	var remainingProblematic int64
	err = db.Raw(`
		SELECT COUNT(*) 
		FROM logistics_record lr 
		LEFT JOIN order_data od ON lr.order_id = od.id 
		WHERE od.id IS NULL
	`).Scan(&remainingProblematic).Error

	if err != nil {
		log.Fatalf("Failed to verify fix: %v", err)
	}

	fmt.Println("")
	fmt.Println("=== 修复结果 ===")
	fmt.Printf("剩余无效记录数: %d\n", remainingProblematic)

	if remainingProblematic == 0 {
		fmt.Println("✓ 外键约束问题已修复！")
	} else {
		fmt.Println("✗ 修复未完成，请检查数据")
	}
}
