import type { MouseEvent } from 'react';
import type { ScheduleItem } from '../../types';
import { CATEGORIES, SEOUL_LANDMARKS } from '../../lib/categories';

type Props = {
  schedules: ScheduleItem[];
  activeScheduleId: string;
  newX: number;
  newY: number;
  onMapClick: (x: number, y: number) => void;
  onPinClick: (id: string) => void;
};

/**
 * 지도 키가 없을 때 보여주는 인터랙티브 SVG 벡터 지도(폴백).
 * 실제 지도(Kakao) 연동은 KakaoMap 컴포넌트가 담당한다.
 */
export function VectorMapFallback({
  schedules,
  activeScheduleId,
  newX,
  newY,
  onMapClick,
  onPinClick,
}: Props) {
  const handleMapClick = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 500);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 500);
    onMapClick(x, y);
  };

  return (
    <svg
      viewBox="0 0 500 500"
      className="w-full h-full select-none cursor-crosshair"
      onClick={handleMapClick}
    >
      <defs>
        <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      <rect width="500" height="500" fill="#0f172a" />
      <rect width="500" height="500" fill="url(#grid)" />

      {/* 스타일라이즈된 한강 모티프 */}
      <path
        d="M 0,380 C 120,380 180,310 250,300 C 320,290 380,350 500,340 L 500,380 C 380,390 320,330 250,340 C 180,350 120,420 0,420 Z"
        fill="#1e3a8a"
        opacity="0.3"
      />
      <path
        d="M 0,380 C 120,380 180,310 250,300 C 320,290 380,350 500,340"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.15"
      />

      <circle cx="250" cy="140" r="45" fill="#065f46" opacity="0.15" />
      <circle cx="150" cy="320" r="55" fill="#065f46" opacity="0.12" />
      <circle cx="440" cy="360" r="50" fill="#065f46" opacity="0.12" />

      <path d="M 250,0 L 250,500" stroke="#334155" strokeWidth="1.5" opacity="0.4" />
      <path d="M 0,250 L 500,250" stroke="#334155" strokeWidth="1.5" opacity="0.4" />
      <path d="M 50,50 L 450,450" stroke="#334155" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />

      {/* 프리셋 랜드마크 */}
      <g opacity="0.25">
        {SEOUL_LANDMARKS.map((landmark, i) => (
          <g key={`land-${i}`} transform={`translate(${landmark.x}, ${landmark.y})`}>
            <circle r="4" fill="#94a3b8" />
            <text y="-8" textAnchor="middle" className="text-[9px] fill-slate-400 font-medium">
              {landmark.name}
            </text>
          </g>
        ))}
      </g>

      {/* 현재 날짜 경로 */}
      {schedules.length > 1 && (
        <g>
          <path
            d={`M ${schedules.map((item) => `${item.x},${item.y}`).join(' L ')}`}
            fill="none"
            stroke="#000"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />
          <path
            d={`M ${schedules.map((item) => `${item.x},${item.y}`).join(' L ')}`}
            fill="none"
            stroke="url(#route-gradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 4"
            className="animate-dash"
          />
        </g>
      )}

      {/* 마커 */}
      {schedules.map((item, idx) => {
        const isActive = item.id === activeScheduleId;
        const catColor = CATEGORIES[item.category]?.markerColor || '#6366f1';
        return (
          <g
            key={`marker-${item.id}`}
            transform={`translate(${item.x}, ${item.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onPinClick(item.id);
            }}
            className="cursor-pointer group/pin"
          >
            {isActive && (
              <g>
                <circle r="22" fill="url(#glow)" opacity="0.8" />
                <circle r="14" fill="none" stroke={catColor} strokeWidth="1.5" className="animate-ping" />
              </g>
            )}
            <ellipse cx="0" cy="4" rx="6" ry="2" fill="#000000" opacity="0.5" />
            <circle
              r={isActive ? '10' : '7'}
              fill={catColor}
              stroke="#ffffff"
              strokeWidth={isActive ? '2.5' : '1.5'}
              className="transition-all duration-300 drop-shadow"
            />
            <text y="3" textAnchor="middle" className="text-[9px] font-black fill-white select-none">
              {idx + 1}
            </text>
            <g className="opacity-0 group-hover/pin:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect x="-55" y="-36" width="110" height="22" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text y="-22" textAnchor="middle" className="text-[10px] font-bold fill-white">
                {idx + 1}. {item.locationName}
              </text>
            </g>
          </g>
        );
      })}

      {/* 새 핀 배치 가이드 */}
      <g transform={`translate(${newX}, ${newY})`} className="pointer-events-none">
        <circle r="15" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" className="animate-spin-slow" />
        <path d="M-8,0 L8,0 M0,-8 L0,8" stroke="#38bdf8" strokeWidth="1.5" />
        <circle r="3" fill="#38bdf8" />
      </g>
    </svg>
  );
}
