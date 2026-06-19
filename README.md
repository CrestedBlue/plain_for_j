# 여행 노트 (plan_for_j)

여행묶음을 만들고, 날짜별 하루 일정을 Kakao 지도 위에 기록·저장하는 클라이언트 전용 웹앱.

- 데이터는 브라우저 **localStorage**에 저장 (백엔드 없음)
- 지도/위치검색: **Kakao Maps JavaScript SDK** (`services` 라이브러리)

기획 문서: [`docs/plan.md`](docs/plan.md)

## 시작하기

```bash
npm install
cp .env.example .env   # VITE_KAKAO_MAP_KEY 채우기
npm run dev            # http://localhost:5173
```

### Kakao 지도 키 발급

1. https://developers.kakao.com → 내 애플리케이션 → 앱 생성
2. **앱 키 → JavaScript 키** 복사 → `.env`의 `VITE_KAKAO_MAP_KEY`에 입력
3. **플랫폼 → Web → 사이트 도메인**에 `http://localhost:5173` 등록
4. 키 미설정 시 앱은 동작하되 지도 영역에 안내가 표시됩니다.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run typecheck` | 타입 검사 |
| `npm test` | 단위 테스트 (Vitest) |

## 구조

```
src/
├── components/   # trip-list, day-nav, schedule, map, detail, ui
├── store/        # Zustand + persist (localStorage)
├── lib/          # dates, kakaoLoader, geocode
├── hooks/
└── styles/       # tokens, global
```
