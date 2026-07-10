// Package http는 gin 라우터와 핸들러를 구성한다.
package http

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/crestedblue/plan_for_j/server/internal/trip"
)

// Server는 핸들러가 의존하는 자원을 들고 있다.
type Server struct {
	db     *sql.DB
	trips  *trip.Service
	places PlacesSearcher
}

// NewServer는 의존성을 주입해 Server를 만든다. db는 nil일 수 있다(미연결 모드).
func NewServer(db *sql.DB) *Server {
	s := &Server{db: db}
	if db != nil {
		s.trips = trip.NewService(db)
	}
	return s
}

// SetPlaces는 장소검색 어댑터를 주입한다. nil 이면 /api/places/search 라우트는 비활성.
func (s *Server) SetPlaces(p PlacesSearcher) { s.places = p }

// Router는 /api 라우트를 등록한 gin 엔진을 반환한다.
func (s *Server) Router() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/health", s.handleHealth)
		api.GET("/health/db", s.handleHealthDB)
		if s.trips != nil {
			s.registerTripRoutes(api)
		}
		if s.places != nil {
			s.registerPlacesRoutes(api)
		}
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
