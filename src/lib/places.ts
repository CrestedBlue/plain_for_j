import { CATEGORY_KEYS, type Category } from './categories';

/** 네이버 지역검색 결과 한 건 (서버 정규화 스키마). */
export type PlaceResult = {
  name: string;
  address: string;
  /** 위경도 — 서버가 한국 범위 밖이면 0/0 반환. 0/0 이면 "좌표 없음". */
  lat: number;
  lng: number;
  /** 우리 enum(sightseeing|restaurant|cafe|accommodation|shopping). */
  category: string;
  /** 네이버 원본 카테고리(툴팁·디버깅용). */
  categoryRaw: string;
};

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('서버에 연결할 수 없습니다.');
  }
  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; data?: T; error?: string }
    | null;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error || `요청 실패 (${res.status})`);
  }
  return body.data as T;
}

/** 서버 프록시를 통한 네이버 지역검색. 빈 질의는 빈 배열. 상위 최대 5건. */
export async function searchPlaces(q: string): Promise<PlaceResult[]> {
  const query = q.trim();
  if (!query) return [];
  return request<PlaceResult[]>(`/places/search?q=${encodeURIComponent(query)}`);
}

/** 서버가 준 category 값이 우리 Category enum에 해당하는지 확인. */
export function toCategoryOrDefault(raw: string, fallback: Category): Category {
  return (CATEGORY_KEYS as string[]).includes(raw) ? (raw as Category) : fallback;
}

/**
 * 위경도 → SVG 폴백 지도의 x/y(0~500)로 근사 매핑.
 *
 * 현재 SVG 지도는 서울 개념도이므로 서울 대략 bbox(126.76~127.18E, 37.42~37.70N)를
 * 선형으로 500×500 캔버스에 투영한다. 서울 밖은 clamp — 실제 지도 도입 전 임시 처리.
 * 좌표가 0/0(서버가 범위 밖으로 판단한 케이스)이면 중앙(250,250)에 배치.
 */
export function latLngToSvgXY(lat: number, lng: number): { x: number; y: number } {
  if (lat === 0 && lng === 0) return { x: 250, y: 250 };
  const minLng = 126.76;
  const maxLng = 127.18;
  const minLat = 37.42;
  const maxLat = 37.7;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const nx = clamp((lng - minLng) / (maxLng - minLng), 0, 1);
  const ny = clamp((maxLat - lat) / (maxLat - minLat), 0, 1);
  return { x: Math.round(nx * 500), y: Math.round(ny * 500) };
}
