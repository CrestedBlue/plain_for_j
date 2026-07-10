// 라이트/다크 테마 상태 훅.
//
// - 초기값 우선순위: localStorage("theme") → 시스템 설정(prefers-color-scheme) → 'dark'(기본)
// - `html` 태그의 `dark` 클래스로 Tailwind darkMode:'class'와 연동
// - FOUC(초기 깜빡임)는 index.html 인라인 스크립트가 미리 클래스를 세팅해 방지
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/** 현재 html 태그에 걸린 클래스로 테마를 읽는다(부트스트랩 스크립트 이후 신뢰 가능). */
function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** html 태그와 localStorage에 테마를 반영한다. */
function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (t === 'dark') el.classList.add('dark');
  else el.classList.remove('dark');
  try {
    window.localStorage.setItem(STORAGE_KEY, t);
  } catch {
    // Safari 프라이빗 모드 등 — 조용히 무시(다음 부팅 시 시스템 설정 폴백).
  }
}

/** 테마 조회 + 토글 훅. */
export function useTheme(): { theme: Theme; toggle: () => void; set: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => readTheme());

  useEffect(() => {
    // 다른 탭에서 변경했을 때 동기화.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        applyTheme(e.newValue);
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const set = useCallback((t: Theme) => {
    applyTheme(t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    set(theme === 'dark' ? 'light' : 'dark');
  }, [theme, set]);

  return { theme, toggle, set };
}
