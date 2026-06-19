import { useMemo } from 'react';
import type { Day } from '../../types';
import { buildCalendarMonths } from '../../lib/calendar';
import { Icon } from '../icons/Icon';
import { CalendarBoard } from '../calendar/CalendarBoard';

type Props = {
  travelTitle: string;
  startDate: string;
  endDate: string;
  days: Day[];
  /** 3개월 달력의 중심(가운데 달) 기준일 */
  centerDate: string;
  onClose: () => void;
  onDayClick: (dateString: string) => void;
  onRename: (title: string) => void;
};

export function CalendarModal({
  travelTitle,
  startDate,
  endDate,
  days,
  centerDate,
  onClose,
  onDayClick,
  onRename,
}: Props) {
  const months = useMemo(() => buildCalendarMonths(centerDate), [centerDate]);
  const indexByDate = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((d, i) => map.set(d.date, i));
    return map;
  }, [days]);

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
        >
          <Icon name="x" className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Icon name="calendar" className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">통합 여행 캘린더 대시보드</h3>
            <p className="text-xs text-indigo-400 font-medium mt-0.5">
              전월·해당월·익월의 일정 상황을 한눈에 조망합니다.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider mb-1">
              여행 이름 (클릭해 수정)
            </label>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/60 focus-within:border-indigo-500 rounded-lg px-3 py-1.5 transition">
              <input
                value={travelTitle}
                onChange={(e) => onRename(e.target.value)}
                placeholder="여행 이름"
                aria-label="여행 이름"
                className="flex-1 min-w-0 bg-transparent text-base font-bold text-slate-100 outline-none placeholder:text-slate-600"
              />
              <Icon name="edit" className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-[10px] text-slate-500 block">설정 기간</span>
            <strong className="text-sm text-indigo-400 font-mono">
              {startDate} ~ {endDate} ({days.length} Days)
            </strong>
          </div>
        </div>

        <CalendarBoard mode="view" months={months} tripIndex={indexByDate} onPick={onDayClick} />

        <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-800">
          <span className="inline-block px-3 py-1.5 bg-slate-950/80 rounded-xl text-slate-400">
            💡 컬러링된 여행 묶음의 날짜를 클릭하면 해당 일자의 일정이 메인에 펼쳐집니다.
          </span>
        </div>
      </div>
    </div>
  );
}
