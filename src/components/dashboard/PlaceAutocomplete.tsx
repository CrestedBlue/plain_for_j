import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CATEGORIES } from '../../lib/categories';
import { searchPlaces, type PlaceResult } from '../../lib/places';

type Props = {
  value: string;
  /** 자유 입력(좌표 없이 이름만 갱신). */
  onChange: (name: string) => void;
  /** 검색 결과 선택 — 부모가 이름·카테고리·위경도를 폼에 반영. */
  onSelectPlace: (place: PlaceResult) => void;
  placeholder?: string;
  inputClassName?: string;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

/**
 * 장소명 입력창 + 자동완성 드롭다운.
 * 타이핑하면 디바운스 후 네이버 지역검색 결과를 아래에 띄우고, 선택 시 좌표·카테고리까지 채운다.
 * 결과를 고르지 않고 자유 입력해도 이름만 저장된다(좌표 없음).
 */
export function PlaceAutocomplete({ value, onChange, onSelectPlace, placeholder, inputClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  // 결과 선택 직후 value 변화로 인한 재검색을 한 번 건너뛰기 위한 플래그.
  const justPickedRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 디바운스 검색.
  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const out = await searchPlaces(q);
        if (cancelled) return;
        setResults(out);
        setOpen(true);
        setHighlight(-1);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [value]);

  // 바깥 클릭 시 드롭다운 닫기.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (place: PlaceResult) => {
    justPickedRef.current = true;
    onSelectPlace(place);
    setOpen(false);
    setResults([]);
    setHighlight(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < results.length) {
        e.preventDefault();
        pick(results[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="place-ac-list"
      />
      {loading && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none">
          검색 중…
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          id="place-ac-list"
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
        >
          {results.map((r, i) => {
            const catInfo = (CATEGORIES as Record<string, { label: string; color: string }>)[r.category];
            const noCoord = r.lat === 0 && r.lng === 0;
            return (
              <li key={`${r.name}-${r.address}-${i}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(r)}
                  className={`w-full text-left px-3 py-2 transition ${
                    i === highlight ? 'bg-indigo-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
