package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

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
