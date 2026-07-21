import type { ScheduleItem, Trip } from '../types';

/** 목록용 여행묶음 요약(일정 미포함) — 서버 GET /api/trips */
export type TripSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
};

/** 일정 추가/수정 요청 본문. time/endTime은 선택(비면 느슨한 일정). */
export type ItemPayload = {
  time?: string;
  endTime?: string;
  locationName: string;
  displayName: string;
  category: string;
  notes: string;
  location?: { name: string; lat: number; lng: number };
};

const BASE = '/api';

/** 응답 봉투 {success,data,error}를 풀어 data를 반환. 실패 시 throw. */
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

export const api = {
  listTrips: () => request<TripSummary[]>('/trips'),

  getTrip: (id: string) => request<Trip>(`/trips/${id}`),

  createTrip: (input: { title: string; startDate: string; endDate: string }) =>
    request<Trip>('/trips', { method: 'POST', body: JSON.stringify(input) }),

  renameTrip: (id: string, title: string) =>
    request<Trip>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),

  deleteTrip: (id: string) => request<unknown>(`/trips/${id}`, { method: 'DELETE' }),

  addItem: (tripId: string, date: string, input: ItemPayload) =>
    request<ScheduleItem>(`/trips/${tripId}/days/${date}/items`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateItem: (tripId: string, date: string, itemId: string, input: ItemPayload) =>
    request<ScheduleItem>(`/trips/${tripId}/days/${date}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteItem: (tripId: string, date: string, itemId: string) =>
    request<unknown>(`/trips/${tripId}/days/${date}/items/${itemId}`, { method: 'DELETE' }),

  /** 하루 안의 일정 순서를 orderedIds 순서대로 재배치. 갱신된 여행 전체를 반환. */
  reorderItems: (tripId: string, date: string, orderedIds: string[]) =>
    request<Trip>(`/trips/${tripId}/days/${date}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),
};
