package http

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/crestedblue/plan_for_j/server/internal/places"
)

// PlacesSearcher는 places 어댑터가 만족해야 하는 최소 인터페이스.
// 테스트에서 fake 로 교체하기 위해 인터페이스로 노출한다.
type PlacesSearcher interface {
	Search(ctx context.Context, q string) ([]places.Place, error)
}

func (s *Server) registerPlacesRoutes(api *gin.RouterGroup) {
	api.GET("/places/search", s.searchPlaces)
}

func (s *Server) searchPlaces(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		fail(c, http.StatusBadRequest, "query 'q' is required")
		return
	}
	results, err := s.places.Search(c.Request.Context(), q)
	if err != nil {
		// 외부 API 오류는 502로 매핑. 상세 사유는 서버 로그에만.
		log.Printf("[warn] places search failed: %v", err)
		fail(c, http.StatusBadGateway, "external search failed")
		return
	}
	ok(c, results)
}
