package places

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const sampleNaverResponse = `{
  "items": [
    {
      "title": "<b>여의도 한강공원</b>",
      "address": "서울특별시 영등포구 여의도동",
      "roadAddress": "서울특별시 영등포구 여의동로 330",
      "category": "여행>공원",
      "mapx": "1269295950",
      "mapy": "375285000"
    },
    {
      "title": "스타<b>벅스</b> 여의도점",
      "address": "서울특별시 영등포구",
      "roadAddress": "",
      "category": "카페,디저트>커피전문점",
      "mapx": "1269320000",
      "mapy": "375280000"
    },
    {
      "title": "명동교자",
      "address": "서울특별시 중구 명동",
      "roadAddress": "서울특별시 중구 명동10길 29",
      "category": "음식점>한식",
      "mapx": "1269835000",
      "mapy": "375635000"
    }
  ]
}`

func TestParseNaverResponse_StripsTagsAndPrefersRoadAddress(t *testing.T) {
	places, err := parseNaverResponse(strings.NewReader(sampleNaverResponse))
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(places) != 3 {
		t.Fatalf("len = %d, want 3", len(places))
	}

	if places[0].Name != "여의도 한강공원" {
		t.Errorf("name[0] = %q (b tag not stripped)", places[0].Name)
	}
	if places[0].Address != "서울특별시 영등포구 여의동로 330" {
		t.Errorf("address[0] = %q (roadAddress preferred)", places[0].Address)
	}
	// 좌표: 126.929595, 37.5285 근처
	if places[0].Lng < 126.9 || places[0].Lng > 127.0 {
		t.Errorf("lng[0] = %v", places[0].Lng)
	}
	if places[0].Lat < 37.5 || places[0].Lat > 37.6 {
		t.Errorf("lat[0] = %v", places[0].Lat)
	}
	if places[0].Category != "sightseeing" {
		t.Errorf("cat[0] = %q, want sightseeing", places[0].Category)
	}

	if places[1].Name != "스타벅스 여의도점" {
		t.Errorf("name[1] = %q", places[1].Name)
	}
	if places[1].Address != "서울특별시 영등포구" {
		t.Errorf("address[1] fallback = %q (should fall back to address when roadAddress empty)", places[1].Address)
	}
	if places[1].Category != "cafe" {
		t.Errorf("cat[1] = %q, want cafe", places[1].Category)
	}

	if places[2].Category != "restaurant" {
		t.Errorf("cat[2] = %q, want restaurant", places[2].Category)
	}
	if places[2].CategoryRaw != "음식점>한식" {
		t.Errorf("cat raw[2] = %q", places[2].CategoryRaw)
	}
}

func TestParseNaverCoord_OutOfRangeReturnsZero(t *testing.T) {
	cases := []struct {
		name       string
		mapx, mapy string
	}{
		{"zeros", "0", "0"},
		{"parse fail", "abc", "def"},
		{"outside Korea (NYC)", "-740000000", "407000000"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			lng, lat := parseNaverCoord(tc.mapx, tc.mapy)
			if lng != 0 || lat != 0 {
				t.Errorf("expected 0/0, got %v/%v", lng, lat)
			}
		})
	}
}

func TestMapCategory(t *testing.T) {
	cases := map[string]string{
		"숙박>호텔":         "accommodation",
		"숙박>모텔":         "accommodation",
		"카페,디저트>커피전문점":  "cafe",
		"카페,디저트>베이커리":   "cafe",
		"음식점>한식":        "restaurant",
		"음식점>일식,초밥":     "restaurant",
		"양식>샌드위치":       "restaurant",
		"한식>찌개,전골":      "restaurant",
		"중식>중국요리":       "restaurant",
		"음식점>뷔페":        "restaurant",
		"쇼핑,유통>백화점":     "shopping",
		"쇼핑,유통>대형마트":    "shopping",
		"여행>관광,명소":      "sightseeing",
		"여행>공원":         "sightseeing",
		"":               "sightseeing",
	}
	for in, want := range cases {
		if got := mapCategory(in); got != want {
			t.Errorf("mapCategory(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSearch_UsesEndpointAndForwardsHeaders(t *testing.T) {
	var gotID, gotSecret, gotQuery, gotDisplay string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotID = r.Header.Get("X-Naver-Client-Id")
		gotSecret = r.Header.Get("X-Naver-Client-Secret")
		gotQuery = r.URL.Query().Get("query")
		gotDisplay = r.URL.Query().Get("display")
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"items": []any{}})
	}))
	defer srv.Close()

	c := NewNaverClient("id-x", "secret-y")
	c.endpoint = srv.URL

	out, err := c.Search(context.Background(), " 여의도 ")
	if err != nil {
		t.Fatalf("search: %v", err)
	}
	if len(out) != 0 {
		t.Errorf("len = %d, want 0", len(out))
	}
	if gotID != "id-x" || gotSecret != "secret-y" {
		t.Errorf("headers = %q/%q, want id-x/secret-y", gotID, gotSecret)
	}
	if gotQuery != "여의도" {
		t.Errorf("query = %q, want %q (whitespace trimmed)", gotQuery, "여의도")
	}
	if gotDisplay != "5" {
		t.Errorf("display = %q, want 5 (Naver hard limit)", gotDisplay)
	}
}

func TestSearch_EmptyQueryRejected(t *testing.T) {
	c := NewNaverClient("a", "b")
	if _, err := c.Search(context.Background(), "  "); err == nil {
		t.Fatal("expected error for empty query")
	}
}

func TestSearch_NonOKStatusReturnsError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"errorCode":"024","errorMessage":"Authentication failed"}`, http.StatusUnauthorized)
	}))
	defer srv.Close()

	c := NewNaverClient("bad", "bad")
	c.endpoint = srv.URL
	if _, err := c.Search(context.Background(), "홍대"); err == nil {
		t.Fatal("expected error for 401 status")
	}
}

func TestConfigured(t *testing.T) {
	if NewNaverClient("", "").Configured() {
		t.Error("empty creds should not be Configured")
	}
	if NewNaverClient("id", "").Configured() {
		t.Error("missing secret should not be Configured")
	}
	if !NewNaverClient("id", "secret").Configured() {
		t.Error("full creds should be Configured")
	}
}
