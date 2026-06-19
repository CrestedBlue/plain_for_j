import { useEffect, useState } from 'react';
import { useTripStore } from './store/tripStore';
import { TripList } from './components/trip-list/TripList';
import { Dashboard } from './components/dashboard/Dashboard';
import { CreateTripCalendar } from './components/calendar/CreateTripCalendar';

export default function App() {
  const activeTripId = useTripStore((s) => s.activeTripId);
  const trips = useTripStore((s) => s.trips);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTripId) setCreating(false);
  }, [activeTripId]);

  let screen;
  if (activeTripId) {
    screen = <Dashboard />;
  } else if (trips.length === 0) {
    // 여행이 하나도 없으면 캘린더 화면을 메인 페이지로
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
