// 네이버 지도 v3 JS SDK 로더.
//
// NCP(NAVER Cloud Platform) "Maps > Application" 등록 후 발급받은 Client ID를 사용한다.
// SDK URL 파라미터는 2024 개편 이후 `ncpKeyId`이지만 이전 앱은 `ncpClientId`도 유효 —
// 두 파라미터를 모두 전달해 어느 쪽 발급본이든 동작하도록 한다.
//
// - 중복 로드 방지: 한 번 로드된 Promise를 재사용
// - SSR 환경: window 없으면 즉시 reject

type NaverGlobal = { maps: unknown };

declare global {
  interface Window {
    naver?: NaverGlobal;
  }
}

let cached: Promise<NaverGlobal> | null = null;

export function loadNaverMap(clientId: string): Promise<NaverGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('네이버 지도는 브라우저 환경에서만 로드됩니다.'));
  }
  if (!clientId) {
    return Promise.reject(new Error('VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.'));
  }
  if (window.naver?.maps) return Promise.resolve(window.naver);
  if (cached) return cached;

  cached = new Promise<NaverGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => {
      if (window.naver?.maps) {
        resolve(window.naver);
      } else {
        reject(new Error('네이버 지도 SDK가 로드되었으나 초기화되지 않았습니다.'));
      }
    };
    script.onerror = () => {
      cached = null; // 재시도 여지
      reject(new Error('네이버 지도 SDK 스크립트 로드 실패 — 네트워크/도메인 화이트리스트 확인'));
    };
    document.head.appendChild(script);
  });
  return cached;
}
