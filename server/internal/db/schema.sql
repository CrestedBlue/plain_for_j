-- plan_for_j v2 스키마 (MySQL)
-- sqlc 생성 + 마이그레이션 소스. UUID는 CHAR(36) 문자열.

CREATE TABLE users (
  id            CHAR(36)     NOT NULL,
  provider      VARCHAR(20)  NOT NULL,            -- 'kakao' | 'google'
  provider_uid  VARCHAR(255) NOT NULL,            -- 소셜 측 고유 ID
  display_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NULL,
  avatar_url    TEXT         NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_provider (provider, provider_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trips (
  id            CHAR(36)     NOT NULL,
  owner_user_id CHAR(36)     NULL,                -- 만든 사람(식별 도입 후 채움)
  title         VARCHAR(200) NOT NULL,
  start_date    DATE         NOT NULL,
  end_date      DATE         NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trips_owner (owner_user_id),
  CONSTRAINT fk_trips_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE days (
  id        CHAR(36) NOT NULL,
  trip_id   CHAR(36) NOT NULL,
  date      DATE     NOT NULL,                    -- 'YYYY-MM-DD'
  PRIMARY KEY (id),
  UNIQUE KEY uq_days_trip_date (trip_id, date),
  CONSTRAINT fk_days_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE schedule_items (
  id            CHAR(36)     NOT NULL,
  day_id        CHAR(36)     NOT NULL,
  time          VARCHAR(5)   NOT NULL,            -- 'HH:MM'
  location_name VARCHAR(200) NOT NULL,
  display_name  VARCHAR(200) NOT NULL DEFAULT '', -- 비우면 location_name 사용
  category      ENUM('sightseeing','restaurant','cafe','accommodation','shopping') NOT NULL,
  notes         TEXT         NOT NULL,
  geo_name      VARCHAR(200) NULL,                 -- 네이버 검색 장소명/주소
  lat           DOUBLE       NULL,                 -- 실지도용 위경도
  lng           DOUBLE       NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_items_day (day_id),
  CONSTRAINT fk_items_day FOREIGN KEY (day_id) REFERENCES days (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
