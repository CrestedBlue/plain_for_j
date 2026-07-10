import { useTripStore } from '../../store/tripStore';
import { eachDateInRange } from '../../lib/dates';
import { useTheme } from '../../lib/theme';
import { Icon } from '../icons/Icon';

type Props = {
  onNewTrip: () => void;
};

export function TripList({ onNewTrip }: Props) {
  const trips = useTripStore((s) => s.trips);
  const selectTrip = useTripStore((s) => s.selectTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Icon name="compass" className="w-6 h-6 animate-spin-slow" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black bg-gradient-to-r from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              MAPLANNER
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">비주얼 지도로 그리는 나의 똑똑한 여행</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 transition"
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            aria-label="테마 전환"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">내 여행</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">여행묶음을 선택하거나 새로 만들어 보세요.</p>
          </div>
          <button
            onClick={onNewTrip}
            className="flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            <Icon name="plus" className="w-4 h-4" />
            새 여행 만들기
          </button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
          {trips.map((t) => (
            <li
              key={t.id}
              className="relative bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 group"
            >
              <button onClick={() => selectTrip(t.id)} className="w-full text-left p-6 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Icon name="map-pin" className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {eachDateInRange(t.startDate, t.endDate).length} Days
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  {t.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                  {t.startDate} ~ {t.endDate}
                </p>
              </button>
              <button
                onClick={() => deleteTrip(t.id)}
                aria-label={`${t.title} 삭제`}
                className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
