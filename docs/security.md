# 보안

> 상위 인덱스: [plan.md](plan.md) · 관련: [features/backend.md](features/backend.md)

## 시크릿 관리

- **네이버 지역검색 `client_id`/`secret`, OAuth `client_secret`, `JWT_SECRET`은 서버에만 보관.** 프론트 노출 금지.
- 프론트 빌드에 들어가는 `VITE_*` 환경변수는 공개로 취급 → 비밀 금지.
- `.env`는 커밋 금지(`server/.gitignore`), `.env.example`만 커밋.
- 운영(OCI)은 실제 환경변수/시크릿으로 주입.

## 인증 / 세션

- **소셜 OAuth(카카오/구글) → JWT를 HttpOnly·Secure·SameSite 쿠키**로 발급. 토큰을 localStorage에 두지 않음(XSS 탈취 방지).
- 미들웨어로 `/api/trips*` 등 보호. 클라이언트 렌더 게이팅은 표시 제어일 뿐, **접근 통제는 서버가 강제**.
- CSRF: 쿠키 인증이므로 `SameSite=Lax/Strict` + 상태변경 요청 보호.

## 입력 검증 / XSS

- 모든 사용자 입력은 서버 경계에서 검증.
- 댓글/메모 등 텍스트는 출력 시 이스케이프(React 기본 이스케이프 활용, `dangerouslySetInnerHTML` 금지).
- 댓글 입력 길이 제한 + 전송 rate-limit.

## 네트워크 / 헤더

- 전 구간 HTTPS(Caddy 자동 TLS).
- 운영 CSP 구성, `X-Content-Type-Options`, `Referrer-Policy` 등 기본 보안 헤더.

## OAuth 도메인

- 카카오/구글 콘솔에 **콜백(redirect) URL 정확히 등록** — dev=`localhost`, prod=도메인.
- 생 IP는 OAuth 리다이렉트에 거의 불가 → 도메인 선확보 필요([roadmap.md](roadmap.md) 참조).
