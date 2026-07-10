import { type FormEvent } from 'react';
import type { Category } from '../../lib/categories';
import { CATEGORIES } from '../../lib/categories';
import type { GeoLocation } from '../../types';
import { Icon } from '../icons/Icon';
// [프로토타입 보류] 일정별 "의논" 댓글 — 사람 식별(인증) 먼저 만든 뒤 재활성화 예정.
// import { CommentThread } from './CommentThread';

export type ScheduleFormState = {
  time: string;
  locationName: string;
  displayName: string;
  category: Category;
  notes: string;
  /** 위경도(있으면 서버 저장). 검색 결과 선택 시 채워짐. */
  location?: GeoLocation;
};

export type EditorMode = 'view' | 'edit' | 'add';

type Props = {
  mode: EditorMode;
  form: ScheduleFormState;
  onPatch: (patch: Partial<ScheduleFormState>) => void;
  onSubmit: (e: FormEvent) => void;
  onDelete?: () => void;
  onEnterEdit?: () => void;
  onCancelEdit?: () => void;
};

const displayedName = (form: ScheduleFormState) => form.displayName.trim() || form.locationName;

// 재사용 클래스: 라이트/다크 대응 폼 컨트롤 스타일
const inputClass =
  'w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-950/50 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 rounded-lg focus:border-indigo-500 outline-none text-sm';

const cardClass =
  'bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-xl space-y-4';

const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1';

export function ScheduleEditor(props: Props) {
  return props.mode === 'view' ? <ViewCard {...props} /> : <EditForm {...props} />;
}

/* ── 조회 (읽기 전용) ─────────────────────────────────────── */
function ViewCard({ form, onEnterEdit, onDelete }: Props) {
  const cat = CATEGORIES[form.category];
  const name = displayedName(form);
  const hasAlias = form.displayName.trim().length > 0;

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <Icon name="info" className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">일정 조회</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">선택된 일정의 상세 내용입니다.</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${cat?.color} text-white`}>
            {cat?.label || '기타'}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950/40 px-2 py-0.5 rounded">
            <Icon name="clock" className="w-3.5 h-3.5" />
            {form.time}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name || '장소 미지정'}</h3>
        {hasAlias && (
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Icon name="map-pin" className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            {form.locationName}
          </p>
        )}
      </div>

      <div>
        <span className="text-xs text-slate-500 block mb-1">상세 메모 / 체크리스트</span>
        <p className="text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[80px] leading-relaxed whitespace-pre-line">
          {form.notes || '작성된 메모가 없습니다.'}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onEnterEdit}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
        >
          <Icon name="edit" className="w-5 h-5" />
          수정
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="py-3 px-4 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl border border-slate-200 dark:border-slate-700/60 transition"
            title="이 일정 삭제"
          >
            <Icon name="trash" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* [프로토타입 보류] <CommentThread /> */}
    </div>
  );
}

/* ── 수정 / 추가 (편집 폼) ────────────────────────────────── */
function EditForm({ mode, form, onPatch, onSubmit, onCancelEdit }: Props) {
  const isEdit = mode === 'edit';

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
        <span
          className={`p-1.5 rounded-lg ${
            isEdit
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
          }`}
        >
          <Icon name={isEdit ? 'edit' : 'plus'} className="w-5 h-5" />
        </span>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">{isEdit ? '일정 수정' : '새 일정 추가'}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            지도 아래 <strong className="text-indigo-600 dark:text-indigo-300">장소 검색</strong> 또는 지도 클릭으로 위치를 지정하세요.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>장소명</label>
            <input
              type="text"
              required
              value={form.locationName}
              onChange={(e) => onPatch({ locationName: e.target.value })}
              placeholder="예: 여의도 한강공원"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              표기명 <span className="text-slate-400 dark:text-slate-600 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => onPatch({ displayName: e.target.value })}
              placeholder="비우면 장소명으로 표시"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>방문 시각</label>
          <input
            type="time"
            value={form.time}
            onChange={(e) => onPatch({ time: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>상세 메모 / 체크리스트</label>
          <textarea
            value={form.notes}
            onChange={(e) => onPatch({ notes: e.target.value })}
            placeholder="구체적으로 해야할 일이나 주의점을 자유롭게 메모하세요."
            rows={3}
            className={`${inputClass} resize-none leading-relaxed`}
          />
        </div>

        <div className="flex items-center gap-2">
          {isEdit && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="py-3 px-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-700/50 transition"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 py-3 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 ${
              isEdit
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-indigo-600/10'
            }`}
          >
            <Icon name={isEdit ? 'edit' : 'plus'} className="w-5 h-5" />
            {isEdit ? '변경 사항 저장' : '일정 추가하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

