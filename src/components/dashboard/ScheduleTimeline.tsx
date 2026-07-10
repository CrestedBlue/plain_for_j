import { useEffect, useRef } from 'react';
import { scheduleName, type ScheduleItem } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { Icon } from '../icons/Icon';

type Props = {
  schedules: ScheduleItem[];
  activeScheduleId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ScheduleTimeline({ schedules, activeScheduleId, onSelect, onDelete }: Props) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  // 활성 일정이 바뀌면(추가/선택) 해당 카드가 뷰포트 안으로 들어오도록 부드럽게 스크롤.
  useEffect(() => {
    if (!activeScheduleId || !activeRef.current) return;
    activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeScheduleId]);

  if (schedules.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 text-center border border-dashed border-slate-300 dark:border-slate-700/60">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mx-auto mb-2">
          <Icon name="map-pin" className="w-5 h-5" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">등록된 일정이 없습니다.</p>
        <p className="text-xs text-slate-500 mt-0.5">“일정 추가”로 첫 일정을 넣어보세요.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-slate-700/60 ml-3 pl-5 space-y-2">
      {schedules.map((item) => {
        const isActive = item.id === activeScheduleId;
        const catInfo = CATEGORIES[item.category];
        return (
          <div
            key={item.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(item.id)}
            className={`relative group cursor-pointer p-2.5 rounded-lg border transition-colors ${
              isActive
                ? 'bg-indigo-50 border-indigo-400 dark:bg-slate-800 dark:border-indigo-500/80'
                : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700/50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span
              className={`absolute -left-[27px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-4 border-white dark:border-slate-900 ${
                isActive ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : catInfo?.color || 'bg-slate-400 dark:bg-slate-600'
              }`}
            />

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 flex items-center gap-2.5">
                <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950/40 px-1.5 py-0.5 rounded shrink-0">
                  <Icon name="clock" className="w-3 h-3" />
                  {item.time}
                </span>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-semibold truncate ${
                      isActive
                        ? 'text-indigo-700 dark:text-indigo-400'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {scheduleName(item)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catInfo?.color}`} />
                    {(item.displayName ?? '').trim() ? item.locationName : catInfo?.label}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                title="삭제"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
