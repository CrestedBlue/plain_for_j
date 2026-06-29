# 설계 (데이터 모델 · 화면 흐름 · UX)

> 상위 인덱스: [plan.md](plan.md) · 관련: [architecture.md](architecture.md) · [requirements.md](requirements.md)

## 데이터 모델 (현재 코드 기준 — `src/types.ts`)

```ts
type GeoLocation = { name: string; lat: number; lng: number };

type ScheduleItem = {
  id: string;
  time: string;          // 'HH:MM'
  locationName: string;  // 장소명(기본)
  displayName: string;   // 표기명(비우면 locationName 사용)
  category: Category;    // sightseeing | restaurant | cafe | accommodation | shopping
  notes: string;         // 상세 메모
  x: number;             // SVG 개념지도 좌표(0~500) — 핀 위치의 원본
  y: number;
  location?: GeoLocation; // 위경도(네이버 검색 시 적재, 미래 실지도용)
};

type Day = { date: string; items: ScheduleItem[] };          // 'YYYY-MM-DD'
type Trip = { id: string; title: string; startDate: string; endDate: string; days: Day[] };
```

> 서버(MySQL) 스키마는 이 구조에 1:1 정렬된다 — `users`/`trips`/`days`/`schedule_items` (`server/internal/db/schema.sql`).

## 화면 흐름

```
[첫 화면 — 여행묶음 목록 (R0)] ── 선택/생성 ──▶ [묶음 작업 화면]
┌───────────────────────────────────────────────┐
│  ← 목록   [도쿄 3박 4일]      6/20 ~ 6/23        │  헤더(목록 복귀 + 캘린더)
├───────────────────────────────────────────────┤
│  [6/20] [6/21] [6/22] [6/23]                    │  Day 탭(R2, 고정)
├──────────────────────┬────────────────────────┤
│  하루 일정 리스트      │   개념 지도(SVG)        │
│  • 여의도 방문 ←선택   │   ● 활성 마커            │  R3
│  • 한강 피크닉         │   ○ ○ (클릭→핀 지정)     │
│  [+ 일정 추가]         │                         │
├──────────────────────┴────────────────────────┤
│  일정 조회/수정/추가 패널 (3모드) + 상세 메모      │  R4
└───────────────────────────────────────────────┘
```

일정 선택 ↔ 지도 마커 active는 **양방향 동기화**.

## UX 규칙

- **편집기 3모드 분리**: 조회(view) / 수정(edit) / 추가(add) — `ScheduleEditor`.
- 일정 항목 = 장소명(기본) · 표기명(선택) · 카테고리 · 메모.
- 모바일 풀스크린(100dvh), 헤더 압축 + Day 탭 고정, 터치 삭제버튼, 320/375 검증.

## 지도(SVG-only)의 한계 — 중요

SVG 지도는 실제 지리좌표가 아니라 **양식화된 개념 지도**(`SEOUL_LANDMARKS`를 임의 x/y에 배치). 따라서:

- 네이버가 준 위경도(lat/lng)를 **SVG 핀 위치로 직접 쓸 수 없음.**
- 네이버 검색의 실익 = ① 장소명 자동완성 ② 주소·위경도를 `location`에 **저장**(미래 대비 적재).
- **핀 위치는 x/y 방식 유지.** 저장한 위경도는 추후 네이버 Maps **표시** 도입 시 실지도 핀으로 활용.
