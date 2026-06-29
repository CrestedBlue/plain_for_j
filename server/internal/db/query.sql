-- P0 시작 쿼리 (sqlc 파이프라인 검증용). CRUD는 P1에서 확장.

-- name: HealthCheck :one
SELECT 1 AS ok;

-- name: CountTrips :one
SELECT COUNT(*) AS total FROM trips;
