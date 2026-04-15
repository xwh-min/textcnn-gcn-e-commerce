package middleware

import (
	"encoding/json"
	"net/http"
	"server/internal/db"
	"server/internal/model"
	"strings"

	"github.com/gin-gonic/gin"
)

func hasAdminRole(roleName string) bool {
	r := strings.ToLower(strings.TrimSpace(roleName))
	return r == "admin" || r == "superadmin" || r == "管理员" || r == "超级管理员"
}

func hasAdminPermission(role model.SysRole) bool {
	if strings.TrimSpace(role.Permissions) == "" {
		return false
	}
	var perms []string
	if err := json.Unmarshal([]byte(role.Permissions), &perms); err != nil {
		return false
	}
	for _, p := range perms {
		pp := strings.ToLower(strings.TrimSpace(p))
		if pp == "admin" || pp == "*" || strings.Contains(pp, "user_manage") || strings.Contains(pp, "role_manage") {
			return true
		}
	}
	return false
}

// AdminOnly 管理员权限中间件
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		if userID == 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
			c.Abort()
			return
		}

		var user model.SysUser
		if err := db.GetDB().Preload("Role").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权限访问"})
			c.Abort()
			return
		}

		if hasAdminRole(user.Role.RoleName) || hasAdminPermission(user.Role) {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, gin.H{"code": 403, "message": "无权限访问"})
		c.Abort()
	}
}
