// Package http는 gin 라우터와 핸들러를 구성한다.
package http

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Server는 핸들러가 의존하는 자원을 들고 있다.
type Server struct {
	db *sql.DB
}

// NewServer는 의존성을 주입해 Server를 만든다. db는 nil일 수 있다(미연결 모드).
func NewServer(db *sql.DB) *Server {
	return &Server{db: db}
}

// Router는 /api 라우트를 등록한 gin 엔진을 반환한다.
func (s *Server) Router() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/health", s.handleHealth)
		api.GET("/health/db", s.handleHealthDB)
	}
	return r
}

// handleHealth는 프로세스 생존만 확인한다.
func (s *Server) handleHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"status": "ok"}})
}

// handleHealthDB는 DB 연결까지 확인한다.
func (s *Server) handleHealthDB(c *gin.Context) {
	if s.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false, "error": "database not connected",
		})
		return
	}
	if err := s.db.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false, "error": "database ping failed",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"db": "ok"}})
}
