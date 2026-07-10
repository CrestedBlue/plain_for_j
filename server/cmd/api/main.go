// plan_for_j v2 백엔드 진입점.
package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/crestedblue/plan_for_j/server/internal/config"
	"github.com/crestedblue/plan_for_j/server/internal/db"
	httpapi "github.com/crestedblue/plan_for_j/server/internal/http"
	"github.com/crestedblue/plan_for_j/server/internal/places"
)

func main() {
	// .env가 있으면 로드(없어도 무시 — 운영은 실제 환경변수 사용).
	_ = godotenv.Load()

	cfg := config.Load()

	// DB 연결 실패해도 서버는 뜬다(/api/health 는 동작, /api/health/db 만 실패).
	pool, err := db.Open(cfg.DB.DSN())
	if err != nil {
		log.Printf("[warn] DB 연결 실패 (DB 없이 기동): %v", err)
	} else {
		defer pool.Close()
		log.Printf("[info] DB 연결 성공: %s", cfg.DB.Name)
	}

	srv := httpapi.NewServer(pool)

	// 네이버 지역검색 credentials가 있으면 places 라우트 활성.
	naver := places.NewNaverClient(cfg.Naver.ClientID, cfg.Naver.ClientSecret)
	if naver.Configured() {
		srv.SetPlaces(naver)
		log.Printf("[info] Naver 지역검색 활성화")
	} else {
		log.Printf("[warn] NAVER_SEARCH_CLIENT_ID/SECRET 미설정 → /api/places/search 비활성")
	}

	addr := ":" + cfg.AppPort
	log.Printf("[info] listening on %s", addr)
	if err := srv.Router().Run(addr); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
