import { describe, it, expect } from 'vitest';
import { eachDateInRange, formatDayLabel, buildDays } from './dates';

describe('eachDateInRange', () => {
  it('범위의 모든 날짜를 양끝 포함해 반환한다', () => {
    expect(eachDateInRange('2026-06-20', '2026-06-23')).toEqual([
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
    ]);
  });

  it('시작과 종료가 같으면 하루만 반환한다', () => {
    expect(eachDateInRange('2026-06-20', '2026-06-20')).toEqual(['2026-06-20']);
  });

  it('시작이 종료보다 늦으면 빈 배열을 반환한다', () => {
    expect(eachDateInRange('2026-06-25', '2026-06-20')).toEqual([]);
  });

  it('월 경계를 올바르게 넘어간다', () => {
    expect(eachDateInRange('2026-06-29', '2026-07-01')).toEqual([
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
    ]);
  });
});

describe('formatDayLabel', () => {
  it('월/일 (요일) 형식으로 표시한다', () => {
    expect(formatDayLabel('2026-06-20')).toBe('6/20 (토)');
  });
});

describe('buildDays', () => {
  it('각 날짜에 빈 items 배열을 가진 Day를 만든다', () => {
    const days = buildDays('2026-06-20', '2026-06-21');
    expect(days).toHaveLength(2);
    expect(days[0]).toEqual({ date: '2026-06-20', items: [] });
    expect(days[1]).toEqual({ date: '2026-06-21', items: [] });
  });
});
