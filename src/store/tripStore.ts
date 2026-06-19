import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../lib/categories';
import type { ScheduleItem, Trip } from '../types';
import { buildDays } from '../lib/dates';

const newId = (): string => crypto.randomUUID();

type CreateTripInput = {
  title: string;
  startDate: string;
  endDate: string;
};

export type AddItemInput = {
  time: string;
  locationName: string;
  displayName: string;
  category: Category;
  notes?: string;
  x: number;
  y: number;
};

type TripState = {
  trips: Trip[];
  activeTripId: string | null;

  createTrip: (input: CreateTripInput) => string;
  deleteTrip: (id: string) => void;
  renameTrip: (id: string, title: string) => void;
  selectTrip: (id: string | null) => void;

  addItem: (date: string, input: AddItemInput) => string;
  updateItem: (date: string, itemId: string, patch: Partial<Omit<ScheduleItem, 'id'>>) => void;
  removeItem: (date: string, itemId: string) => void;
};

/** 활성 여행의 특정 날짜 items를 불변 업데이트 */
function mapActiveDayItems(
  state: TripState,
  date: string,
  fn: (items: ScheduleItem[]) => ScheduleItem[],
): Partial<TripState> {
  return {
    trips: state.trips.map((trip) =>
      trip.id !== state.activeTripId
        ? trip
        : {
            ...trip,
            days: trip.days.map((day) =>
              day.date !== date ? day : { ...day, items: fn(day.items) },
            ),
          },
    ),
  };
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      trips: [],
      activeTripId: null,

      createTrip: ({ title, startDate, endDate }) => {
        const id = newId();
        const trip: Trip = { id, title, startDate, endDate, days: buildDays(startDate, endDate) };
        set((s) => ({ trips: [...s.trips, trip], activeTripId: id }));
        return id;
      },

      deleteTrip: (id) =>
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          activeTripId: s.activeTripId === id ? null : s.activeTripId,
        })),

      renameTrip: (id, title) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      selectTrip: (id) => set({ activeTripId: id }),

      addItem: (date, input) => {
        const item: ScheduleItem = {
          id: newId(),
          time: input.time,
          locationName: input.locationName,
          displayName: input.displayName,
          category: input.category,
          notes: input.notes?.trim() || '상세 메모가 아직 작성되지 않았습니다.',
          x: input.x,
          y: input.y,
        };
        set((s) => mapActiveDayItems(s, date, (items) => [...items, item]));
        return item.id;
      },

      updateItem: (date, itemId, patch) =>
        set((s) =>
          mapActiveDayItems(s, date, (items) =>
            items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
          ),
        ),

      removeItem: (date, itemId) =>
        set((s) =>
          mapActiveDayItems(s, date, (items) => items.filter((it) => it.id !== itemId)),
        ),
    }),
    {
      name: 'plan-for-j/trips',
      version: 1,
      // v0(구버전: title 사용, displayName 없음) → v1 정규화
      migrate: (persisted, version) => {
        const state = persisted as { trips?: Trip[]; activeTripId?: string | null };
        if (version < 1 && Array.isArray(state.trips)) {
          state.trips = state.trips.map((trip) => ({
            ...trip,
            days: trip.days.map((day) => ({
              ...day,
              items: day.items.map((it) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const raw = it as any;
                const item: ScheduleItem = {
                  id: raw.id,
                  time: raw.time,
                  locationName: raw.locationName ?? raw.title ?? '',
                  displayName: raw.displayName ?? '',
                  category: raw.category,
                  notes: raw.notes ?? '',
                  x: raw.x ?? 250,
                  y: raw.y ?? 250,
                };
                if (raw.location) item.location = raw.location;
                return item;
              }),
            })),
          }));
        }
        return state as TripState;
      },
    },
  ),
);

/** 현재 활성 여행묶음 (없으면 null) */
export const selectActiveTrip = (s: TripState): Trip | null =>
  s.trips.find((t) => t.id === s.activeTripId) ?? null;
