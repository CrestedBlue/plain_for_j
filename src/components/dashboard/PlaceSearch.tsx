import { useState, type KeyboardEvent } from 'react';
import { CATEGORIES } from '../../lib/categories';
import { searchPlaces, type PlaceResult } from '../../lib/places';
import { Icon } from '../icons/Icon';

type Props = {
  onSelect: (place: PlaceResult) => void;
  /**
   * 외부(예: 지도 클릭 자동 검색)에서 주입한 결과.
   * 자체 검색 결과보다 우선 표시하며, 검색 배너에 원본 질의도 함께 노출.
   */
  externalResults?: PlaceResult[];
  externalQuery?: string;
};

/**
 * 네이버 지역검색 인라인 검색창.
 * 지도 카드 하단에 배치되어, 검색 결과 선택 시 편집 폼(장소명·카테고리·좌표·위경도)에 반영된다.
 * 지도(NaverMap)는 form.location.lat/lng 변경을 감지해 임시 핀·panTo까지 자동 처리한다.
 */
export function PlaceSearch({ onSelect, externalResults, externalQuery }: Props) {
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

  const handlePick = (p: PlaceResult) => {
    onSelect(p);
    // 결과 목록은 유지(다른 후보를 다시 고를 수 있게), 다음 검색을 위해 쿼리만 비운다.
    setQuery('');
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-xl space-y-3">
      <div className="flex items-center gap-2">
        <span className="p-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-md">
          <Icon name="map-pin" className="w-4 h-4" />
        </span>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">장소 검색</h4>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
          네이버 지역검색 · 상위 5곳
        </span>
      </div>

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
        <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {displayResults.map((r, i) => {
            const catInfo = (CATEGORIES as Record<string, { label: string; color: string }>)[r.category];
            return (
              <li key={`${r.name}-${r.address}-${i}`}>
                <button
                  type="button"
                  onClick={() => handlePick(r)}
                  className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg transition"
                >
                  <div className="flex items-center gap-2">
                    {catInfo && (
                      <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded ${catInfo.color} text-white`}>
                        {catInfo.label}
                      </span>
                    )}
                    <span className="text-sm text-slate-900 dark:text-white font-semibold truncate">{r.name}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {r.address || '주소 정보 없음'}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
