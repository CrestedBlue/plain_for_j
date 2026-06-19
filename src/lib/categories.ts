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
  /** SVG 마커 색 */
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

/** SVG 폴백 지도용 서울 주요 랜드마크 프리셋 */
export const SEOUL_LANDMARKS: {
  name: string;
  x: number;
  y: number;
  category: Category;
}[] = [
  { name: '여의도 한강공원', x: 150, y: 320, category: 'sightseeing' },
  { name: 'N서울타워', x: 260, y: 280, category: 'sightseeing' },
  { name: '경복궁', x: 250, y: 140, category: 'sightseeing' },
  { name: '홍대 카페거리', x: 100, y: 220, category: 'cafe' },
  { name: '인사동 쌈지길', x: 290, y: 160, category: 'shopping' },
  { name: '강남역', x: 340, y: 390, category: 'restaurant' },
  { name: '롯데월드', x: 440, y: 360, category: 'sightseeing' },
  { name: '북촌 한옥마을', x: 270, y: 110, category: 'sightseeing' },
  { name: '동대문 디자인플라자(DDP)', x: 330, y: 200, category: 'shopping' },
];
