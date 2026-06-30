package http

import "github.com/gin-gonic/gin"

// 응답 봉투 {success, data, error} 통일 헬퍼.

func ok(c *gin.Context, data any) {
	c.JSON(200, gin.H{"success": true, "data": data})
}

func created(c *gin.Context, data any) {
	c.JSON(201, gin.H{"success": true, "data": data})
}

func fail(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"success": false, "error": msg})
}
