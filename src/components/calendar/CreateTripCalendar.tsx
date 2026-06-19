import { useMemo, useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { buildMonthsForward } from '../../lib/calendar';
import { eachDateInRange, todayISO } from '../../lib/dates';
import { Icon } from '../icons/Icon';
import { CalendarBoard } from './CalendarBoard';

type Props = {
  onCancel?: () => void;
  onCreated?: () => void;
};

const MONTHS_AHEAD = 12;

export function CreateTripCalendar({ onCancel, onCreated }: Props) {
  const createTrip = useTripStore((s) => s.createTrip);
  const minDate = todayISO();
  const months = useMemo(() => buildMonthsForward(minDate, MONTHS_AHEAD), [minDate]);

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const ready = Boolean(start && end);
  const nights = useMemo(
    () => (start && end ? eachDateInRange(start, end).length - 1 : 0),
    [start, end],
  );
  const defaultTitle = ready ? `${start!.slice(5)} ~ ${end!.slice(5)} 여행` : '';

  const handlePick = (date: string) => {
    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
      return;
    }
    if (date < start) {
      setStart(date);
      return;
    }
    if (date === start) return;
    setEnd(date);
  };

  const guidance = !start
    ? '가는 날을 선택하세요'
    : !end
      ? '오는 날을 선택하세요'
      : `${nights}박 ${nights + 1}일 일정`;

  const handleCreate = () => {
    if (!start || !end) return;
    createTrip({ title: title.trim() || defaultTitle, startDate: start, endDate: end });
    onCreated?.();
  };

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Icon name="compass" className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MAPLANNER
              </h1>
              <p className="text-xs text-slate-400">비주얼 지도로 그리는 나의 똑똑한 여행</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition py-2 px-3 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-700"
            >
              <Icon name="arrow-left" className="w-3.5 h-3.5" />
              여행 목록
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <div className="inline-flex p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-2">
              <Icon name="calendar" className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">생성할 일정을 선택해주세요</h2>
            <p className="text-slate-400 text-sm mt-1.5">
              달력에서 <span className="text-indigo-300 font-semibold">가는 날</span>과{' '}
              <span className="text-indigo-300 font-semibold">오는 날</span>을 선택하세요.
            </p>
          </div>

          <CalendarBoard mode="range" months={months} start={start} end={end} minDate={minDate} onPick={handlePick} />
        </div>
      </main>

      {/* 하단 바 (화면 내 고정 · 비겹침) */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-900/95 pb-safe">
        <div className="max-w-5xl mx-auto px-3 py-3 space-y-2">
          {ready && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              aria-label="여행 이름"
              className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-sm text-white"
            />
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  start ? 'bg-indigo-500/20 text-indigo-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {start ? start.slice(5).replace('-', '/') : '가는날'}
              </span>
              <Icon name="arrow-right" className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span
                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  end ? 'bg-indigo-500/20 text-indigo-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {end ? end.slice(5).replace('-', '/') : '오는날'}
              </span>
              <span className="text-xs text-indigo-300 font-medium truncate ml-0.5">{guidance}</span>
            </div>

            <button
              onClick={handleCreate}
              disabled={!ready}
              className={`shrink-0 py-2.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 transition ${
                ready
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              여행 만들기
              <Icon name="arrow-right" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
