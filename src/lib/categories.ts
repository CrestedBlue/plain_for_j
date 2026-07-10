export type Category =
  | 'sightseeing'
  | 'restaurant'
  | 'cafe'
  | 'accommodation'
  | 'shopping';

type CategoryInfo = {
  label: string;
  /** Tailwind 배경 클래스 */
  color: string;
  /** 지도 마커 색 */
  markerColor: string;
};

export const CATEGORIES: Record<Category, CategoryInfo> = {
  sightseeing: { label: '관광지', color: 'bg-emerald-500', markerColor: '#10b981' },
  restaurant: { label: '맛집', color: 'bg-rose-500', markerColor: '#f43f5e' },
  cafe: { label: '카페', color: 'bg-amber-500', markerColor: '#f59e0b' },
  accommodation: { label: '숙소', color: 'bg-sky-500', markerColor: '#0ea5e9' },
  shopping: { label: '쇼핑/기타', color: 'bg-purple-500', markerColor: '#a855f7' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
