-- 001 up: 느슨한 일정(시간 공백) + 종료시각 + 명시 순서 도입.
--
-- schema.sql은 sqlc codegen + 컨테이너 최초 기동 시드용이라, 이미 데이터가 있는
-- 볼륨에는 자동 적용되지 않는다. 실행 중인 DB에는 이 파일을 한 번 직접 적용한다:
--   docker exec -i planforj-mysql mysql -uplanforj -pplanforj planforj \
--     < server/internal/db/migrations/001_schedule_time_order.up.sql

ALTER TABLE schedule_items
  MODIFY COLUMN time VARCHAR(5) NULL,
  ADD COLUMN end_time VARCHAR(5) NULL AFTER time,
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER end_time;

-- 기존 행 sort_order 백필: 하루(day_id) 안에서 (time, created_at) 순으로 0,1,2…
UPDATE schedule_items s
JOIN (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY day_id ORDER BY time, created_at) - 1 AS rn
  FROM schedule_items
) o ON s.id = o.id
SET s.sort_order = o.rn;
