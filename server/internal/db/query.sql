-- Trip CRUD (P1). sqlc.arg로 명명 파라미터 사용.

-- name: ListTrips :many
SELECT id, title, start_date, end_date, created_at, updated_at
FROM trips
ORDER BY created_at;

-- name: GetTrip :one
SELECT id, title, start_date, end_date, created_at, updated_at
FROM trips
WHERE id = sqlc.arg(id);

-- name: CreateTrip :exec
INSERT INTO trips (id, owner_user_id, title, start_date, end_date)
VALUES (sqlc.arg(id), sqlc.arg(owner_user_id), sqlc.arg(title), sqlc.arg(start_date), sqlc.arg(end_date));

-- name: UpdateTripTitle :exec
UPDATE trips SET title = sqlc.arg(title) WHERE id = sqlc.arg(id);

-- name: DeleteTrip :exec
DELETE FROM trips WHERE id = sqlc.arg(id);

-- name: CreateDay :exec
INSERT INTO days (id, trip_id, date) VALUES (sqlc.arg(id), sqlc.arg(trip_id), sqlc.arg(date));

-- name: ListDaysByTrip :many
SELECT id, date FROM days WHERE trip_id = sqlc.arg(trip_id) ORDER BY date;
