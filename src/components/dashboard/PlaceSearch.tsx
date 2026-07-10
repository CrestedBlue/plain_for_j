import { useState, type KeyboardEvent } from 'react';
import { CATEGORIES } from '../../lib/categories';
import { searchPlaces, type PlaceResult } from '../../lib/places';
import { Icon } from '../icons/Icon';

type Props = {
  /** 결과를 지도에서 확인(패닝 + 임시 핀). 폼은 절대 건드리지 않는다. */
  onExplore: (place: PlaceResult) => void;
  /** 이 결과로 새 일정을 추가(add 모드 진입 + 폼 채움). */
  onAddAsNew: (place: PlaceResult) => void;
  /** 편집 중인 일정의 장소를 이 결과로 교체. 편집 모드에서만 노출. */
  onApplyToForm?: (place: PlaceResult) => void;
  /** 현재 추가/수정(편집) 모드인지 — true면 "이 장소로 변경" 버튼 노출. */
  isEditing: boolean;
  /**
   * 외부(지도 클릭 자동 검색)에서 주입한 결과.
   * 자체 검색 결과보다 우선 표시하며, 배너에 원본 질의도 함께 노출.
   */
  externalResults?: PlaceResult[];
  externalQuery?: string;
};

/**
 * 지도 탐색용 인라인 검색창(지도 카드 하단).
 *
 * 이 검색창은 "둘러보기" 도구다 — 결과를 눌러도 일정이 바뀌지 않는다.
 * - 결과 본문 탭 → 지도에서 위치 확인(패닝 + 임시 핀).
 * - [＋ 새 일정] → 이 장소로 새 일정 추가.
 * - [이 장소로 변경] → (편집 중일 때만) 편집 폼의 장소를 교체.
 *
 * 폼의 장소명 필드에도 자동완성 검색이 있으므로, 이 창은 지도를 보며 후보를 비교할 때 쓴다.
 */
export function PlaceSearch({
  onExplore,
  onAddAsNew,
  onApplyToForm,
  isEditing,
  externalResults,
  externalQuery,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // 외부 주입 결과가 있으면 그것을 우선 표시.
  const displayResults = externalResults && externalResults.length > 0 ? externalResults : results;
  const showExternal = !!externalResults && externalResults.length > 0;

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setTouched(true);
    try {
      const out = await searchPlaces(q);
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : '검색 실패');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-xl space-y-3">
      <div className="flex items-center gap-2">
        <span className="p-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md">
          <Icon name="map-pin" className="w-4 h-4" />
        </span>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">지도에서 장소 찾기</h4>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">네이버 지역검색 · 상위 5곳</span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        결과를 누르면 <strong className="text-slate-700 dark:text-slate-300">지도에서 위치</strong>를 확인하고,{' '}
        <strong className="text-sky-600 dark:text-sky-400">＋</strong> 로 일정에 추가합니다.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 여의도 한강공원, 스타벅스 홍대점"
          className="flex-1 px-3 py-2 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 rounded-lg focus:border-indigo-500 outline-none text-sm"
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading || !query.trim()}
          className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? '검색 중…' : '검색'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
          <Icon name="info" className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {showExternal && (
        <p className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-1 rounded-md">
          <Icon name="map-pin" className="w-3.5 h-3.5" />
          지도 클릭 위치 근처 검색{externalQuery ? ` · "${externalQuery}"` : ''}
        </p>
      )}

      {touched && !loading && !error && results.length === 0 && !showExternal && (
        <p className="text-xs text-slate-500">결과가 없습니다.</p>
      )}

      {displayResults.length > 0 && (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {displayResults.map((r, i) => {
            const catInfo = (CATEGORIES as Record<string, { label: string; color: string }>)[r.category];
            const noCoord = r.lat === 0 && r.lng === 0;
            return (
              <li
                key={`${r.name}-${r.address}-${i}`}
                className="flex items-stretch gap-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onExplore(r)}
                  disabled={noCoord}
                  title={noCoord ? '좌표 정보가 없어 지도에 표시할 수 없습니다' : '지도에서 위치 보기'}
                  className="flex-1 min-w-0 text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    {catInfo && (
                      <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded ${catInfo.color} text-white shrink-0`}>
                        {catInfo.label}
                      </span>
                    )}
                    <span className="text-sm text-slate-900 dark:text-white font-semibold truncate">{r.name}</span>
                    {noCoord && <span className="text-[10px] text-slate-400 shrink-0">좌표 없음</span>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {r.address || '주소 정보 없음'}
                  </div>
                </button>

                <div className="flex flex-col shrink-0 border-l border-slate-200 dark:border-slate-700/60">
                  {isEditing && onApplyToForm && (
                    <button
                      type="button"
                      onClick={() => onApplyToForm(r)}
                      title="편집 중인 일정의 장소를 이 결과로 변경"
                      className="flex-1 px-2.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition whitespace-nowrap"
                    >
                      변경
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAddAsNew(r)}
                    title="이 장소로 새 일정 추가"
                    className={`flex items-center justify-center gap-0.5 px-2.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition whitespace-nowrap ${
                      isEditing && onApplyToForm ? 'flex-1 border-t border-slate-200 dark:border-slate-700/60' : 'flex-1'
                    }`}
                  >
                    <Icon name="plus" className="w-3.5 h-3.5" />
                    추가
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
