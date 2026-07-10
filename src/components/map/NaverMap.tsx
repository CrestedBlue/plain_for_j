import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../../lib/categories';
import { loadNaverMap } from '../../lib/naverMapLoader';
import type { ScheduleItem } from '../../types';

type Props = {
  clientId: string;
  schedules: ScheduleItem[];
  activeScheduleId: string;
  /** 그날(day)의 식별 키 — 바뀌면 그날 일정 전체가 화면에 들어오도록 fitBounds. */
  dayKey: string;
  newLat: number;
  newLng: number;
  /** 지도 클릭 시 위경도 + (리버스 지오코드로 추출한) 근처 장소/건물명. 실패 시 name 미지정. */
  onMapClick: (lat: number, lng: number, name?: string) => void;
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
    Point: new (x: number, y: number) => unknown;
    Event: {
      addListener: (target: unknown, event: string, handler: (e: unknown) => void) => unknown;
      removeListener: (listener: unknown) => void;
    };
    Position: { RIGHT_TOP: unknown };
    Service: {
      reverseGeocode: (
        opts: { coords: unknown; orders?: string },
        cb: (status: number, response: ReverseGeocodeResponse) => void,
      ) => void;
      OrderType: { ADDR: string; ROAD_ADDR: string };
      Status: { OK: number };
    };
  };
};

type ReverseGeocodeResponse = {
  v2?: {
    address?: {
      roadAddress?: string;
      jibunAddress?: string;
    };
    results?: Array<{ name?: string; region?: { area1?: { name?: string } } }>;
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
type Coord = { x: number; y: number };

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 } as const;

/**
 * 리버스 지오코드 응답에서 사람이 검색어로 쓸 만한 짧은 이름을 뽑는다.
 * 우선순위: 도로명주소 괄호 안 마지막 토큰(=건물명) → 괄호 제거한 도로명주소 → 지번주소.
 * 예) "서울특별시 강남구 테헤란로 152 (역삼동, 강남파이낸스센터)" → "강남파이낸스센터"
 */
function extractPlaceName(res: ReverseGeocodeResponse): string {
  const road = res.v2?.address?.roadAddress ?? '';
  const jibun = res.v2?.address?.jibunAddress ?? '';
  const paren = road.match(/\(([^()]*)\)/);
  if (paren) {
    const parts = paren[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const stripped = road.replace(/\s*\([^()]*\)\s*/g, '').trim();
  return stripped || jibun.trim();
}

/** 위경도가 유효(0/0이 아님)한 일정만 걸러낸다. */
function withLocation(schedules: ScheduleItem[]): ScheduleItem[] {
  return schedules.filter((s) => s.location && !(s.location.lat === 0 && s.location.lng === 0));
}

/**
 * 네이버 지도 실지도 컴포넌트.
 *
 * - 위경도가 있는 일정만 지도에 표시(없으면 렌더 스킵).
 * - `dayKey` 변화 시 그날 일정 전체가 보이게 fitBounds, `activeScheduleId` 변화 시 해당 마커로 panTo.
 * - 지도 클릭 시 lat/lng을 부모로 넘김.
 */
export function NaverMap({
  clientId,
  schedules,
  activeScheduleId,
  dayKey,
  newLat,
  newLng,
  onMapClick,
  onPinClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const naverRef = useRef<Naver | null>(null);
  const markersRef = useRef<Record<string, NaverMarkerInstance>>({});
  const newMarkerRef = useRef<NaverMarkerInstance | null>(null);
  const clickListenerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
        clickListenerRef.current = naver.maps.Event.addListener(map, 'click', (raw) => {
          const e = raw as { coord: Coord };
          // 네이버 지도: coord.x = 경도(lng), coord.y = 위도(lat)
          const lat = e.coord.y;
          const lng = e.coord.x;
          // POI 라벨 클릭 이벤트는 v3 SDK가 노출하지 않는다.
          // 대신 좌표를 리버스 지오코드해 근처의 건물명/도로명을 얻어 부모에게 전달 →
          // 부모(Dashboard)는 그 이름으로 자동 지역검색을 실행해 첫 결과를 폼에 반영한다.
          try {
            naver.maps.Service.reverseGeocode(
              {
                coords: new naver.maps.LatLng(lat, lng),
                orders: [naver.maps.Service.OrderType.ROAD_ADDR, naver.maps.Service.OrderType.ADDR].join(','),
              },
              (status, response) => {
                if (status !== naver.maps.Service.Status.OK) {
                  onMapClick(lat, lng);
                  return;
                }
                const name = extractPlaceName(response);
                onMapClick(lat, lng, name || undefined);
              },
            );
          } catch {
            onMapClick(lat, lng);
          }
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
      mapRef.current = null;
      naverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // 일정 마커 동기화.
  useEffect(() => {
    const map = mapRef.current;
    const naver = naverRef.current;
    if (!ready || !map || !naver) return;

    const alive = new Set<string>();
    schedules.forEach((item, idx) => {
      if (!item.location || (item.location.lat === 0 && item.location.lng === 0)) return;
      alive.add(item.id);
      const isActive = item.id === activeScheduleId;
      const catColor = CATEGORIES[item.category]?.markerColor ?? '#6366f1';
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
        naver.maps.Event.addListener(marker, 'click', () => onPinClick(item.id));
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
      <div ref={containerRef} className="w-full h-full" />
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
      {/* 활성 마커 펄스 애니메이션 keyframes (컴포넌트 로컬) */}
      <style>{`
        @keyframes naver-pin-pulse {
          0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
