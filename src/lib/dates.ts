import type { Day } from '../types';

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** 로컬 자정 기준 Date 생성 (타임존 밀림 방지) */
function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Date → 'YYYY-MM-DD' */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 시작~종료(양끝 포함)의 모든 날짜를 ISO 문자열 배열로. 잘못된 범위면 빈 배열 */
export function eachDateInRange(startISO: string, endISO: string): string[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** 'YYYY-MM-DD' → '6/20 (토)' */
export function formatDayLabel(iso: string): string {
  const d = parseISO(iso);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_KO[d.getDay()]})`;
}

/** 기간으로부터 빈 일정의 Day 배열 생성 */
export function buildDays(startISO: string, endISO: string): Day[] {
  return eachDateInRange(startISO, endISO).map((date) => ({ date, items: [] }));
}

/** ISO 날짜에 delta일을 더한 ISO 날짜 */
export function addDaysISO(iso: string, delta: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

/** 오늘 날짜 'YYYY-MM-DD' */
export function todayISO(): string {
  return toISODate(new Date());
}
