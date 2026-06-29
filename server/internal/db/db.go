// Package db는 MySQL 커넥션 풀을 연다.
package db

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// Open은 DSN으로 *sql.DB를 만들고 Ping으로 연결을 검증한다.
func Open(dsn string) (*sql.DB, error) {
	pool, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	pool.SetMaxOpenConns(10)
	pool.SetMaxIdleConns(5)
	pool.SetConnMaxLifetime(5 * time.Minute)

	if err := pool.Ping(); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}
	return pool, nil
}
