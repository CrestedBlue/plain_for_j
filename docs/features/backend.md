# 백엔드 기능

> 상위 인덱스: [../plan.md](../plan.md) · 관련: [../architecture.md](../architecture.md) · [../security.md](../security.md)

## 현황 (P0·P1·P3 완료)

- Go + gin 서버, `database/sql` + go-sql-driver/mysql 커넥션 풀.
- sqlc 파이프라인(`server/internal/db/schema.sql` + `query.sql` → `dbgen/`).
- `/api/health`(프로세스), `/api/health/db`(DB ping). 응답 봉투 `{success,data,error}`.
- Trip/일정 CRUD 라우트 전체(`/api/trips`, `/api/trips/{id}/days/{date}/items`).
- **`/api/places/search` (P3)**: 네이버 지역검색 어댑터(`internal/places/naver.go`) — `NAVER_SEARCH_CLIENT_ID/SECRET` 있을 때만 라우트 활성. `<b>` 태그 스트립·mapx/mapy(경도/위도 × 10^7) 파싱·카테고리 5종 매핑·한국 위경도 범위 검사. 라이브 호출은 credentials 확보 후 검증 예정.
- 로컬 MySQL: `deploy/docker-compose.yml`(호스트 3307), 기동 시 스키마 자동 적용.

## API 설계 (예정)

### Trip CRUD (P1)
- `GET /api/trips`, `POST /api/trips`, `GET/PUT/DELETE /api/trips/{id}`
- 일정 항목: `POST/PUT/DELETE /api/trips/{id}/days/{date}/items/{itemId}`
- 일정 순서 변경: `PUT /api/trips/{id}/days/{date}/reorder` — body `{orderedIds:[...]}`, 그 순서대로 `sort_order` 재부여(트랜잭션). 시간 역전은 검증 안 함(프론트 소프트 경고 정책).
- sqlc 쿼리 + service(Repository 패턴) + gin 핸들러.

### 일정 시간·순서 모델 (2026-07-21)
- `time`(시작)·`end_time`(종료) 모두 **선택**(nullable). 비면 느슨한 일정 = 순서만 보존.
- `sort_order`(INT) 명시 컬럼이 하루 안의 표시 순서. 신규 항목은 `NextSortOrder`로 그 날 맨 끝에 append.
- 시간 지정 항목의 순서 역전 차단은 **서버에서 안 함** — 프론트가 어긋난 항목에 경고 아이콘만 표시.

### 인증 (P2) — 소셜 OAuth
- `GET /api/auth/{provider}` 인가 시작 → `GET /api/auth/{provider}/callback` 인가코드→토큰교환→프로필 조회→`users` upsert→**JWT HttpOnly 쿠키** 발급.
- 미들웨어로 `/api/trips*` 보호. `GET /api/me`. provider = `kakao` | `google`.
- 상세 보안: [../security.md](../security.md).

### 네이버 검색 프록시 (P3) — 코드 완료
- `GET /api/places/search?q=` → 네이버 지역검색(client_id/secret 서버) 호출 → `{name,address,lat,lng,category,categoryRaw}` 정규화.
- 좌표계: mapx/mapy(경도/위도 × 10^7 정수 문자열) → float. 한국 범위(경도 100~140, 위도 30~45) 밖은 0/0 반환.
- 카테고리 매핑(우선순위): 숙박 → 카페 → 음식/식당 → 쇼핑 → 기본(sightseeing).
- ⚠️ 네이버 지역검색 **1회 최대 5건** — `display=5` 하드코딩. 프론트 `src/lib/places.ts`가 소비하고 `ScheduleEditor` 인라인 검색창이 표시.
- credentials 미설정 시 라우트 자체를 등록하지 않음(경로 404). 라이브 호출 검증은 키 확보 후.

### 댓글/읽음 (F6, 인증 후)
- `comments { id, item_id(FK), author_user_id(FK users), text, created_at }`
- `read_state { user_id, item_id, last_read_at }` → 안 읽음 = `comment.created_at > last_read_at` 개수.
- 1차 폴링, 추후 SSE/WebSocket. XSS 이스케이프 + 입력 길이/전송 rate-limit.

## DB 스키마 (현재)

`users` / `trips` / `days` / `schedule_items` — UUID(CHAR(36)) PK, FK, `category` ENUM(프론트 미표시·기본값만 저장), `time`/`end_time` nullable, `sort_order` INT, `lat/lng` nullable. 원본: `server/internal/db/schema.sql`. 실행 중 DB 변경은 `server/internal/db/migrations/*.sql` 손수 적용.
