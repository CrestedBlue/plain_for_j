import { useEffect, useState } from 'react';
import { useTripStore } from './store/tripStore';
import { TripList } from './components/trip-list/TripList';
import { Dashboard } from './components/dashboard/Dashboard';
import { CreateTripCalendar } from './components/calendar/CreateTripCalendar';
import { Icon } from './components/icons/Icon';

export default function App() {
  const activeTripId = useTripStore((s) => s.activeTripId);
  const trips = useTripStore((s) => s.trips);
  const status = useTripStore((s) => s.status);
  const error = useTripStore((s) => s.error);
  const loadTrips = useTripStore((s) => s.loadTrips);
  const [creating, setCreating] = useState(false);

  // 최초 진입 시 서버에서 여행 목록 로드
  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    if (activeTripId) setCreating(false);
  }, [activeTripId]);

  let screen;
  if (status === 'idle' || (status === 'loading' && !activeTripId && trips.length === 0)) {
    screen = <CenterNote icon="compass" title="불러오는 중…" spin />;
  } else if (status === 'error' && !activeTripId) {
    screen = (
      <CenterNote icon="info" title="서버에 연결하지 못했어요" subtitle={error ?? undefined}>
        <button
          onClick={() => loadTrips()}
          className="mt-4 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition"
        >
          다시 시도
        </button>
      </CenterNote>
    );
  } else if (activeTripId) {
    screen = <Dashboard />;
  } else if (trips.length === 0) {
    screen = <CreateTripCalendar />;
  } else if (creating) {
    screen = <CreateTripCalendar onCancel={() => setCreating(false)} onCreated={() => setCreating(false)} />;
  } else {
    screen = <TripList onNewTrip={() => setCreating(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">{screen}</div>
  );
}

type CenterNoteProps = {
  icon: 'compass' | 'info';
  title: string;
  subtitle?: string;
  spin?: boolean;
  children?: React.ReactNode;
};

function CenterNote({ icon, title, subtitle, spin, children }: CenterNoteProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl mb-3">
        <Icon name={icon} className={`w-8 h-8 ${spin ? 'animate-spin-slow' : ''}`} />
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-sm">{subtitle}</p>}
      {children}
    </div>
  );
}
