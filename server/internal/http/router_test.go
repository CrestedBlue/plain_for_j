package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/crestedblue/plan_for_j/server/internal/places"
)

// fakeSearcher 는 places.PlacesSearcher 를 만족하는 in-memory stub.
type fakeSearcher struct {
	out []places.Place
	err error
}

func (f fakeSearcher) Search(_ context.Context, _ string) ([]places.Place, error) {
	return f.out, f.err
}

func TestHandleHealth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	srv := NewServer(nil)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	srv.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var body struct {
		Success bool `json:"success"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !body.Success {
		t.Fatalf("success = false, want true (body=%s)", rec.Body.String())
	}
}

func TestHandleHealthDB_NoConnection(t *testing.T) {
	gin.SetMode(gin.TestMode)
	srv := NewServer(nil) // db 미연결

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/health/db", nil)
	srv.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusServiceUnavailable)
	}
}

func TestSearchPlaces_OK(t *testing.T) {
	gin.SetMode(gin.TestMode)
	srv := NewServer(nil)
	srv.SetPlaces(fakeSearcher{out: []places.Place{
		{Name: "홍대입구역", Address: "서울 마포구", Lat: 37.5567, Lng: 126.9227, Category: "sightseeing"},
	}})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/places/search?q=%ED%99%8D%EB%8C%80", nil)
	srv.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
	var body struct {
		Success bool           `json:"success"`
		Data    []places.Place `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !body.Success || len(body.Data) != 1 || body.Data[0].Name != "홍대입구역" {
		t.Fatalf("body = %s", rec.Body.String())
	}
}

func TestSearchPlaces_EmptyQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	srv := NewServer(nil)
	srv.SetPlaces(fakeSearcher{})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/places/search?q=", nil)
	srv.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestSearchPlaces_UpstreamError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	srv := NewServer(nil)
	srv.SetPlaces(fakeSearcher{err: errors.New("boom")})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/places/search?q=%EC%97%AC%EC%9D%98%EB%8F%84", nil)
	srv.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}

func TestSearchPlaces_DisabledWhenNotConfigured(t *testing.T) {
	gin.SetMode(gin.TestMode)
	srv := NewServer(nil) // places 미주입

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/places/search?q=%ED%99%8D%EB%8C%80", nil)
	srv.Router().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 (route absent)", rec.Code)
	}
}
