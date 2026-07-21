// Package trip은 여행묶음/일정의 도메인 서비스와 API DTO를 제공한다.
package trip

// API DTO — 프론트(src/types.ts)와 동일한 camelCase JSON 형태.

// GeoLocation은 실제 위경도(네이버 검색 시 적재).
type GeoLocation struct {
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}

// ScheduleItem은 하루 안의 일정 한 건.
// Time/EndTime은 선택(비면 느슨한 일정, 순서만 보존). SortOrder가 하루 안의 표시 순서.
type ScheduleItem struct {
	ID           string       `json:"id"`
	Time         *string      `json:"time,omitempty"`
	EndTime      *string      `json:"endTime,omitempty"`
	SortOrder    int          `json:"sortOrder"`
	LocationName string       `json:"locationName"`
	DisplayName  string       `json:"displayName"`
	Category     string       `json:"category"`
	Notes        string       `json:"notes"`
	Location     *GeoLocation `json:"location,omitempty"`
}

// Day는 여행 안의 하루.
type Day struct {
	Date  string         `json:"date"`
	Items []ScheduleItem `json:"items"`
}

// Trip은 여행묶음(일정 전체 포함).
type Trip struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
	Days      []Day  `json:"days"`
}

// TripSummary는 목록용(일정 미포함).
type TripSummary struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}

// --- 입력 DTO (gin 바인딩/검증) ---

// CreateTripInput은 새 여행묶음 생성 입력.
type CreateTripInput struct {
	Title     string `json:"title" binding:"required"`
	StartDate string `json:"startDate" binding:"required"`
	EndDate   string `json:"endDate" binding:"required"`
}

// RenameTripInput은 제목 변경 입력.
type RenameTripInput struct {
	Title string `json:"title" binding:"required"`
}

// ItemInput은 일정 추가/수정 입력. Time/EndTime은 선택(비면 느슨한 일정).
type ItemInput struct {
	Time         *string      `json:"time"`
	EndTime      *string      `json:"endTime"`
	LocationName string       `json:"locationName" binding:"required"`
	DisplayName  string       `json:"displayName"`
	Category     string       `json:"category" binding:"required,oneof=sightseeing restaurant cafe accommodation shopping"`
	Notes        string       `json:"notes"`
	Location     *GeoLocation `json:"location"`
}

// ReorderInput은 하루 안의 일정 순서 변경 입력(새 순서대로의 id 배열).
type ReorderInput struct {
	OrderedIDs []string `json:"orderedIds" binding:"required"`
}
