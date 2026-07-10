import type { CalendarMonth } from '../../lib/calendar';
import { addDaysISO } from '../../lib/dates';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type CommonProps = {
  months: CalendarMonth[];
  onPick: (dateString: string) => void;
};

type RangeProps = CommonProps & {
  mode: 'range';
  start: string | null;
  end: string | null;
  minDate?: string;
};

type ViewProps = CommonProps & {
  mode: 'view';
  tripIndex: Map<string, number>;
};

type Props = RangeProps | ViewProps;

/** 네이버 항공권 스타일 범위 선택 + 여행일 묶음 표시를 겸하는 공유 캘린더 */
export function CalendarBoard(props: Props) {
  const colsClass = props.mode === 'view' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-5`}>
      {props.months.map((month) => (
        <section
          key={`${month.year}-${month.month}`}
          className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80"
        >
          <div className="text-center pb-3 mb-3 border-b border-slate-200 dark:border-slate-800/60">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {month.year}년 {month.month}월
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 mb-2">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-500' : ''}>
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {month.days.map((slot, dIdx) =>
              slot.dayNum && slot.dateString ? (
                <DayCell key={slot.dateString} date={slot.dateString} dayNum={slot.dayNum} col={dIdx % 7} props={props} />
              ) : (
                <div key={`empty-${month.month}-${dIdx}`} className="aspect-square" />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function DayCell({
  date,
  dayNum,
  col,
  props,
}: {
  date: string;
  dayNum: number;
  col: number;
  props: Props;
}) {
  if (props.mode === 'range') {
    const { start, end, minDate, onPick } = props;
    const disabled = minDate ? date < minDate : false;
    const isStart = date === start;
    const isEnd = date === end;
    const inRange = Boolean(start && end && date > start && date < end);
    const selected = isStart || isEnd;

    if (disabled) {
      return (
        <div className="aspect-square flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 cursor-not-allowed">
          {dayNum}
        </div>
      );
    }

    const roundLeft = isStart || (inRange && col === 0);
    const roundRight = isEnd || (inRange && col === 6);
    const onlyStart = isStart && !end;

    const base = 'aspect-square flex flex-col items-center justify-center text-xs relative cursor-pointer transition';
    let style = 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg';
    if (selected) {
      style = `bg-indigo-500 text-white font-bold ${
        onlyStart ? 'rounded-lg' : roundLeft ? 'rounded-l-lg' : roundRight ? 'rounded-r-lg' : ''
      }`;
    } else if (inRange) {
      style = `bg-indigo-500/25 text-indigo-900 dark:text-indigo-100 ${roundLeft ? 'rounded-l-lg' : ''} ${roundRight ? 'rounded-r-lg' : ''}`;
    }

    return (
      <button type="button" onClick={() => onPick(date)} className={`${base} ${style}`}>
        <span>{dayNum}</span>
        {isStart && <span className="text-[8px] font-semibold leading-none mt-0.5">가는날</span>}
        {isEnd && <span className="text-[8px] font-semibold leading-none mt-0.5">오는날</span>}
      </button>
    );
  }

  const { tripIndex, onPick } = props;
  const idx = tripIndex.get(date);
  const isTrip = idx !== undefined;

  if (!isTrip) {
    return (
      <div className="aspect-square flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500">
        {dayNum}
      </div>
    );
  }

  const isRunStart = !tripIndex.has(addDaysISO(date, -1)) || col === 0;
  const isRunEnd = !tripIndex.has(addDaysISO(date, 1)) || col === 6;
  const rounding = `${isRunStart ? 'rounded-l-lg border-l' : ''} ${isRunEnd ? 'rounded-r-lg border-r' : ''}`;

  return (
    <button
      type="button"
      onClick={() => onPick(date)}
      className={`aspect-square flex flex-col items-center justify-center text-xs font-semibold relative cursor-pointer bg-gradient-to-tr from-indigo-600 to-sky-500 text-white border-y border-indigo-400/40 hover:brightness-110 transition ${rounding}`}
    >
      <span>{dayNum}</span>
      <span className="absolute bottom-0.5 text-[8px] font-black opacity-90 text-sky-200">D-{idx + 1}</span>
    </button>
  );
}
