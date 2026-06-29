# 구조 (아키텍처 · 기술스택)

> 상위 인덱스: [plan.md](plan.md) · 관련: [design.md](design.md) · [features/backend.md](features/backend.md)

## 기술 스택

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| 프론트 빌드/프레임워크 | Vite + React 18 + TypeScript | SPA |
| 상태관리 | Zustand | (v2에서 persist→서버 API로 교체 예정) |
| 스타일 | Tailwind CSS + 디자인 토큰 | web 룰 준수 |
| 지도 표시 | **SVG 개념지도**(`VectorMapFallback`) | 카카오 제거됨 → [history.md](history.md) |
| 프론트 테스트 | Vitest(단위) + Playwright(E2E) | |
| 백엔드 언어/프레임워크 | **Go + gin** | `server/` |
| DB / 접근 | **MySQL / sqlc** | `.sql` → 타입세이프 Go 생성 |
| 인증 | **소셜 OAuth(카카오/구글) → JWT(HttpOnly 쿠키)** | [security.md](security.md) |
| 위치검색 | **네이버 지역검색**(서버 프록시) | [features/backend.md](features/backend.md) |
| 호스팅 | **Oracle Cloud(OCI Always Free ARM)** + Caddy | 자동 HTTPS + 정적 프론트 + `/api` 프록시 |

## 모노레포 구조

```
plan_for_j/
├─ src/                  # 프론트 (Vite/React)
├─ server/               # Go 백엔드
│  ├─ cmd/api/main.go
│  ├─ internal/config/   # 환경변수 → Config, DSN
│  ├─ internal/db/       # schema.sql · query.sql · dbgen(sqlc 생성) · db.go
│  ├─ internal/http/     # gin 라우터 + 핸들러 (+ 미들웨어 JWT, 예정)
│  ├─ internal/auth/     # OAuth 콜백 → JWT 쿠키 (예정 P2)
│  ├─ internal/trip/     # service (Repository 패턴) (예정 P1)
│  ├─ internal/places/   # naver.go 검색 프록시 (예정 P3)
│  └─ sqlc.yaml
├─ deploy/               # docker-compose(로컬 MySQL), Caddyfile/systemd(예정)
└─ docs/                 # 본 문서들
```

## 프론트 디렉토리 (현재 실제)

```
src/
├─ components/
│  ├─ calendar/      # CalendarBoard, CreateTripCalendar
│  ├─ dashboard/     # Dashboard, DayTabs, ScheduleTimeline, ScheduleEditor,
│  │                 #   CalendarModal, CommentThread(프로토타입 보류)
│  ├─ map/           # MapPanel, VectorMapFallback
│  ├─ trip-list/     # TripList
│  └─ icons/         # Icon
├─ store/tripStore.ts   # Zustand(+persist, v2에서 교체 예정)
├─ lib/                 # calendar, categories, dates(+test)
└─ types.ts
```

## 응답/패턴 규약

- API 응답 봉투: `{ success, data, error }` 통일.
- 데이터 접근은 Repository 패턴(서버 service 계층). 프론트는 서버상태를 zustand에 중복 저장하지 않음(fetch 계층 분리).
