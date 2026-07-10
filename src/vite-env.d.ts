/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * NCP > Maps > Application 등록 후 발급받은 Client ID.
   * 프론트에 노출되는 값이므로 반드시 도메인 화이트리스트로 보호할 것.
   * 비어 있으면 SVG 개념 지도(폴백)로 자동 전환된다.
   */
  readonly VITE_NAVER_MAP_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
