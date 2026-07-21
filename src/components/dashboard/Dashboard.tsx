import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTripStore } from '../../store/tripStore';
import { todayISO } from '../../lib/dates';
import { type PlaceResult } from '../../lib/places';
import { useTheme } from '../../lib/theme';
import type { GeoLocation, ScheduleItem } from '../../types';
import { Icon } from '../icons/Icon';
import { MapPanel } from '../map/MapPanel';
import { DayTabs } from './DayTabs';
import { PlaceSearch } from './PlaceSearch';
import { ScheduleTimeline } from './ScheduleTimeline';
import {
  ScheduleEditor,
  type EditorMode,
  type ScheduleFormState,
} from './ScheduleEditor';
import { CalendarModal } from './CalendarModal';

const BLANK_FORM: ScheduleFormState = {
  time: '12:00',
  locationName: '',
  displayName: '',
  category: 'sightseeing',
  notes: '',
};

const toForm = (item: ScheduleItem): ScheduleFormState => ({
  time: item.time,
  locationName: item.locationName,
  displayName: item.displayName ?? '',
  category: item.category,
  notes: item.notes,
  location: item.location,
});

const isValidLatLng = (loc?: GeoLocation): loc is GeoLocation =>
  !!loc && !(loc.lat === 0 && loc.lng === 0);

const sortByTime = <T extends { time: string }>(list: T[]): T[] =>
  [...list].sort((a, b) => a.time.localeCompare(b.time));

export function Dashboard() {
  const trip = useTripStore((s) => s.activeTrip);
  const selectTrip = useTripStore((s) => s.selectTrip);
  const renameTrip = useTripStore((s) => s.renameTrip);
  const addItem = useTripStore((s) => s.addItem);
  const updateItem = useTripStore((s) => s.updateItem);
  const removeItem = useTripStore((s) => s.removeItem);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeScheduleId, setActiveScheduleId] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('add');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [form, setForm] = useState<ScheduleFormState>(BLANK_FORM);
  // 탐색용 임시 위치(폼과 무관). 검색 결과 탐색 시 세팅 → 지도에 점선 핀 표시.
  const [exploreLocation, setExploreLocation] = useState<GeoLocation | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const editorSectionRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const patchForm = (patch: Partial<ScheduleFormState>) => setForm((f) => ({ ...f, ...patch }));

  const days = trip?.days ?? [];
  const safeIndex = activeDayIndex < days.length ? activeDayIndex : 0;
  const activeDay = days[safeIndex] ?? null;

  const schedules = useMemo(() => sortByTime(activeDay?.items ?? []), [activeDay]);
  const totalPlaces = useMemo(() => days.reduce((acc, d) => acc + d.items.length, 0), [days]);
  const tripId = trip?.id;

  useEffect(() => {
    setActiveDayIndex(0);
  }, [tripId]);

  // 활성 일정이 바뀌면 모바일에서 지도 영역이 화면에 들어오도록 스크롤.
  useEffect(() => {
    if (!activeScheduleId || !mapSectionRef.current) return;
    if (typeof window === 'undefined') return;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) return;
    mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeScheduleId]);

  useEffect(() => {
    setExploreLocation(null);
    const items = sortByTime(days[safeIndex]?.items ?? []);
    if (items.length > 0) {
      setActiveScheduleId(items[0].id);
      setEditorMode('view');
      setForm(toForm(items[0]));
    } else {
      setActiveScheduleId('');
      setEditorMode('add');
      setForm({ ...BLANK_FORM });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, tripId]);

  if (!trip || !activeDay) return null;

  const selectSchedule = (id: string) => {
    const item = activeDay.items.find((i) => i.id === id);
    if (!item) return;
    setExploreLocation(null);
    setActiveScheduleId(id);
    setEditorMode('view');
    setForm(toForm(item));
  };

  const handleEnterEdit = () => {
    if (activeScheduleId) setEditorMode('edit');
  };

  const handleCancelEdit = () => {
    setExploreLocation(null);
    const item = activeDay.items.find((i) => i.id === activeScheduleId);
    if (item) {
      setForm(toForm(item));
      setEditorMode('view');
    } else {
      setEditorMode('add');
      setForm({ ...BLANK_FORM });
    }
  };

  const handleSelectDay = (index: number) => setActiveDayIndex(index);

  const handleStartAdd = () => {
    setExploreLocation(null);
    setActiveScheduleId('');
    setEditorMode('add');
    setForm({ ...BLANK_FORM });
  };

  const scrollMapIntoViewOnMobile = () => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollEditorIntoViewOnMobile = () => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toLocation = (place: PlaceResult): GeoLocation | undefined =>
    place.lat !== 0 || place.lng !== 0 ? { name: place.name, lat: place.lat, lng: place.lng } : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.locationName.trim()) {
      alert('장소명을 입력해주세요!');
      return;
    }
    const payload = {
      time: form.time,
      locationName: form.locationName.trim(),
      displayName: form.displayName.trim(),
      category: form.category,
      notes: form.notes,
      location: isValidLatLng(form.location) ? form.location : undefined,
    };
    setExploreLocation(null);
    if (editorMode === 'add') {
      const id = await addItem(activeDay.date, payload);
      if (id) {
        setActiveScheduleId(id);
        setEditorMode('view');
      }
    } else if (activeScheduleId) {
      await updateItem(activeDay.date, activeScheduleId, payload);
      setEditorMode('view');
    }
  };

  const handleDelete = async () => {
    if (!activeScheduleId) return;
    setExploreLocation(null);
    const remaining = sortByTime(activeDay.items.filter((i) => i.id !== activeScheduleId));
    await removeItem(activeDay.date, activeScheduleId);
    if (remaining[0]) {
      setActiveScheduleId(remaining[0].id);
      setEditorMode('view');
      setForm(toForm(remaining[0]));
    } else {
      setActiveScheduleId('');
      setEditorMode('add');
      setForm({ ...BLANK_FORM });
    }
  };

  // 폼(장소명 자동완성 · 검색결과 "변경")에서 장소를 골랐을 때: 이름·위경도 반영.
  const applyPlaceToForm = (place: PlaceResult) => {
    patchForm({
      locationName: place.name,
      location: toLocation(place),
    });
  };

  // 탐색: 지도만 이동 + 임시 핀. 폼/모드 불변.
  const handleExplorePlace = (place: PlaceResult) => {
    const loc = toLocation(place);
    if (!loc) return;
    setExploreLocation(loc);
    scrollMapIntoViewOnMobile();
  };

  // "새 일정으로 추가": add 모드 진입 + 이 장소로 폼 채움.
  const handleAddPlaceAsNew = (place: PlaceResult) => {
    setExploreLocation(null);
    setActiveScheduleId('');
    setEditorMode('add');
    setForm({
      ...BLANK_FORM,
      locationName: place.name,
      location: toLocation(place),
    });
    scrollEditorIntoViewOnMobile();
  };

  // "이 장소로 변경": 편집 중인 폼의 장소를 이 결과로 교체.
  const handleApplyPlaceFromSearch = (place: PlaceResult) => {
    setExploreLocation(null);
    applyPlaceToForm(place);
    scrollEditorIntoViewOnMobile();
  };

  const handleCalendarDayClick = (dateString: string) => {
    const idx = days.findIndex((d) => d.date === dateString);
    if (idx >= 0) {
      setActiveDayIndex(idx);
      setIsCalendarOpen(false);
    }
  };

  const dayLabel = `Day ${safeIndex + 1}`;
  const calendarCenter = totalPlaces > 0 ? trip.startDate : todayISO();
  const isEditing = editorMode !== 'view';
  // 지도의 점선(임시) 핀 위치: 탐색 중이면 탐색 위치, 편집 중이면 폼 위치, 그 외 없음.
  const pinLocation = exploreLocation ?? (isEditing ? form.location ?? null : null);

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-2 py-2.5">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-lg text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Icon name="compass" className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">{trip.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {trip.startDate} ~ {trip.endDate} · {days.length}일
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 transition active:scale-95"
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              aria-label="테마 전환"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-1.5 shrink-0 py-1.5 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition active:scale-95"
              title="통합 달력 보기"
            >
              <Icon name="calendar" className="w-4 h-4" />
              <span>캘린더</span>
            </button>

            <button
              onClick={() => selectTrip(null)}
              className="flex items-center gap-1 shrink-0 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs transition"
              title="여행 목록"
            >
              <Icon name="arrow-left" className="w-4 h-4" />
              <span className="hidden sm:inline">목록</span>
            </button>
          </div>

          <div className="pb-2">
            <DayTabs days={days} activeIndex={safeIndex} onSelect={handleSelectDay} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
                {dayLabel} 일정
              </h3>
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 py-2 px-3.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-sky-600/20 transition"
              >
                <Icon name="plus" className="w-4 h-4" />
                일정 추가
              </button>
            </div>

            <ScheduleTimeline
              schedules={schedules}
              activeScheduleId={activeScheduleId}
              onSelect={selectSchedule}
              onDelete={(id) => {
                if (id === activeScheduleId) handleDelete();
                else removeItem(activeDay.date, id);
              }}
            />

            <div ref={editorSectionRef} className="scroll-mt-24">
              <ScheduleEditor
                mode={editorMode}
                form={form}
                onPatch={patchForm}
                onSelectPlace={applyPlaceToForm}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                onEnterEdit={handleEnterEdit}
                onCancelEdit={handleCancelEdit}
              />
            </div>
          </div>

          <div ref={mapSectionRef} className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 scroll-mt-24">
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                    <Icon name="map-pin" className="w-5 h-5" />
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white">경로 지도</h4>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  MAPLANNER ENGINE
                </span>
              </div>

              <MapPanel
                schedules={schedules}
                activeScheduleId={activeScheduleId}
                newLat={pinLocation?.lat ?? 0}
                newLng={pinLocation?.lng ?? 0}
                dayLabel={dayLabel}
                onPinClick={selectSchedule}
              />
            </div>

            {/* 지도 아래: 지도 탐색용 검색. 결과 탭=지도에서 위치 확인(폼 불변),
                ＋=새 일정 추가, (편집 중일 때) 변경=편집 폼 장소 교체. */}
            <PlaceSearch
              onExplore={handleExplorePlace}
              onAddAsNew={handleAddPlaceAsNew}
              onApplyToForm={handleApplyPlaceFromSearch}
              isEditing={isEditing}
            />
          </div>
        </div>
      </main>

      {isCalendarOpen && (
        <CalendarModal
          travelTitle={trip.title}
          startDate={trip.startDate}
          endDate={trip.endDate}
          days={days}
          centerDate={calendarCenter}
          onClose={() => setIsCalendarOpen(false)}
          onDayClick={handleCalendarDayClick}
          onRename={(title) => renameTrip(trip.id, title)}
        />
      )}
    </>
  );
}
