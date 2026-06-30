package trip

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/crestedblue/plan_for_j/server/internal/db/dbgen"
)

// ErrNotFound는 대상 리소스가 없을 때 반환된다(핸들러에서 404로 매핑).
var ErrNotFound = errors.New("not found")

// ErrInvalidInput은 잘못된 입력일 때 반환된다(핸들러에서 400으로 매핑).
var ErrInvalidInput = errors.New("invalid input")

const dateLayout = "2006-01-02"

// maxTripDays는 한 여행묶음의 최대 일수(폭주 방지).
const maxTripDays = 60

// Service는 여행묶음/일정 도메인 로직을 담당한다(Repository 패턴).
type Service struct {
	db *sql.DB
	q  *dbgen.Queries
}

// NewService는 DB 풀로 서비스를 만든다.
func NewService(db *sql.DB) *Service {
	return &Service{db: db, q: dbgen.New(db)}
}

// ListTrips는 여행묶음 목록(일정 미포함)을 반환한다.
func (s *Service) ListTrips(ctx context.Context) ([]TripSummary, error) {
	rows, err := s.q.ListTrips(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]TripSummary, 0, len(rows))
	for _, r := range rows {
		out = append(out, TripSummary{
			ID:        r.ID,
			Title:     r.Title,
			StartDate: r.StartDate.Format(dateLayout),
			EndDate:   r.EndDate.Format(dateLayout),
		})
	}
	return out, nil
}

// CreateTrip은 여행묶음과 기간만큼의 날짜(days)를 한 트랜잭션으로 생성한다.
func (s *Service) CreateTrip(ctx context.Context, in CreateTripInput) (*Trip, error) {
	dates, err := buildDates(in.StartDate, in.EndDate)
	if err != nil {
		return nil, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback() //nolint:errcheck // 커밋 성공 시 no-op

	qtx := s.q.WithTx(tx)
	tripID := uuid.NewString()
	if err := qtx.CreateTrip(ctx, dbgen.CreateTripParams{
		ID:          tripID,
		OwnerUserID: sql.NullString{}, // 식별(P2) 도입 후 채움
		Title:       in.Title,
		StartDate:   dates[0],
		EndDate:     dates[len(dates)-1],
	}); err != nil {
		return nil, err
	}
	for _, d := range dates {
		if err := qtx.CreateDay(ctx, dbgen.CreateDayParams{
			ID:     uuid.NewString(),
			TripID: tripID,
			Date:   d,
		}); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetTrip(ctx, tripID)
}

// GetTrip은 여행묶음 전체(날짜+일정)를 조립해 반환한다.
func (s *Service) GetTrip(ctx context.Context, id string) (*Trip, error) {
	t, err := s.q.GetTrip(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	dayRows, err := s.q.ListDaysByTrip(ctx, id)
	if err != nil {
		return nil, err
	}
	itemRows, err := s.q.ListItemsByTrip(ctx, id)
	if err != nil {
		return nil, err
	}

	itemsByDate := make(map[string][]ScheduleItem)
	for _, r := range itemRows {
		key := r.Date.Format(dateLayout)
		itemsByDate[key] = append(itemsByDate[key], toItemDTO(
			r.ID, r.Time, r.LocationName, r.DisplayName, r.Category,
			r.Notes, r.X, r.Y, r.GeoName, r.Lat, r.Lng,
		))
	}

	days := make([]Day, 0, len(dayRows))
	for _, d := range dayRows {
		key := d.Date.Format(dateLayout)
		items := itemsByDate[key]
		if items == nil {
			items = []ScheduleItem{}
		}
		days = append(days, Day{Date: key, Items: items})
	}

	return &Trip{
		ID:        t.ID,
		Title:     t.Title,
		StartDate: t.StartDate.Format(dateLayout),
		EndDate:   t.EndDate.Format(dateLayout),
		Days:      days,
	}, nil
}

// RenameTrip은 제목을 변경한다.
func (s *Service) RenameTrip(ctx context.Context, id, title string) (*Trip, error) {
	if _, err := s.q.GetTrip(ctx, id); errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	if err := s.q.UpdateTripTitle(ctx, dbgen.UpdateTripTitleParams{Title: title, ID: id}); err != nil {
		return nil, err
	}
	return s.GetTrip(ctx, id)
}

// DeleteTrip은 여행묶음을 삭제한다(days/items는 FK CASCADE).
func (s *Service) DeleteTrip(ctx context.Context, id string) error {
	if _, err := s.q.GetTrip(ctx, id); errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.q.DeleteTrip(ctx, id)
}

// AddItem은 특정 여행묶음의 특정 날짜에 일정을 추가한다.
func (s *Service) AddItem(ctx context.Context, tripID, date string, in ItemInput) (*ScheduleItem, error) {
	dayID, err := s.resolveDayID(ctx, tripID, date)
	if err != nil {
		return nil, err
	}
	id := uuid.NewString()
	geoName, lat, lng := fromGeo(in.Location)
	if err := s.q.CreateItem(ctx, dbgen.CreateItemParams{
		ID:           id,
		DayID:        dayID,
		Time:         in.Time,
		LocationName: in.LocationName,
		DisplayName:  in.DisplayName,
		Category:     dbgen.ScheduleItemsCategory(in.Category),
		Notes:        in.Notes,
		X:            in.X,
		Y:            in.Y,
		GeoName:      geoName,
		Lat:          lat,
		Lng:          lng,
	}); err != nil {
		return nil, err
	}
	return s.getItemDTO(ctx, id)
}

// UpdateItem은 일정을 수정한다.
func (s *Service) UpdateItem(ctx context.Context, tripID, date, itemID string, in ItemInput) (*ScheduleItem, error) {
	if _, err := s.resolveDayID(ctx, tripID, date); err != nil {
		return nil, err
	}
	if _, err := s.q.GetItem(ctx, itemID); errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	geoName, lat, lng := fromGeo(in.Location)
	if err := s.q.UpdateItem(ctx, dbgen.UpdateItemParams{
		Time:         in.Time,
		LocationName: in.LocationName,
		DisplayName:  in.DisplayName,
		Category:     dbgen.ScheduleItemsCategory(in.Category),
		Notes:        in.Notes,
		X:            in.X,
		Y:            in.Y,
		GeoName:      geoName,
		Lat:          lat,
		Lng:          lng,
		ID:           itemID,
	}); err != nil {
		return nil, err
	}
	return s.getItemDTO(ctx, itemID)
}

// DeleteItem은 일정을 삭제한다.
func (s *Service) DeleteItem(ctx context.Context, itemID string) error {
	if _, err := s.q.GetItem(ctx, itemID); errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.q.DeleteItem(ctx, itemID)
}

// --- 내부 헬퍼 ---

func (s *Service) resolveDayID(ctx context.Context, tripID, date string) (string, error) {
	d, err := time.Parse(dateLayout, date)
	if err != nil {
		return "", fmt.Errorf("invalid date %q: %w", date, ErrInvalidInput)
	}
	dayID, err := s.q.GetDayByTripAndDate(ctx, dbgen.GetDayByTripAndDateParams{TripID: tripID, Date: d})
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return dayID, nil
}

func (s *Service) getItemDTO(ctx context.Context, id string) (*ScheduleItem, error) {
	r, err := s.q.GetItem(ctx, id)
	if err != nil {
		return nil, err
	}
	item := toItemDTO(r.ID, r.Time, r.LocationName, r.DisplayName, r.Category, r.Notes, r.X, r.Y, r.GeoName, r.Lat, r.Lng)
	return &item, nil
}

func toItemDTO(
	id, t, locName, dispName string,
	cat dbgen.ScheduleItemsCategory,
	notes string, x, y int32,
	geoName sql.NullString, lat, lng sql.NullFloat64,
) ScheduleItem {
	item := ScheduleItem{
		ID:           id,
		Time:         t,
		LocationName: locName,
		DisplayName:  dispName,
		Category:     string(cat),
		Notes:        notes,
		X:            x,
		Y:            y,
	}
	if lat.Valid && lng.Valid {
		name := locName
		if geoName.Valid && geoName.String != "" {
			name = geoName.String
		}
		item.Location = &GeoLocation{Name: name, Lat: lat.Float64, Lng: lng.Float64}
	}
	return item
}

func fromGeo(g *GeoLocation) (sql.NullString, sql.NullFloat64, sql.NullFloat64) {
	if g == nil {
		return sql.NullString{}, sql.NullFloat64{}, sql.NullFloat64{}
	}
	return sql.NullString{String: g.Name, Valid: g.Name != ""},
		sql.NullFloat64{Float64: g.Lat, Valid: true},
		sql.NullFloat64{Float64: g.Lng, Valid: true}
}

// buildDates는 시작~종료(포함) 날짜 목록을 만든다.
func buildDates(start, end string) ([]time.Time, error) {
	s, err := time.Parse(dateLayout, start)
	if err != nil {
		return nil, fmt.Errorf("invalid startDate %q: %w", start, ErrInvalidInput)
	}
	e, err := time.Parse(dateLayout, end)
	if err != nil {
		return nil, fmt.Errorf("invalid endDate %q: %w", end, ErrInvalidInput)
	}
	if e.Before(s) {
		return nil, fmt.Errorf("endDate must be on or after startDate: %w", ErrInvalidInput)
	}
	var out []time.Time
	for d := s; !d.After(e); d = d.AddDate(0, 0, 1) {
		out = append(out, d)
		if len(out) > maxTripDays {
			return nil, fmt.Errorf("trip range exceeds %d days: %w", maxTripDays, ErrInvalidInput)
		}
	}
	return out, nil
}
