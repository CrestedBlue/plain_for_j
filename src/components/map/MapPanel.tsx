import type { ScheduleItem } from '../../types';
import { Icon } from '../icons/Icon';
import { VectorMapFallback } from './VectorMapFallback';
import { NaverMap } from './NaverMap';

/**
 * 지도 클릭 페이로드.
 * - 실지도(NaverMap): 위경도 + (리버스 지오코드로 추출한) 근처 장소/건물명(있으면)
 * - SVG 폴백: SVG 좌표(0~500) 반환
 * Dashboard가 kind로 분기해 폼/자동검색에 반영한다.
 */
export type MapClickPayload =
  | { kind: 'latlng'; lat: number; lng: number; name?: string }
  | { kind: 'xy'; x: number; y: number };

type Props = {
  schedules: ScheduleItem[];
  activeScheduleId: string;
  newX: number;
  newY: number;
  /** 편집 중인 폼의 위경도(있으면 실지도에 임시 핀으로 표시). 없으면 0/0. */
  newLat?: number;
  newLng?: number;
  dayLabel: string;
  onMapClick: (payload: MapClickPayload) => void;
  onPinClick: (id: string) => void;
};

const NAVER_MAP_CLIENT_ID: string = import.meta.env.VITE_NAVER_MAP_CLIENT_ID ?? '';

export function MapPanel({
  schedules,
  activeScheduleId,
  newX,
  newY,
  newLat = 0,
  newLng = 0,
  dayLabel,
  onMapClick,
  onPinClick,
}: Props) {
  const useRealMap = NAVER_MAP_CLIENT_ID.length > 0;
  return (
    <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner group">
      {useRealMap ? (
        <NaverMap
          clientId={NAVER_MAP_CLIENT_ID}
          schedules={schedules}
          activeScheduleId={activeScheduleId}
          newLat={newLat}
          newLng={newLng}
          onMapClick={(lat, lng, name) => onMapClick({ kind: 'latlng', lat, lng, name })}
          onPinClick={onPinClick}
        />
      ) : (
        <VectorMapFallback
          schedules={schedules}
          activeScheduleId={activeScheduleId}
          newX={newX}
          newY={newY}
          onMapClick={(x, y) => onMapClick({ kind: 'xy', x, y })}
          onPinClick={onPinClick}
        />
      )}

      <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none z-10 shadow">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span>{dayLabel} 실시간 루트</span>
        {!useRealMap && <span className="text-slate-400 dark:text-slate-500">· 개념 지도</span>}
      </div>

      <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pointer-events-none z-10 shadow">
        <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <Icon name="info" className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          {useRealMap ? '네이버 지도' : '개념 지도 (위치 배치용)'}
        </p>
        <p>
          {useRealMap
            ? '지도 클릭·장소 검색으로 위치를 지정하세요. 일정을 추가/선택하면 자동으로 그 위치로 이동합니다.'
            : '지도 빈 공간을 클릭하면 타겟 핀이 지정되어 새 일정을 등록할 수 있어요.'}
        </p>
      </div>
    </div>
  );
}
