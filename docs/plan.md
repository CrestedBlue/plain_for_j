# MAPLANNER — 문서 인덱스

여행 일정을 저장·열람·**공유 편집**하는 웹앱(`plan_for_j`).

## 현재 상태

- **v1 MVP**: ✅ 완료 (커밋 `f982c05`) — 무백엔드 SPA(localStorage + 개념지도).
- **v2 풀스택 전환**: 진행 중 — Go+gin+sqlc+MySQL 백엔드, 공유 편집 + 네이버 검색 + 소셜 로그인.
  - **P0(백엔드 스캐폴딩 + 스키마) 완료** (2026-06-29). 다음: P1 Trip CRUD API.

## 문서 지도

| 문서 | 내용 |
| --- | --- |
| [requirements.md](requirements.md) | 요구사항 · 기획 · v2 목표 |
| [design.md](design.md) | 데이터 모델 · 화면 흐름 · UX · SVG 지도 한계 |
| [architecture.md](architecture.md) | 기술스택 · 모노레포 구조 · 디렉토리 |
| [roadmap.md](roadmap.md) | 단계(v1/v2) · 마일스톤 · **리스크** |
| [security.md](security.md) | 시크릿 · 인증 · XSS · 헤더 · OAuth 도메인 |
| [features/frontend.md](features/frontend.md) | 프론트 현행 기능 + 백로그(F1·F2·F4·F5·F6) |
| [features/backend.md](features/backend.md) | API 설계 · 인증 · 네이버 검색 · 댓글 백엔드 |
| [history.md](history.md) | 날짜별 변경·결정 로그 + **확정 결정표** |

## 빠른 참고

- 일정 요약·다음 단계 → [roadmap.md](roadmap.md)
- "왜 이렇게 정했나"(카카오 제거 등) → [history.md](history.md)
