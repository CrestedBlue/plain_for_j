import { useEffect, useRef, useState } from 'react';
import type { ScheduleItem } from '../../types';
import { loadKakao } from '../../lib/kakaoLoader';

type Props = {
  appKey: string;
  schedules: ScheduleItem[];
  activeScheduleId: string;
  onPinClick: (id: string) => void;
};

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

/**
 * 실제 Kakao 지도. VITE_KAKAO_MAP_KEY 가 있을 때만 렌더된다.
 * 위경도(location)가 있는 일정만 마커로 표시한다.
 */
export function KakaoMap({ appKey, schedules, activeScheduleId, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadKakao(appKey)
      .then((k) => {
        const kakao = k as typeof window.kakao;
        if (cancelled || !containerRef.current) return;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          level: 7,
        });
        setReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [appKey]);

  useEffect(() => {
    if (!ready) return;
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao || !map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const located = schedules.filter((s) => s.location);
    located.forEach((s) => {
      const pos = new kakao.maps.LatLng(s.location!.lat, s.location!.lng);
      const marker = new kakao.maps.Marker({ position: pos, map });
      kakao.maps.event.addListener(marker, 'click', () => onPinClick(s.id));
      markersRef.current.push(marker);
    });

    const active = located.find((s) => s.id === activeScheduleId);
    if (active) {
      map.panTo(new kakao.maps.LatLng(active.location!.lat, active.location!.lng));
    }
  }, [ready, schedules, activeScheduleId, onPinClick]);

  if (error) {
    return (
      <div className="w-full h-full grid place-items-center p-6 text-center text-sm text-rose-300">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
