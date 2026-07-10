/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * NCP > Maps > Application 등록 후 발급받은 Client ID. 필수 — 없으면 지도가 로드되지 않는다.
   * 프론트에 노출되는 값이므로 반드시 도메인 화이트리스트로 보호할 것.
   */
  readonly VITE_NAVER_MAP_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
