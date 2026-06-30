# 일정 (단계 · 마일스톤 · 리스크)

> 상위 인덱스: [plan.md](plan.md) · 날짜별 이력: [history.md](history.md)

## v1 (MVP) — ✅ 완료 (커밋 `f982c05`)

스캐폴드 → 데이터/스토어 → 여행묶음·날짜 → 일정 CRUD → 지도/위치입력 → 상세·active 동기화 → 디자인/반응형 → 테스트. 자세한 단계는 [history.md](history.md) 참조.

## v2 (풀스택 전환) — 진행 중

| Phase | 내용 | 상태 |
| --- | --- | --- |
| **P0. 백엔드 스캐폴딩 + 스키마** | Go+gin, MySQL 커넥션, sqlc 설정, `users/trips/days/schedule_items` 스키마, `/api/health` | ✅ **완료** (2026-06-29) |
| **P1. Trip CRUD API** | sqlc 쿼리 + service + gin 핸들러, trips·days·items CRUD, 응답봉투 통일 | ✅ **완료** (2026-06-29) |
| **P2. 소셜 OAuth 인증** | 카카오/구글 OAuth → `users` upsert → JWT 쿠키, 미들웨어 보호, `/api/me` | ⬜ 예정 |
| **P3. 네이버 검색 프록시** | `GET /api/places/search` 정규화, 프론트 `src/lib/places.ts` | ⬜ 예정 |
| **P4. 프론트 데이터 계층 교체** | persist 제거 → `src/lib/api.ts`, localStorage→서버 1회 임포트 | ⬜ 예정 |
| **P5. OCI 배포** | Caddy(HTTPS+정적+`/api`), systemd, 방화벽 2중 개방 | ⬜ 예정 |

> ⚠️ **순서 주의**: 소셜 OAuth 리다이렉트는 도메인 필수 → 도메인+HTTPS를 P2 전에 선확보(배포 일정이 당겨짐). 개발 중엔 `localhost` 리다이렉트 가능.

## v2 완료 기준 (Acceptance)

- 소셜 로그인(카카오/구글) 후 일정 CRUD가 서버 MySQL에 저장
- 다른 기기/사람이 접속해도 같은 일정 표시·편집, 작성/수정자 식별
- 장소명 검색 시 네이버 결과(상위 5곳) 표시 + 선택 시 주소·좌표 저장
- 지도 표시는 SVG, 카카오 흔적 0 ✅
- OCI에서 HTTPS 외부 접속 가능
- Go 단위테스트 + 프론트 Vitest 통과

## 리스크

| 리스크 | 가능성 | 대응 |
| --- | --- | --- |
| 네이버 지역검색 1회 최대 5건 / 일 25,000건 | HIGH | UI에 "상위 5곳" 명시, 기대치 조정 |
| 소셜 OAuth 도메인·리다이렉트 선결 | HIGH | 도메인+HTTPS를 P2 전 확보, 콜백 URL 콘솔 등록(dev/prod) |
| 네이버/OAuth secret 노출 | HIGH(보안) | 서버에만 보관, 프론트 노출 금지 → [security.md](security.md) |
| 동시 편집 충돌(2명 같은 일정) | MEDIUM | 1차 last-write-wins + `updated_at`, 추후 낙관적 락 |
| localStorage→서버 임포트 중복/유실 | MEDIUM | 임포트 1회 플래그 + 멱등 키 |
| OCI 포트 2중 방화벽(보안목록+iptables) | MEDIUM | 배포 체크리스트 명시 |
| 외부 OAuth 의존(카카오/구글 장애·정책) | MEDIUM | provider 2개 분산, 에러 핸들링 |
| 무백엔드→풀스택 운영부담 | 확실 | systemd 재기동 + `mysqldump` 백업 문서화 |
