import type { ScheduleItem } from '../types';

/**
 * 시간이 지정된 일정끼리 표시 순서와 시각이 어긋난 항목의 id 집합을 돌려준다(표시용).
 *
 * 규칙: 표시 순서로 훑을 때, 시작시각이 있는 항목들의 시각은 비내림차순이어야 한다.
 * 인접한 두 "시간 항목"에서 앞 시각이 뒤 시각보다 늦으면(역전) 두 항목 모두 충돌로 표시한다.
 * 시간 없는(느슨한) 항목은 제약에 관여하지 않는다.
 *
 * 이 값은 **경고 표시 전용**이다 — 드래그나 시간 입력을 막지 않는다.
 */
export function findTimeConflicts(orderedItems: ScheduleItem[]): Set<string> {
  const conflicts = new Set<string>();
  const timed = orderedItems.filter((i) => !!i.time);
  for (let k = 1; k < timed.length; k++) {
    const prev = timed[k - 1];
    const cur = timed[k];
    // 'HH:MM' 문자열 비교 = 시각 비교(자리수 고정이라 사전식 비교가 곧 시간 비교).
    if ((prev.time as string) > (cur.time as string)) {
      conflicts.add(prev.id);
      conflicts.add(cur.id);
    }
  }
  return conflicts;
}

/**
 * 시작·종료 시각을 사람이 읽는 한 줄로 만든다.
 * 시작+종료 → "09:00–11:00", 시작만 → "09:00", 종료만 → "–11:00", 둘 다 없음 → "".
 */
export function formatTimeRange(item: Pick<ScheduleItem, 'time' | 'endTime'>): string {
  if (item.time && item.endTime) return `${item.time}–${item.endTime}`;
  if (item.time) return item.time;
  if (item.endTime) return `–${item.endTime}`;
  return '';
}
