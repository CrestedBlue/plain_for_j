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
