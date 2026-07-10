// Package places는 외부 장소검색(네이버 지역검색) 어댑터와 응답 정규화를 담는다.
//
// 백엔드가 제공하는 정규화 스키마는 {name, address, lat, lng, category, categoryRaw}.
// SVG 지도용 x/y 좌표계 변환은 프론트가 담당한다(백엔드는 순수 lat/lng만 반환).
package places

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Place는 정규화된 장소 검색 결과 한 건.
type Place struct {
	Name        string  `json:"name"`
	Address     string  `json:"address"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
	Category    string  `json:"category"`    // sightseeing|restaurant|cafe|accommodation|shopping
	CategoryRaw string  `json:"categoryRaw"` // 네이버 원본 카테고리(디버깅/툴팁용)
}

// NaverClient는 네이버 지역검색 API 어댑터.
type NaverClient struct {
	clientID     string
	clientSecret string
	http         *http.Client
	endpoint     string
}

// NewNaverClient는 credentials 와 기본 http.Client(타임아웃 5s)로 어댑터를 만든다.
func NewNaverClient(id, secret string) *NaverClient {
	return &NaverClient{
		clientID:     id,
		clientSecret: secret,
		http:         &http.Client{Timeout: 5 * time.Second},
		endpoint:     "https://openapi.naver.com/v1/search/local.json",
	}
}

// Configured는 credentials가 채워져 있는지 검사한다.
func (n *NaverClient) Configured() bool {
	return n.clientID != "" && n.clientSecret != ""
}

// Search는 q에 대한 지역검색 결과(상위 5건)를 정규화해 반환한다.
// 네이버 지역검색은 1회 최대 5건 제한이 있어 display를 5로 고정한다.
func (n *NaverClient) Search(ctx context.Context, q string) ([]Place, error) {
	q = strings.TrimSpace(q)
	if q == "" {
		return nil, fmt.Errorf("query is empty")
	}
	u := n.endpoint + "?" + url.Values{
		"query":   {q},
		"display": {"5"},
	}.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Naver-Client-Id", n.clientID)
	req.Header.Set("X-Naver-Client-Secret", n.clientSecret)

	res, err := n.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("naver request failed: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("naver status %d: %s", res.StatusCode, string(body))
	}
	return parseNaverResponse(res.Body)
}

// parseNaverResponse는 네이버 지역검색 응답을 정규화 리스트로 변환한다.
//   - title/address의 <b>...</b> 강조태그 제거
//   - mapx/mapy는 현행 스펙 기준 "경도/위도 × 10^7 정수 문자열" → float 변환
//   - category 문자열은 우리 enum 5종으로 규칙 매핑
func parseNaverResponse(r io.Reader) ([]Place, error) {
	var body struct {
		Items []struct {
			Title       string `json:"title"`
			Address     string `json:"address"`
			RoadAddress string `json:"roadAddress"`
			Category    string `json:"category"`
			Mapx        string `json:"mapx"`
			Mapy        string `json:"mapy"`
		} `json:"items"`
	}
	if err := json.NewDecoder(r).Decode(&body); err != nil {
		return nil, fmt.Errorf("decode naver response: %w", err)
	}
	out := make([]Place, 0, len(body.Items))
	for _, it := range body.Items {
		addr := it.RoadAddress
		if addr == "" {
			addr = it.Address
		}
		lng, lat := parseNaverCoord(it.Mapx, it.Mapy)
		out = append(out, Place{
			Name:        stripHTMLTags(it.Title),
			Address:     stripHTMLTags(addr),
			Lat:         lat,
			Lng:         lng,
			Category:    mapCategory(it.Category),
			CategoryRaw: it.Category,
		})
	}
	return out, nil
}

// parseNaverCoord는 mapx/mapy(경도/위도 × 10^7 정수 문자열)를 (lng, lat) float로 변환한다.
// 파싱 실패 또는 한국 위경도 범위 밖(lng 100~140, lat 30~45) 이면 (0, 0) 반환 —
// 프론트가 "좌표 없음"으로 처리해 SVG 지도에 폴백 배치.
func parseNaverCoord(mapx, mapy string) (lng, lat float64) {
	xi, xerr := strconv.ParseFloat(mapx, 64)
	yi, yerr := strconv.ParseFloat(mapy, 64)
	if xerr != nil || yerr != nil {
		return 0, 0
	}
	lng = xi / 1e7
	lat = yi / 1e7
	if lng < 100 || lng > 140 || lat < 30 || lat > 45 {
		return 0, 0
	}
	return lng, lat
}

// stripHTMLTags는 네이버가 강조 삽입한 <b>...</b> 등 태그를 제거한다.
func stripHTMLTags(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	inTag := false
	for _, r := range s {
		switch {
		case r == '<':
			inTag = true
		case r == '>':
			inTag = false
		case !inTag:
			b.WriteRune(r)
		}
	}
	return b.String()
}

// mapCategory는 네이버 원본 카테고리 문자열을 우리 enum으로 매핑한다.
// 우선순위: 숙박 → 카페 → 음식 → 쇼핑 → 기본(sightseeing).
func mapCategory(raw string) string {
	switch {
	case containsAny(raw, "숙박", "호텔", "모텔", "펜션", "게스트하우스", "리조트"):
		return "accommodation"
	case containsAny(raw, "카페", "디저트", "베이커리", "제과", "빙수"):
		return "cafe"
	case containsAny(raw,
		"음식", "식당", "레스토랑", "주점", "포차", "치킨", "피자", "분식", "회",
		// 네이버가 요리 종류를 최상위로 주는 경우도 커버 (예: "양식>샌드위치").
		"한식", "양식", "일식", "중식", "아시안", "뷔페", "패스트푸드"):
		return "restaurant"
	case containsAny(raw, "쇼핑", "백화점", "마트", "시장", "편의점", "아울렛", "면세점"):
		return "shopping"
	default:
		return "sightseeing"
	}
}

func containsAny(s string, subs ...string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}
