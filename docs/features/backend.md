# 백엔드 기능

> 상위 인덱스: [../plan.md](../plan.md) · 관련: [../architecture.md](../architecture.md) · [../security.md](../security.md)

## 현황 (P0 완료)

- Go + gin 서버, `database/sql` + go-sql-driver/mysql 커넥션 풀.
- sqlc 파이프라인(`server/internal/db/schema.sql` + `query.sql` → `dbgen/`).
- `/api/health`(프로세스), `/api/health/db`(DB ping). 응답 봉투 `{success,data,error}`.
- 로컬 MySQL: `deploy/docker-compose.yml`(호스트 3307), 기동 시 스키마 자동 적용.

## API 설계 (예정)

### Trip CRUD (P1)
- `GET /api/trips`, `POST /api/trips`, `GET/PUT/DELETE /api/trips/{id}`
- 일정 항목: `POST/PUT/DELETE /api/trips/{id}/days/{date}/items/{itemId}`
- sqlc 쿼리 + service(Repository 패턴) + gin 핸들러.

### 인증 (P2) — 소셜 OAuth
- `GET /api/auth/{provider}` 인가 시작 → `GET /api/auth/{provider}/callback` 인가코드→토큰교환→프로필 조회→`users` upsert→**JWT HttpOnly 쿠키** 발급.
- 미들웨어로 `/api/trips*` 보호. `GET /api/me`. provider = `kakao` | `google`.
- 상세 보안: [../security.md](../security.md).

### 네이버 검색 프록시 (P3)
- `GET /api/places/search?q=` → 네이버 지역검색(client_id/secret 서버) 호출 → `{name,address,lat,lng,category}` 정규화.
- ⚠️ 네이버 지역검색 **1회 최대 5건**. 프론트 `src/lib/places.ts`가 소비.

### 댓글/읽음 (F6, 인증 후)
- `comments { id, item_id(FK), author_user_id(FK users), text, created_at }`
- `read_state { user_id, item_id, last_read_at }` → 안 읽음 = `comment.created_at > last_read_at` 개수.
- 1차 폴링, 추후 SSE/WebSocket. XSS 이스케이프 + 입력 길이/전송 rate-limit.

## DB 스키마 (현재)

`users` / `trips` / `days` / `schedule_items` — UUID(CHAR(36)) PK, FK, `category` ENUM, `lat/lng` nullable, SVG `x/y` 보존. 원본: `server/internal/db/schema.sql`.
