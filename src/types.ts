import type { Category } from './lib/categories';

/** 실제 지도(Kakao) 좌표. 지도 키가 있을 때 사용 */
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
  /** SVG 폴백 지도용 좌표 (0~500) — 지도 클릭/프리셋으로 설정 */
  x: number;
  y: number;
  /** 실제 지도(Kakao)용 위경도 — 키 연동 시 채워짐 */
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
