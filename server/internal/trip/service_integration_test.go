package trip

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/crestedblue/plan_for_j/server/internal/config"
	dbpkg "github.com/crestedblue/plan_for_j/server/internal/db"
)

// 실 DB 왕복 통합 테스트. DB 미연결이면 skip (CI/로컬 모두 안전).
// 로컬: docker compose 로 MySQL 띄운 뒤 `DB_PORT=3307 go test ./...`.
func TestTripRoundTrip(t *testing.T) {
	cfg := config.Load()
	pool, err := dbpkg.Open(cfg.DB.DSN())
	if err != nil {
		t.Skipf("DB 미연결 — 통합 테스트 skip: %v", err)
	}
	defer pool.Close()

	svc := NewService(pool)
	ctx := context.Background()

	// 1) 생성: 3일짜리 여행 → days 3개
	created, err := svc.CreateTrip(ctx, CreateTripInput{
		Title:     "통합테스트-" + uuid.NewString(),
		StartDate: "2026-07-01",
		EndDate:   "2026-07-03",
	})
	if err != nil {
		t.Fatalf("CreateTrip: %v", err)
	}
	t.Cleanup(func() { _ = svc.DeleteTrip(ctx, created.ID) })

	if len(created.Days) != 3 {
		t.Fatalf("days = %d, want 3", len(created.Days))
	}
	if created.Days[0].Date != "2026-07-01" || created.Days[2].Date != "2026-07-03" {
		t.Fatalf("dates = %v", []string{created.Days[0].Date, created.Days[2].Date})
	}

	// 2) 일정 추가(위경도 포함)
	added, err := svc.AddItem(ctx, created.ID, "2026-07-01", ItemInput{
		Time:         "09:00",
		LocationName: "경복궁",
		Category:     "sightseeing",
		Notes:        "수문장 교대식",
		Location:     &GeoLocation{Name: "경복궁", Lat: 37.5796, Lng: 126.977},
	})
	if err != nil {
		t.Fatalf("AddItem: %v", err)
	}

	got, err := svc.GetTrip(ctx, created.ID)
	if err != nil {
		t.Fatalf("GetTrip: %v", err)
	}
	if len(got.Days[0].Items) != 1 {
		t.Fatalf("day0 items = %d, want 1", len(got.Days[0].Items))
	}
	if loc := got.Days[0].Items[0].Location; loc == nil || loc.Lat == 0 {
		t.Fatalf("location not persisted: %+v", got.Days[0].Items[0])
	}

	// 3) 수정: 위경도 제거 + 시간 변경
	if _, err := svc.UpdateItem(ctx, created.ID, "2026-07-01", added.ID, ItemInput{
		Time: "10:00", LocationName: "덕수궁", Category: "sightseeing",
	}); err != nil {
		t.Fatalf("UpdateItem: %v", err)
	}
	got, _ = svc.GetTrip(ctx, created.ID)
	it := got.Days[0].Items[0]
	if it.Time != "10:00" || it.LocationName != "덕수궁" || it.Location != nil {
		t.Fatalf("update not applied: %+v", it)
	}

	// 4) 일정 삭제
	if err := svc.DeleteItem(ctx, added.ID); err != nil {
		t.Fatalf("DeleteItem: %v", err)
	}
	got, _ = svc.GetTrip(ctx, created.ID)
	if len(got.Days[0].Items) != 0 {
		t.Fatalf("after delete items = %d, want 0", len(got.Days[0].Items))
	}

	// 5) 제목 변경
	if _, err := svc.RenameTrip(ctx, created.ID, "이름변경됨"); err != nil {
		t.Fatalf("RenameTrip: %v", err)
	}
	got, _ = svc.GetTrip(ctx, created.ID)
	if got.Title != "이름변경됨" {
		t.Fatalf("title = %q", got.Title)
	}

	// 6) 여행 삭제 → 조회 시 ErrNotFound
	if err := svc.DeleteTrip(ctx, created.ID); err != nil {
		t.Fatalf("DeleteTrip: %v", err)
	}
	if _, err := svc.GetTrip(ctx, created.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetTrip after delete err = %v, want ErrNotFound", err)
	}
}

func TestCreateTripValidation(t *testing.T) {
	svc := &Service{} // DB 불필요: 입력 검증은 buildDates에서 선처리
	ctx := context.Background()
	if _, err := svc.CreateTrip(ctx, CreateTripInput{Title: "x", StartDate: "2026-07-03", EndDate: "2026-07-01"}); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("reversed dates err = %v, want ErrInvalidInput", err)
	}
	if _, err := svc.CreateTrip(ctx, CreateTripInput{Title: "x", StartDate: "bad", EndDate: "2026-07-01"}); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("bad date err = %v, want ErrInvalidInput", err)
	}
}
