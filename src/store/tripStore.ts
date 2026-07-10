import { create } from 'zustand';
import type { Category } from '../lib/categories';
import type { GeoLocation, Trip } from '../types';
import { api, type ItemPayload, type TripSummary } from '../lib/api';

// 서버(MySQL) 백엔드 연동 스토어. 서버가 원본(source of truth)이고
// zustand는 화면용 캐시만 보관한다(서버상태 중복 저장 금지 원칙).

type CreateTripInput = {
  title: string;
  startDate: string;
  endDate: string;
};

export type ItemInput = {
  time: string;
  locationName: string;
  displayName: string;
  category: Category;
  notes: string;
  location?: GeoLocation;
};

type Status = 'idle' | 'loading' | 'ready' | 'error';

type TripState = {
  trips: TripSummary[]; // 목록(요약)
  activeTrip: Trip | null; // 현재 작업 중인 여행(전체)
  activeTripId: string | null;
  status: Status;
  error: string | null;

  loadTrips: () => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<string | null>;
  deleteTrip: (id: string) => Promise<void>;
  renameTrip: (id: string, title: string) => Promise<void>;
  selectTrip: (id: string | null) => Promise<void>;

  addItem: (date: string, input: ItemInput) => Promise<string | null>;
  updateItem: (date: string, itemId: string, input: ItemInput) => Promise<void>;
  removeItem: (date: string, itemId: string) => Promise<void>;
};

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.');

const toPayload = (input: ItemInput): ItemPayload => ({
  time: input.time,
  locationName: input.locationName,
  displayName: input.displayName,
  category: input.category,
  notes: input.notes,
  location: input.location,
});

export const useTripStore = create<TripState>((set, get) => {
  // 활성 여행을 서버에서 다시 받아 캐시를 갱신한다(변경 후 호출).
  const refreshActive = async (): Promise<void> => {
    const id = get().activeTripId;
    if (!id) return;
    const trip = await api.getTrip(id);
    set({ activeTrip: trip });
  };

  return {
    trips: [],
    activeTrip: null,
    activeTripId: null,
    status: 'idle',
    error: null,

    loadTrips: async () => {
      set({ status: 'loading', error: null });
      try {
        set({ trips: await api.listTrips(), status: 'ready' });
      } catch (e) {
        set({ status: 'error', error: errMsg(e) });
      }
    },

    createTrip: async (input) => {
      try {
        const trip = await api.createTrip(input);
        set({ activeTrip: trip, activeTripId: trip.id });
        await get().loadTrips();
        return trip.id;
      } catch (e) {
        set({ error: errMsg(e) });
        return null;
      }
    },

    deleteTrip: async (id) => {
      try {
        await api.deleteTrip(id);
        const wasActive = get().activeTripId === id;
        if (wasActive) set({ activeTrip: null, activeTripId: null });
        await get().loadTrips();
      } catch (e) {
        set({ error: errMsg(e) });
      }
    },

    renameTrip: async (id, title) => {
      try {
        const trip = await api.renameTrip(id, title);
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, title } : t)),
          activeTrip: s.activeTripId === id ? trip : s.activeTrip,
        }));
      } catch (e) {
        set({ error: errMsg(e) });
      }
    },

    selectTrip: async (id) => {
      if (!id) {
        set({ activeTrip: null, activeTripId: null });
        return;
      }
      set({ status: 'loading', error: null });
      try {
        const trip = await api.getTrip(id);
        set({ activeTrip: trip, activeTripId: id, status: 'ready' });
      } catch (e) {
        set({ status: 'error', error: errMsg(e) });
      }
    },

    addItem: async (date, input) => {
      const id = get().activeTripId;
      if (!id) return null;
      try {
        const item = await api.addItem(id, date, toPayload(input));
        await refreshActive();
        return item.id;
      } catch (e) {
        set({ error: errMsg(e) });
        return null;
      }
    },

    updateItem: async (date, itemId, input) => {
      const id = get().activeTripId;
      if (!id) return;
      try {
        await api.updateItem(id, date, itemId, toPayload(input));
        await refreshActive();
      } catch (e) {
        set({ error: errMsg(e) });
      }
    },

    removeItem: async (date, itemId) => {
      const id = get().activeTripId;
      if (!id) return;
      try {
        await api.deleteItem(id, date, itemId);
        await refreshActive();
      } catch (e) {
        set({ error: errMsg(e) });
      }
    },
  };
});
