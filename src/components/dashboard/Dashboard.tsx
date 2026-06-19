import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTripStore, selectActiveTrip } from '../../store/tripStore';
import { CATEGORIES, SEOUL_LANDMARKS } from '../../lib/categories';
import { todayISO } from '../../lib/dates';
import { scheduleName, type ScheduleItem } from '../../types';
import { Icon } from '../icons/Icon';
import { MapPanel } from '../map/MapPanel';
import { DayTabs } from './DayTabs';
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
  x: 250,
  y: 250,
  notes: '',
};

const toForm = (item: ScheduleItem): ScheduleFormState => ({
  time: item.time,
  locationName: item.locationName,
  displayName: item.displayName ?? '',
  category: item.category,
  x: item.x,
  y: item.y,
  notes: item.notes,
});

const sortByTime = <T extends { time: string }>(list: T[]): T[] =>
  [...list].sort((a, b) => a.time.localeCompare(b.time));

const randomCoord = () => Math.floor(Math.random() * 300) + 100;

export function Dashboard() {
  const trip = useTripStore(selectActiveTrip);
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

  const patchForm = (patch: Partial<ScheduleFormState>) => setForm((f) => ({ ...f, ...patch }));

  const days = trip?.days ?? [];
  const safeIndex = activeDayIndex < days.length ? activeDayIndex : 0;
  const activeDay = days[safeIndex] ?? null;

  const schedules = useMemo(() => sortByTime(activeDay?.items ?? []), [activeDay]);
  const activeSchedule = useMemo(
    () => schedules.find((s) => s.id === activeScheduleId) ?? null,
    [schedules, activeScheduleId],
  );
  const totalPlaces = useMemo(() => days.reduce((acc, d) => acc + d.items.length, 0), [days]);
  const tripId = trip?.id;

  // 여행 전환 시 첫째 날로
  useEffect(() => {
    setActiveDayIndex(0);
  }, [tripId]);

  // 날짜(또는 여행) 전환 시 편집기 초기화: 일정 있으면 첫 일정 조회, 없으면 추가 모드
  useEffect(() => {
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
    setActiveScheduleId(id);
    setEditorMode('view');
    setForm(toForm(item));
  };

  const handleEnterEdit = () => {
    if (activeScheduleId) setEditorMode('edit');
  };

  const handleCancelEdit = () => {
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
    setActiveScheduleId('');
    setEditorMode('add');
    setForm({ ...BLANK_FORM, x: randomCoord(), y: randomCoord() });
  };

  const handleSubmit = (e: FormEvent) => {
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
      x: form.x,
      y: form.y,
    };
    if (editorMode === 'add') {
      const id = addItem(activeDay.date, payload);
      setActiveScheduleId(id);
      setEditorMode('view');
    } else if (activeScheduleId) {
      updateItem(activeDay.date, activeScheduleId, payload);
      setEditorMode('view');
    }
  };

  const handleDelete = () => {
    if (!activeScheduleId) return;
    const remaining = sortByTime(activeDay.items.filter((i) => i.id !== activeScheduleId));
    removeItem(activeDay.date, activeScheduleId);
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

  const handleSelectPreset = (landmark: (typeof SEOUL_LANDMARKS)[number]) => {
    patchForm({
      locationName: landmark.name,
      category: landmark.category,
      x: landmark.x,
      y: landmark.y,
    });
  };

  const handleMapClick = (x: number, y: number) => {
    if (editorMode === 'view') setEditorMode('edit');
    patchForm({
      x,
      y,
      locationName: form.locationName.trim() ? form.locationName : '지도 지정 장소',
    });
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
  const mapFocus = activeSchedule ?? schedules[0] ?? null;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* Row A: 로고 + 여행 제목 + 캘린더 보기 + 목록 */}
          <div className="flex items-center gap-2 py-2.5">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-lg text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Icon name="compass" className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base font-bold text-white truncate">{trip.title}</div>
              <div className="text-[11px] text-slate-400 truncate">
                {trip.startDate} ~ {trip.endDate} · {days.length}일
              </div>
            </div>

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-1.5 shrink-0 py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition active:scale-95"
              title="통합 달력 보기"
            >
              <Icon name="calendar" className="w-4 h-4" />
              <span>캘린더</span>
            </button>

            <button
              onClick={() => selectTrip(null)}
              className="flex items-center gap-1 shrink-0 py-1.5 px-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 text-xs transition"
              title="여행 목록"
            >
              <Icon name="arrow-left" className="w-4 h-4" />
              <span className="hidden sm:inline">목록</span>
            </button>
          </div>

          {/* Row B: Day 탭 (고정) */}
          <div className="pb-2">
            <DayTabs days={days} activeIndex={safeIndex} onSelect={handleSelectDay} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
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

            {/* 병합된 일정 조회/수정 · 추가 패널 */}
            <ScheduleEditor
              mode={editorMode}
              form={form}
              onPatch={patchForm}
              onSubmit={handleSubmit}
              onSelectPreset={handleSelectPreset}
              onDelete={handleDelete}
              onEnterEdit={handleEnterEdit}
              onCancelEdit={handleCancelEdit}
            />
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md">
                    <Icon name="map-pin" className="w-5 h-5" />
                  </span>
                  <h4 className="font-bold text-white">경로 지도</h4>
                </div>
                <span className="text-[10px] bg-slate-900 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  MAPLANNER ENGINE
                </span>
              </div>

              <MapPanel
                schedules={schedules}
                activeScheduleId={activeScheduleId}
                newX={form.x}
                newY={form.y}
                dayLabel={dayLabel}
                onMapClick={handleMapClick}
                onPinClick={selectSchedule}
              />

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">현재 지도 포커스</span>
                  {mapFocus ? (
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-indigo-400 text-sm flex items-center gap-1">
                        <Icon name="map-pin" className="w-4 h-4" />
                        {scheduleName(mapFocus)}
                      </h5>
                      <p className="text-xs text-slate-300 line-clamp-1">{CATEGORIES[mapFocus.category].label}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">등록된 일정이 없습니다.</span>
                  )}
                </div>
                <div className="text-right text-xs shrink-0">
                  <span className="text-slate-500">배치 좌표</span>
                  <div className="font-mono text-slate-200 font-semibold">
                    {mapFocus ? `X:${mapFocus.x} / Y:${mapFocus.y}` : '- / -'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">총 여행 일수</span>
                  <strong className="text-base text-white">{days.length}일</strong>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">등록된 전체 명소</span>
                  <strong className="text-base text-white">{totalPlaces}곳</strong>
                </div>
              </div>
            </div>
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
