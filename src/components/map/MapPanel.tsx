import type { ScheduleItem } from '../../types';
import { NaverMap } from './NaverMap';

type Props = {
  schedules: ScheduleItem[];
  activeScheduleId: string;
  /** 편집 중인 폼의 위경도(있으면 지도에 임시 핀으로 표시). 없으면 0/0. */
  newLat?: number;
  newLng?: number;
  dayLabel: string;
  onPinClick: (id: string) => void;
};

const NAVER_MAP_CLIENT_ID: string = import.meta.env.VITE_NAVER_MAP_CLIENT_ID ?? '';

export function MapPanel({
  schedules,
  activeScheduleId,
  newLat = 0,
  newLng = 0,
  dayLabel,
  onPinClick,
}: Props) {
  return (
    <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner group">
      <NaverMap
        clientId={NAVER_MAP_CLIENT_ID}
        schedules={schedules}
        activeScheduleId={activeScheduleId}
        dayKey={dayLabel}
        newLat={newLat}
        newLng={newLng}
        onPinClick={onPinClick}
      />

      <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none z-10 shadow">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span>{dayLabel} 실시간 루트</span>
      </div>
    </div>
  );
}
