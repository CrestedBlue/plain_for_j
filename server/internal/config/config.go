// Package config는 환경변수에서 서버 설정을 읽는다.
package config

import (
	"fmt"
	"os"
)

// Config는 서버 구동에 필요한 설정 묶음이다.
type Config struct {
	AppPort string
	DB      DBConfig
	Naver   NaverConfig
}

// DBConfig는 MySQL 접속 정보다.
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

// NaverConfig는 네이버 지역검색 API credentials.
// 비어 있으면 /api/places/search 라우트는 비활성화된다(외부 노출 금지 — 서버 전용).
type NaverConfig struct {
	ClientID     string
	ClientSecret string
}

// DSN은 go-sql-driver/mysql 형식의 접속 문자열을 만든다.
func (d DBConfig) DSN() string {
	// parseTime: DATE/TIMESTAMP를 time.Time으로. loc=UTC로 고정 — DATE 컬럼이
	// 자정 기준 그대로 매칭되도록(Local이면 오프셋만큼 밀려 날짜 비교가 깨짐).
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=UTC",
		d.User, d.Password, d.Host, d.Port, d.Name,
	)
}

// Load는 환경변수를 읽어 Config를 만든다. 누락 시 합리적 기본값을 사용한다.
func Load() Config {
	return Config{
		AppPort: env("APP_PORT", "8080"),
		DB: DBConfig{
			Host:     env("DB_HOST", "127.0.0.1"),
			Port:     env("DB_PORT", "3306"),
			User:     env("DB_USER", "planforj"),
			Password: env("DB_PASSWORD", "planforj"),
			Name:     env("DB_NAME", "planforj"),
		},
		Naver: NaverConfig{
			ClientID:     env("NAVER_SEARCH_CLIENT_ID", ""),
			ClientSecret: env("NAVER_SEARCH_CLIENT_SECRET", ""),
		},
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
