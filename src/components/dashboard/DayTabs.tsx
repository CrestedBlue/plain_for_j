import type { Day } from '../../types';

type Props = {
  days: Day[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function DayTabs({ days, activeIndex, onSelect }: Props) {
  return (
    <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 shadow-md flex gap-1 overflow-x-auto scrollbar-none">
      {days.map((day, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={day.date}
            onClick={() => onSelect(index)}
            className={`py-2 px-3 rounded-lg text-center font-bold text-xs min-w-[64px] transition duration-200 whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
            }`}
          >
            <div>Day {index + 1}</div>
            <div className="text-[10px] font-normal opacity-75 mt-0.5">{day.date.slice(5)}</div>
          </button>
        );
      })}
    </div>
  );
}
