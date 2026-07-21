-- 001 down: 시작시각 NOT NULL 복원 + 종료시각·순서 컬럼 제거.
--   docker exec -i planforj-mysql mysql -uplanforj -pplanforj planforj \
--     < server/internal/db/migrations/001_schedule_time_order.down.sql
-- 주의: time이 NULL인 행이 있으면 MODIFY NOT NULL이 실패한다. 먼저 채우거나 삭제할 것.

ALTER TABLE schedule_items
  DROP COLUMN sort_order,
  DROP COLUMN end_time,
  MODIFY COLUMN time VARCHAR(5) NOT NULL;
