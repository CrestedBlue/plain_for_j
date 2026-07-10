import type { Category } from './lib/categories';

/** 실제 위경도 좌표(네이버 실지도 표시용). */
export type GeoLocation = {
  name: string;
  lat: number;
  lng: number;
};

/** 하루 안의 일정 한 건 */
export type ScheduleItem = {
  id: string;
  time: string; // 'HH:MM'
  /** 장소명 (기본 이름) */
  locationName: string;
  /** 표기명 — 비우면 장소명을 사용 */
  displayName: string;
  category: Category;
  notes: string;
  /** 위경도 — 지도 클릭/네이버 검색 결과 선택 시 채워짐. 없으면 지도에 표시되지 않음. */
  location?: GeoLocation;
};

/** 일정에 표시할 이름 (표기명 우선, 없으면 장소명) */
export function scheduleName(item: Pick<ScheduleItem, 'displayName' | 'locationName'>): string {
  return (item.displayName ?? '').trim() || item.locationName;
}

/** 여행묶음 안의 하루 */
export type Day = {
  date: string; // 'YYYY-MM-DD'
  items: ScheduleItem[];
};

/** 여행묶음 */
export type Trip = {
  id: string;
  title: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  days: Day[];
};
