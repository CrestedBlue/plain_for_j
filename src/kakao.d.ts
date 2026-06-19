/* Kakao Maps SDK는 전역 window.kakao 로 주입된다 (동적 로드). */
export {};

declare global {
  interface Window {
    // SDK 타입 패키지를 따로 두지 않으므로 any 로 둔다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}
