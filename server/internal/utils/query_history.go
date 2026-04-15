package utils

import (
	"server/internal/db"
	"server/internal/model"
	"time"
)

// SaveUserQuery 保存用户查询记录
func SaveUserQuery(userID int, queryType, queryText, queryParams, result string) error {
	query := model.UserQuery{
		UserID:     int64(userID),
		QueryType:  queryType,
		QueryText:  queryText,
		QueryParams: queryParams,
		Result:     result,
		CreatedAt:  time.Now(),
	}
	return db.GetDB().Create(&query).Error
}

// GetUserQueries 获取用户近期查询记录
func GetUserQueries(userID int, limit int) ([]model.UserQuery, error) {
	var queries []model.UserQuery
	err := db.GetDB().Where("user_id = ?", int64(userID)).
		Order("created_at DESC").
		Limit(limit).
		Find(&queries).Error
	return queries, err
}

// GetUserQueriesByType 按类型获取用户查询记录
func GetUserQueriesByType(userID int, queryType string, limit int) ([]model.UserQuery, error) {
	var queries []model.UserQuery
	err := db.GetDB().Where("user_id = ? AND query_type = ?", int64(userID), queryType).
		Order("created_at DESC").
		Limit(limit).
		Find(&queries).Error
	return queries, err
}

// DeleteUserQuery 删除用户查询记录
func DeleteUserQuery(id int, userID int) error {
	return db.GetDB().Where("id = ? AND user_id = ?", id, int64(userID)).Delete(&model.UserQuery{}).Error
}

// GetUserQueriesLastWeek 获取用户最近一周的查询记录
func GetUserQueriesLastWeek(userID int) ([]model.UserQuery, error) {
	var queries []model.UserQuery
	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	err := db.GetDB().Where("user_id = ? AND created_at >= ?", int64(userID), oneWeekAgo).
		Order("created_at DESC").
		Find(&queries).Error
	return queries, err
}

// GetUserQueriesLastWeekByType 按类型获取用户最近一周的查询记录
func GetUserQueriesLastWeekByType(userID int, queryType string) ([]model.UserQuery, error) {
	var queries []model.UserQuery
	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	err := db.GetDB().Where("user_id = ? AND query_type = ? AND created_at >= ?", int64(userID), queryType, oneWeekAgo).
		Order("created_at DESC").
		Find(&queries).Error
	return queries, err
}
