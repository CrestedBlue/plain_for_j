import type { ScheduleItem } from '../../types';
import { Icon } from '../icons/Icon';
import { VectorMapFallback } from './VectorMapFallback';
import { KakaoMap } from './KakaoMap';

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY ?? '';

type Props = {
  schedules: ScheduleItem[];
  activeScheduleId: string;
  newX: number;
  newY: number;
  dayLabel: string;
  onMapClick: (x: number, y: number) => void;
  onPinClick: (id: string) => void;
};

export function MapPanel({
  schedules,
  activeScheduleId,
  newX,
  newY,
  dayLabel,
  onMapClick,
  onPinClick,
}: Props) {
  const hasKey = Boolean(KAKAO_KEY.trim());

  return (
    <div className="relative aspect-square w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner group">
      {hasKey ? (
        <KakaoMap
          appKey={KAKAO_KEY}
          schedules={schedules}
          activeScheduleId={activeScheduleId}
          onPinClick={onPinClick}
        />
      ) : (
        <VectorMapFallback
          schedules={schedules}
          activeScheduleId={activeScheduleId}
          newX={newX}
          newY={newY}
          onMapClick={onMapClick}
          onPinClick={onPinClick}
        />
      )}

      {/* 상단 라벨 */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span>{dayLabel} 실시간 루트</span>
      </div>

      {/* 안내 (폴백 모드에서만) */}
      {!hasKey && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-200 flex items-center gap-1">
            <Icon name="info" className="w-3.5 h-3.5 text-sky-400" />
            지도 미리보기 (키 없음)
          </p>
          <p>
            지도 빈 공간을 클릭하면 타겟 핀이 지정되어 새 일정을 등록할 수 있어요. Kakao 키를
            <span className="text-sky-300"> .env </span>에 넣으면 실제 지도로 전환됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
