import { useState } from 'react';
import { Icon } from '../icons/Icon';

/**
 * 일정별 "의논" 스레드 — 프로토타입(하드코딩).
 * 데이터/서버 없음: 댓글은 화면용 더미이며, 전송하면 로컬 상태에 추가되지만
 * 새로고침하면 사라집니다. 일정 id와 무관하게 동일 더미를 보여줍니다.
 */

type DemoComment = {
  author: string;
  text: string;
  at: string;
};

const SEED: DemoComment[] = [
  { author: '지훈', text: '여기 말고 덕수궁?', at: '어제' },
  { author: '민아', text: '경복궁 수문장 교대식 봐야해', at: '어제' },
  { author: '서연', text: '오 좋다 👍 시간만 조금 당기면 좋겠어요.', at: '3시간 전' },
];

export function CommentThread() {
  const [comments, setComments] = useState<DemoComment[]>(SEED);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [...prev, { author: '나', text, at: '방금' }]);
    setDraft('');
  };

  return (
    <div className="border-t border-slate-700/60 pt-4 space-y-3">
      <div className="flex items-center gap-1.5 text-slate-300">
        <Icon name="info" className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold">의논</span>
        <span className="text-xs text-slate-500">({comments.length})</span>
      </div>

      <ul className="space-y-2">
        {comments.map((c, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span
              className={`shrink-0 font-semibold ${
                c.author === '나' ? 'text-sky-400' : 'text-indigo-300'
              }`}
            >
              {c.author}
            </span>
            <span className="text-slate-300 break-words min-w-0 flex-1">{c.text}</span>
            <span className="shrink-0 text-[10px] text-slate-500">{c.at}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="댓글 입력…"
          className="flex-1 px-3 py-2 bg-slate-950/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none text-sm text-white"
        />
        <button
          type="button"
          onClick={handleSend}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition shrink-0"
        >
          전송
        </button>
      </div>
    </div>
  );
}
