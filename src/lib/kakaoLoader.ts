/* Kakao Maps JavaScript SDK 동적 로더 (services 라이브러리 포함) */

let loadPromise: Promise<unknown> | null = null;

export function loadKakao(appKey: string): Promise<unknown> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window 가 없습니다.'));
  }
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Kakao 지도 SDK를 불러오지 못했습니다. 키/도메인 설정을 확인하세요.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
