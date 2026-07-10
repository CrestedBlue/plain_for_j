import type { MouseEvent } from 'react';
import type { ScheduleItem } from '../../types';
import { CATEGORIES, SEOUL_LANDMARKS } from '../../lib/categories';
import { useTheme } from '../../lib/theme';

type Props = {
  schedules: ScheduleItem[];
  activeScheduleId: string;
  newX: number;
  newY: number;
  onMapClick: (x: number, y: number) => void;
  onPinClick: (id: string) => void;
};

// 테마별 SVG 팔레트 — CSS class로 다루기 어려운 fill/stroke는 여기서 명시.
const PALETTE = {
  dark: {
    bg: '#0f172a',
    grid: '#1e293b',
    river: '#1e3a8a',
    riverStroke: '#3b82f6',
    parks: '#065f46',
    axis: '#334155',
    landmarkText: '#94a3b8',
    tooltipBg: '#1e293b',
    tooltipStroke: '#475569',
    tooltipText: '#ffffff',
  },
  light: {
    bg: '#f1f5f9', // slate-100
    grid: '#cbd5e1', // slate-300
    river: '#bfdbfe', // blue-200
    riverStroke: '#60a5fa', // blue-400
    parks: '#a7f3d0', // emerald-200
    axis: '#94a3b8', // slate-400
    landmarkText: '#475569', // slate-600
    tooltipBg: '#ffffff',
    tooltipStroke: '#94a3b8', // slate-400
    tooltipText: '#0f172a', // slate-900
  },
} as const;

/**
 * 인터랙티브 SVG 벡터(개념) 지도 — Naver Map SDK 미설정 시 폴백.
 * 실제 지리좌표가 아닌 양식화된 x/y(0~500) 배치를 사용한다.
 */
export function VectorMapFallback({
  schedules,
  activeScheduleId,
  newX,
  newY,
  onMapClick,
  onPinClick,
}: Props) {
  const { theme } = useTheme();
  const c = PALETTE[theme];

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
          <path d="M 25 0 L 0 0 0 25" fill="none" stroke={c.grid} strokeWidth="0.5" />
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

      <rect width="500" height="500" fill={c.bg} />
      <rect width="500" height="500" fill="url(#grid)" />

      <path
        d="M 0,380 C 120,380 180,310 250,300 C 320,290 380,350 500,340 L 500,380 C 380,390 320,330 250,340 C 180,350 120,420 0,420 Z"
        fill={c.river}
        opacity={theme === 'dark' ? '0.3' : '0.6'}
      />
      <path
        d="M 0,380 C 120,380 180,310 250,300 C 320,290 380,350 500,340"
        fill="none"
        stroke={c.riverStroke}
        strokeWidth="10"
        strokeLinecap="round"
        opacity={theme === 'dark' ? '0.15' : '0.4'}
      />

      <circle cx="250" cy="140" r="45" fill={c.parks} opacity={theme === 'dark' ? '0.15' : '0.5'} />
      <circle cx="150" cy="320" r="55" fill={c.parks} opacity={theme === 'dark' ? '0.12' : '0.45'} />
      <circle cx="440" cy="360" r="50" fill={c.parks} opacity={theme === 'dark' ? '0.12' : '0.45'} />

      <path d="M 250,0 L 250,500" stroke={c.axis} strokeWidth="1.5" opacity="0.4" />
      <path d="M 0,250 L 500,250" stroke={c.axis} strokeWidth="1.5" opacity="0.4" />
      <path d="M 50,50 L 450,450" stroke={c.axis} strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />

      <g opacity={theme === 'dark' ? '0.25' : '0.55'}>
        {SEOUL_LANDMARKS.map((landmark, i) => (
          <g key={`land-${i}`} transform={`translate(${landmark.x}, ${landmark.y})`}>
            <circle r="4" fill={c.landmarkText} />
            <text y="-8" textAnchor="middle" className="text-[9px] font-medium" fill={c.landmarkText}>
              {landmark.name}
            </text>
          </g>
        ))}
      </g>

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
              <rect x="-55" y="-36" width="110" height="22" rx="6" fill={c.tooltipBg} stroke={c.tooltipStroke} strokeWidth="1" />
              <text y="-22" textAnchor="middle" className="text-[10px] font-bold" fill={c.tooltipText}>
                {idx + 1}. {item.locationName}
              </text>
            </g>
          </g>
        );
      })}

      <g transform={`translate(${newX}, ${newY})`} className="pointer-events-none">
        <circle r="15" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" className="animate-spin-slow" />
        <path d="M-8,0 L8,0 M0,-8 L0,8" stroke="#38bdf8" strokeWidth="1.5" />
        <circle r="3" fill="#38bdf8" />
      </g>
    </svg>
  );
}
