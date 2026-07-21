import { useEffect, useRef, useState } from 'react';
import { loadNaverMap } from '../../lib/naverMapLoader';
import { useTheme } from '../../lib/theme';
import { scheduleName, type ScheduleItem } from '../../types';

/** 모든 일정 마커의 단일 색(카테고리 색 구분 제거). */
const MARKER_COLOR = '#6366f1';

type Props = {
  clientId: string;
  schedules: ScheduleItem[];
  activeScheduleId: string;
  /** 그날(day)의 식별 키 — 바뀌면 그날 일정 전체가 화면에 들어오도록 fitBounds. */
  dayKey: string;
  newLat: number;
  newLng: number;
  onPinClick: (id: string) => void;
};

// 네이버 지도 SDK 타입은 전역이 아니라 unknown으로 받고 필요한 부분만 좁혀 쓴다.
// (SDK 타입 패키지를 추가하지 않기 위한 절충 — 접근하는 API 표면이 작음)
type Naver = {
  maps: {
    LatLng: new (lat: number, lng: number) => unknown;
    LatLngBounds: new (sw: unknown, ne: unknown) => NaverBoundsInstance;
    Map: new (el: HTMLElement, opts: unknown) => NaverMapInstance;
    Marker: new (opts: unknown) => NaverMarkerInstance;
    Polyline: new (opts: unknown) => NaverPolylineInstance;
    InfoWindow: new (opts: unknown) => NaverInfoWindowInstance;
    Point: new (x: number, y: number) => unknown;
    Event: {
      addListener: (target: unknown, event: string, handler: (e: unknown) => void) => unknown;
      removeListener: (listener: unknown) => void;
    };
    Position: { RIGHT_TOP: unknown };
  };
};

type NaverMapInstance = {
  panTo: (latlng: unknown) => void;
  setCenter: (latlng: unknown) => void;
  getCenter: () => unknown;
  fitBounds: (bounds: unknown, margin?: number) => void;
};
type NaverMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
  setPosition: (latlng: unknown) => void;
  setIcon: (icon: unknown) => void;
  getPosition: () => unknown;
};
type NaverBoundsInstance = { extend: (latlng: unknown) => void };
type NaverPolylineInstance = { setPath: (path: unknown[]) => void; setMap: (map: NaverMapInstance | null) => void };
type NaverInfoWindowInstance = {
  setContent: (html: string) => void;
  open: (map: NaverMapInstance, anchor: unknown) => void;
  close: () => void;
};

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 } as const;

/** 위경도가 유효(0/0이 아님)한 일정만 걸러낸다. */
function withLocation(schedules: ScheduleItem[]): ScheduleItem[] {
  return schedules.filter((s) => s.location && !(s.location.lat === 0 && s.location.lng === 0));
}

/**
 * 네이버 지도 실지도 컴포넌트.
 *
 * - 위경도가 있는 일정만 지도에 표시(없으면 렌더 스킵).
 * - `dayKey` 변화 시 그날 일정 전체가 보이게 fitBounds, `activeScheduleId` 변화 시 해당 마커로 panTo.
 * - 일정 순서를 잇는 경로선(Polyline), 마커 클릭 시 InfoWindow, 앱 다크/라이트 테마 동기화 포함.
 * - 표시 전용(지도 클릭 상호작용 없음). 빈 지도 클릭 시 열린 InfoWindow만 닫는다.
 */
export function NaverMap({
  clientId,
  schedules,
  activeScheduleId,
  dayKey,
  newLat,
  newLng,
  onPinClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const naverRef = useRef<Naver | null>(null);
  const markersRef = useRef<Record<string, NaverMarkerInstance>>({});
  const newMarkerRef = useRef<NaverMarkerInstance | null>(null);
  const routeRef = useRef<NaverPolylineInstance | null>(null);
  const infoWindowRef = useRef<NaverInfoWindowInstance | null>(null);
  const clickListenerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { theme } = useTheme();

  // SDK 로드 + 지도 생성 (한 번만).
  useEffect(() => {
    let cancelled = false;
    loadNaverMap(clientId)
      .then((n) => {
        const naver = n as Naver;
        if (cancelled || !containerRef.current) return;
        naverRef.current = naver;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          zoom: 12,
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.RIGHT_TOP },
        });
        mapRef.current = map;
        infoWindowRef.current = new naver.maps.InfoWindow({ content: '', borderWidth: 0, backgroundColor: 'transparent' });
        // 표시 전용 지도: 빈 곳 클릭 시 열려 있던 InfoWindow만 닫는다.
        clickListenerRef.current = naver.maps.Event.addListener(map, 'click', () => {
          infoWindowRef.current?.close();
        });
        setReady(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      const naver = naverRef.current;
      if (naver && clickListenerRef.current) {
        naver.maps.Event.removeListener(clickListenerRef.current);
      }
      // Marker/Map 인스턴스는 명시 파괴 API가 없어 참조만 해제(엘리먼트 언마운트로 GC).
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      markersRef.current = {};
      newMarkerRef.current?.setMap(null);
      newMarkerRef.current = null;
      routeRef.current?.setMap(null);
      routeRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
      naverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // 일정 마커 동기화 + 클릭 시 InfoWindow.
  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    if (!ready || !map || !naver) return;

    const alive = new Set<string>();
    schedules.forEach((item, idx) => {
      if (!item.location || (item.location.lat === 0 && item.location.lng === 0)) return;
      alive.add(item.id);
      const isActive = item.id === activeScheduleId;
      const catColor = MARKER_COLOR;
      const size = isActive ? 30 : 24;
      const html = `
        <div style="position:relative;transform:translate(-50%,-50%)">
          ${isActive ? `<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${size + 20}px;height:${size + 20}px;border-radius:50%;background:${catColor};opacity:0.18;animation:naver-pin-pulse 1.4s ease-out infinite"></div>` : ''}
          <div style="width:${size}px;height:${size}px;border-radius:50%;background:${catColor};color:#fff;font-weight:800;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;${isActive ? 'outline:3px solid rgba(99,102,241,.45)' : ''}">${idx + 1}</div>
        </div>`;
      const icon = { content: html, anchor: new naver.maps.Point(size / 2, size / 2) };
      const existing = markersRef.current[item.id];
      const pos = new naver.maps.LatLng(item.location.lat, item.location.lng);
      if (existing) {
        existing.setPosition(pos);
        existing.setIcon(icon);
      } else {
        const marker = new naver.maps.Marker({ position: pos, map, icon });
        naver.maps.Event.addListener(marker, 'click', () => {
          onPinClick(item.id);
          const iw = infoWindowRef.current;
          if (!iw) return;
          iw.setContent(`
            <div style="padding:8px 12px;border-radius:10px;background:#111827;color:#fff;font-size:12px;line-height:1.5;box-shadow:0 4px 16px rgba(0,0,0,.35);min-width:120px">
              <div style="font-weight:700;font-size:13px">${scheduleName(item)}</div>
              <div style="opacity:.75;margin-top:2px">${item.time}</div>
            </div>`);
          iw.open(map, marker);
        });
        markersRef.current[item.id] = marker;
      }
    });

    // 사라진 마커 제거.
    Object.keys(markersRef.current).forEach((id) => {
      if (!alive.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [schedules, activeScheduleId, ready, onPinClick]);

  // 일정 순서를 잇는 경로선.
  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    if (!ready || !map || !naver) return;

    const path = withLocation(schedules).map(
      (item) => new naver.maps.LatLng(item.location!.lat, item.location!.lng),
    );
    if (path.length < 2) {
      routeRef.current?.setMap(null);
      routeRef.current = null;
      return;
    }
    if (routeRef.current) {
      routeRef.current.setPath(path);
    } else {
      routeRef.current = new naver.maps.Polyline({
        map,
        path,
        strokeColor: '#6366f1',
        strokeOpacity: 0.75,
        strokeWeight: 4,
        strokeStyle: 'shortdash',
      });
    }
  }, [schedules, ready]);

  // dayKey 변화 시 그날 일정 전체가 보이도록 fitBounds.
  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    if (!ready || !map || !naver) return;
    const located = withLocation(schedules);
    if (located.length === 0) return;
    if (located.length === 1) {
      map.setCenter(new naver.maps.LatLng(located[0].location!.lat, located[0].location!.lng));
      return;
    }
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(located[0].location!.lat, located[0].location!.lng),
      new naver.maps.LatLng(located[0].location!.lat, located[0].location!.lng),
    );
    located.slice(1).forEach((item) => bounds.extend(new naver.maps.LatLng(item.location!.lat, item.location!.lng)));
    map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, ready]);

  // 활성 일정 자동 panTo (새/선택 일정 포커스) — fitBounds 이후 같은 줌에서 살짝 재센터.
  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    if (!ready || !map || !naver || !activeScheduleId) return;
    const active = schedules.find((s) => s.id === activeScheduleId);
    if (!active?.location) return;
    if (active.location.lat === 0 && active.location.lng === 0) return;
    map.panTo(new naver.maps.LatLng(active.location.lat, active.location.lng));
  }, [activeScheduleId, schedules, ready]);

  // "새 핀 배치 가이드"(편집 중 위경도) — 편집 폼에서 위경도가 세팅되면 임시 마커 표시 + 지도 포커싱.
  //   - 검색 결과 선택 시 즉시 지도가 해당 위치로 부드럽게 이동해 사용자가 결과를 눈으로 확인 가능
  //   - 지도 클릭으로 위경도가 세팅된 경우엔 이미 화면 안이라 panTo가 실질적 no-op
  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    if (!ready || !map || !naver) return;
    const hasValid = newLat !== 0 || newLng !== 0;
    if (!hasValid) {
      newMarkerRef.current?.setMap(null);
      newMarkerRef.current = null;
      return;
    }
    const pos = new naver.maps.LatLng(newLat, newLng);
    const html = `
      <div style="transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;border:2px dashed #38bdf8;display:flex;align-items:center;justify-content:center">
        <div style="width:6px;height:6px;border-radius:50%;background:#38bdf8"></div>
      </div>`;
    const icon = { content: html, anchor: new naver.maps.Point(10, 10) };
    if (newMarkerRef.current) {
      newMarkerRef.current.setPosition(pos);
      newMarkerRef.current.setIcon(icon);
    } else {
      newMarkerRef.current = new naver.maps.Marker({ position: pos, map, icon });
    }
    map.panTo(pos);
  }, [newLat, newLng, ready]);

  return (
    <div className="relative w-full h-full">
      {/*
        네이버 지도는 커스텀 다크 타일 스타일(NCP 유료 커스텀 스타일 ID)이 없으면 항상 라이트 타일만
        내려준다. CSS invert+hue-rotate는 타일을 다크 톤으로 근사 반전시키는 표준 트릭 —
        마커는 이미 채도 높은 색이라 반전 후에도 색상이 크게 어긋나지 않는다.
      */}
      <div ref={containerRef} className={`w-full h-full ${theme === 'dark' ? 'naver-map-dark' : ''}`} />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs">
          지도 불러오는 중…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-950/80 text-rose-600 dark:text-rose-400 text-xs p-4 text-center">
          {error}
        </div>
      )}
      {/* 활성 마커 펄스 애니메이션 + 다크 테마 타일 반전(위 주석 참조) */}
      <style>{`
        @keyframes naver-pin-pulse {
          0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(1.4); opacity: 0; }
        }
        .naver-map-dark { filter: invert(1) hue-rotate(180deg); }
        .naver-map-dark img { filter: invert(1) hue-rotate(180deg); }
      `}</style>
    </div>
  );
}
