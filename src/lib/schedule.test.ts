import { describe, expect, test } from 'vitest';
import type { ScheduleItem } from '../types';
import { findTimeConflicts, formatTimeRange } from './schedule';

// 테스트용 최소 일정 팩토리 — 관심 필드(id, time)만 지정.
const item = (id: string, time?: string, sortOrder = 0): ScheduleItem => ({
  id,
  time,
  sortOrder,
  locationName: id,
  displayName: '',
  category: 'sightseeing',
  notes: '',
});

describe('findTimeConflicts', () => {
  test('빈 목록은 충돌 없음', () => {
    expect(findTimeConflicts([]).size).toBe(0);
  });

  test('모두 느슨한(시간 없는) 항목은 충돌 없음', () => {
    const out = findTimeConflicts([item('a'), item('b'), item('c')]);
    expect(out.size).toBe(0);
  });

  test('시각이 오름차순이면 충돌 없음', () => {
    const out = findTimeConflicts([item('a', '09:00'), item('b', '12:00'), item('c', '15:00')]);
    expect(out.size).toBe(0);
  });

  test('역전된 인접 시간 항목은 둘 다 충돌', () => {
    const out = findTimeConflicts([item('a', '14:00'), item('b', '10:00')]);
    expect(out).toEqual(new Set(['a', 'b']));
  });

  test('느슨한 항목은 사이에 껴도 충돌에 무관', () => {
    // 순서: 09:00, (느슨), 15:00 → 시간 항목만 보면 오름차순
    const out = findTimeConflicts([item('a', '09:00'), item('loose'), item('c', '15:00')]);
    expect(out.size).toBe(0);
  });

  test('가운데 항목만 어긋나면 그 인접쌍만 충돌', () => {
    // 09:00, 14:00, 10:00 → (14:00,10:00)만 역전
    const out = findTimeConflicts([item('a', '09:00'), item('b', '14:00'), item('c', '10:00')]);
    expect(out).toEqual(new Set(['b', 'c']));
  });

  test('같은 시각은 역전이 아님', () => {
    const out = findTimeConflicts([item('a', '10:00'), item('b', '10:00')]);
    expect(out.size).toBe(0);
  });
});

describe('formatTimeRange', () => {
  test('시작+종료', () => {
    expect(formatTimeRange({ time: '09:00', endTime: '11:00' })).toBe('09:00–11:00');
  });
  test('시작만', () => {
    expect(formatTimeRange({ time: '09:00', endTime: undefined })).toBe('09:00');
  });
  test('종료만', () => {
    expect(formatTimeRange({ time: undefined, endTime: '11:00' })).toBe('–11:00');
  });
  test('둘 다 없음', () => {
    expect(formatTimeRange({ time: undefined, endTime: undefined })).toBe('');
  });
});
