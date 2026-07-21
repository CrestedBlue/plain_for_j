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

-- name: GetDayByTripAndDate :one
SELECT id FROM days WHERE trip_id = sqlc.arg(trip_id) AND date = sqlc.arg(date);

-- name: ListItemsByTrip :many
SELECT i.id, d.date, i.day_id, i.time, i.end_time, i.sort_order, i.location_name, i.display_name,
       i.category, i.notes, i.geo_name, i.lat, i.lng
FROM schedule_items i
JOIN days d ON i.day_id = d.id
WHERE d.trip_id = sqlc.arg(trip_id)
ORDER BY d.date, i.sort_order;

-- name: GetItem :one
SELECT id, day_id, time, end_time, sort_order, location_name, display_name, category, notes, geo_name, lat, lng
FROM schedule_items
WHERE id = sqlc.arg(id);

-- name: NextSortOrder :one
SELECT CAST(COALESCE(MAX(sort_order) + 1, 0) AS SIGNED)
FROM schedule_items
WHERE day_id = sqlc.arg(day_id);

-- name: CreateItem :exec
INSERT INTO schedule_items
  (id, day_id, time, end_time, sort_order, location_name, display_name, category, notes, geo_name, lat, lng)
VALUES
  (sqlc.arg(id), sqlc.arg(day_id), sqlc.arg(time), sqlc.arg(end_time), sqlc.arg(sort_order),
   sqlc.arg(location_name), sqlc.arg(display_name),
   sqlc.arg(category), sqlc.arg(notes), sqlc.arg(geo_name), sqlc.arg(lat), sqlc.arg(lng));

-- name: UpdateItem :exec
UPDATE schedule_items SET
  time = sqlc.arg(time),
  end_time = sqlc.arg(end_time),
  location_name = sqlc.arg(location_name),
  display_name = sqlc.arg(display_name),
  category = sqlc.arg(category),
  notes = sqlc.arg(notes),
  geo_name = sqlc.arg(geo_name),
  lat = sqlc.arg(lat),
  lng = sqlc.arg(lng)
WHERE id = sqlc.arg(id);

-- name: UpdateItemOrder :exec
UPDATE schedule_items SET sort_order = sqlc.arg(sort_order)
WHERE id = sqlc.arg(id) AND day_id = sqlc.arg(day_id);

-- name: DeleteItem :exec
DELETE FROM schedule_items WHERE id = sqlc.arg(id);
