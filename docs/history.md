# 변경 · 결정 이력

> 상위 인덱스: [plan.md](plan.md). 날짜별 작업 로그 + 확정 결정을 한곳에 모은다.
> (아직 v1/v2를 나눌 정도는 아니라 날짜순으로만 정리)

## 날짜별 로그

### 2026-06-16 — 기획 시작 (MVP)
- 여행 일정 저장 웹앱 기획. 지도 **Kakao**, 저장 **localStorage**, **무백엔드**.
- Kakao 채택 이유: 키워드 장소검색을 **클라이언트에서 직접** 호출 가능 → 백엔드 없이 완결.

### 2026-06-17 — 백로그 추가
- 향후 확장 F1(추천)·F2(날씨)·F3(영업중)·F4(공휴일)·F5(스크럼 장소 라이브러리) 정리.

### 2026-06-22 — MVP 구현 완료 (커밋 `f982c05`)
- 일정 CRUD(3모드), 통합 캘린더 대시보드, 모바일 대응, SVG 폴백(+Kakao 키 분기), 단위테스트 6 green. GitHub `CrestedBlue/plain_for_j` 푸시.

### 2026-06-26 — 풀스택 전환(v2) 결정
- 동기: 사무실 **공유 편집** + **네이버**의 풍부한 장소정보.
- 백엔드 도입: **Go + gin + sqlc + MySQL**, 호스팅 **Oracle Cloud**, Caddy.
- **카카오 deprecate**: backend 없이도 클라이언트 검색이 돼서 채택했으나, **backend가 생기면서** 검색을 네이버(서버 프록시)로 전환 → 카카오 불필요해져 제거. 지도 표시는 **SVG-only**.
- 댓글: "지도 아래 전역 채팅" → **일정별 의논(댓글)** 으로 선회(카톡과 안 겹치고 화면 절약).
- 인증: "공용 비밀번호" → **소셜 OAuth(카카오/구글)** 로 변경(위조 불가 식별, 사람별 읽음표시).

### 2026-06-29 — 백엔드 P0 + 문서 정리
- 백엔드 **P0 완료**: 스캐폴딩 + `users/trips/days/schedule_items` 스키마 + `/api/health(/db)` + sqlc 생성 + 로컬 docker MySQL. end-to-end 검증 green.
- 일정별 의논 댓글 **하드코딩 프로토타입** 작성 후 **보류**(인증 후 재활성화) — `CommentThread.tsx`.
- **카카오 파일 삭제**: `KakaoMap.tsx`, `kakaoLoader.ts`, `kakao.d.ts`, `VITE_KAKAO_MAP_KEY`. `MapPanel`은 항상 SVG.
- **문서 분리**: `plan.md`(허브) + requirements/design/architecture/roadmap/security/features/history.

### 2026-06-30 — 프론트–백엔드 연동 (P4 핵심)
- **tripStore를 localStorage → 서버(MySQL) API로 전환**: `src/lib/api.ts` fetch 클라이언트 + Vite `/api` 프록시. 목록(요약)/활성여행(전체) 분리, 액션 async화, 서버상태만 캐시.
- App(최초 로드+로딩/에러 화면)·TripList(요약서 일수 계산)·Calendar/Dashboard(비동기 CRUD) 연동.
- **버그 수정**: 캘린더 여행 이름이 키 입력마다 PUT → **캘린더를 벗어날 때 1회 저장**.
- P1(백엔드 CRUD) 커밋을 커밋 스타일에 맞춰 7개로 재분할.
- **보류**: localStorage→서버 1회 임포트(기존 로컬 데이터 이전)는 YAGNI로 스킵. 남은 것 — P2 인증, P3 네이버 검색.

### 2026-07-09 — P3 네이버 검색 프록시 완료 (라이브 검증)
- **백엔드**: `internal/places/naver.go` 어댑터 신규 — 네이버 지역검색 v1 어댑터 + 응답 정규화(`<b>` 태그 스트립, mapx/mapy를 위경도로, 카테고리 5종 매핑, 한국 범위 밖은 0/0). `GET /api/places/search?q=` 핸들러 + `NAVER_SEARCH_CLIENT_ID/SECRET` 있을 때만 라우트 등록. 파싱·좌표·카테고리·헤더 전달·인증 실패·질의 비었을 때·업스트림 에러까지 단위테스트 green.
- **프론트**: `src/lib/places.ts` 신규 — `searchPlaces(q)` fetch 래퍼 + `latLngToSvgXY` 서울 bbox 근사 매핑. `ScheduleEditor` 안에 인라인 검색창(입력·엔터·결과 카드) 추가. 결과 클릭 시 장소명·카테고리·SVG 좌표 자동 채움(위경도는 아직 저장하지 않음 — 실지도 도입 시 활용).
- **라이브 검증**: 사용자 credentials로 실제 네이버 API 호출 확인. "여의도 한강공원 / 홍대 카페 / 명동 맛집 / 서울 호텔 / 빈 쿼리" 5개 시나리오 통과.
- **카테고리 매핑 버그 수정**: "파작 여의도점"(`양식>샌드위치`)이 sightseeing으로 잘못 매핑되던 문제 발견 → 네이버가 요리 종류(한식/양식/일식/중식/아시안/뷔페/패스트푸드)를 최상위로 주는 케이스도 restaurant로 커버하도록 `mapCategory` 확장. 테스트 케이스 추가 후 라이브 재검증 완료.

### 2026-07-10 — UX: 테마 토글 · 장소검색 위치 · 지도 포커싱
오늘 작업 요약(사용자 요청 기준).

1. **라이트/다크 테마 토글**
   - 선택: 다크/라이트 토글 + 지도 주변 UI는 테마 매치(네이버 지도 타일 자체는 라이트 유지 — SDK 다크 스킨 미지원).
   - `darkMode: 'class'`, `src/lib/theme.ts`(`useTheme`), `index.html` FOUC 방지 부트스트랩, 주요 화면 `dark:` 병기.
   - 헤더(여행 목록·생성·대시보드)에 sun/moon 토글. 선택값은 `localStorage` 저장.

2. **장소 검색을 지도 아래로 이동**
   - `PlaceSearch.tsx`로 분리 후 우측 지도 카드 바로 아래에 배치(조회/추가/편집 모드와 무관하게 항상 노출).
   - `ScheduleEditor`에서는 검색 UI 제거.

3. **검색 결과 선택 → 지도 포커싱**
   - 결과 클릭 시 `NaverMap`이 `panTo` + 임시 핀 표시.
   - 모바일에선 지도 영역으로 `scrollIntoView`.

- **검증(테마·검색 이동·검색 포커싱)**: `tsc` / `vite build` / `go test` green.
- **미완료(코드만 일부 존재)**: 지도 클릭 → 리버스 지오코드 → 자동 지역검색(POI 포커싱). 커밋 범위 밖 · 이어서 마무리 예정.

### 2026-07-09 — P6 네이버 지도(실지도) 도입 + 포커싱 개선 (코드 완료)
- 배경: 사용자 요청 — "지도가 왜 아직도 가짜지도인가요? 일정을 추가하면 추가한 일정에 포커싱되게".
- v2 확정 결정(2026-06-26 "SVG-only") 재검토 결과, P3에서 위경도가 이미 서버에 흐르고 있어 실지도 재도입 비용이 낮음 → P6 신설.
- **프론트 lat/lng 저장 흐름**: `ScheduleFormState.location` 추가, 검색 결과 선택/실지도 클릭 시 세팅, `handleSubmit` payload에 포함. 서버 스키마·서비스는 이미 `geo_name/lat/lng` 지원.
- **`src/lib/naverMapLoader.ts`**: 네이버 지도 v3 SDK 동적 로더 (중복 방지 캐시, `ncpKeyId`+`ncpClientId` 이중 파라미터로 신·구 앱 호환, geocoder 서브모듈).
- **`src/components/map/NaverMap.tsx`**: SDK 타입은 unknown으로 좁혀 사용(타입 패키지 추가 회피). Map 인스턴스 생성 + 카테고리별 색상 마커 + 활성 마커 펄스 애니메이션 + `activeScheduleId` 변화 시 자동 `panTo` + 편집 폼 위경도 임시 핀.
- **`MapPanel` 분기**: `VITE_NAVER_MAP_CLIENT_ID` 있으면 `NaverMap`, 없으면 `VectorMapFallback` — v1 카카오 폴백 패턴 재현. 클릭 페이로드도 `{kind:'latlng'|'xy'}` 유니온으로 통일.
- **포커싱 개선**: `ScheduleTimeline`이 활성 카드로 `scrollIntoView`, `Dashboard`가 모바일에서 지도 영역으로 `scrollIntoView`(데스크톱은 sticky라 불필요). 실지도에선 `panTo`가 이 두 스크롤과 동시 동작.
- **`.env.example`(프론트 신규)**: `VITE_NAVER_MAP_CLIENT_ID` 지시. `vite-env.d.ts`에 타입 선언.
- **활성 대기**: NCP 콘솔에서 `Maps > Application` 등록 → Client ID를 프로젝트 루트 `.env`에 주입 → dev 서버 재시작 → 실지도 활성.

## 확정 결정표

| 항목 | 결정 | 결정일 |
| --- | --- | --- |
| 백엔드 언어 | Go (Golang) | 06-26 |
| 라우터 | gin | 06-26 |
| DB | MySQL | 06-26 |
| DB 접근 | sqlc | 06-26 |
| 인증/식별 | 소셜 OAuth(카카오/구글) → JWT(HttpOnly 쿠키) | 06-26 |
| 지도 표시 | SVG-only (카카오 제거) | 06-26 |
| 위치검색 | 네이버 지역검색(서버 프록시) | 06-26 |
| 호스팅 | Oracle Cloud(OCI Always Free ARM) + Caddy | 06-26 |
| 댓글 | 일정별 의논(전역 채팅에서 선회) | 06-26 |
