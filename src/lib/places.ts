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
