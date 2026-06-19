export type CalendarSlot = { dayNum: number | null; dateString: string | null };
export type CalendarMonth = { year: number; month: number; days: CalendarSlot[] };

function generateMonth(year: number, monthIndex: number): CalendarMonth {
  const firstDayOffset = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const days: CalendarSlot[] = [];
  for (let i = 0; i < firstDayOffset; i++) {
    days.push({ dayNum: null, dateString: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNum: d, dateString });
  }
  return { year, month: monthIndex + 1, days };
}

/** 기준월부터 count개월(앞으로) 달력 데이터 */
export function buildMonthsForward(refISO: string, count: number): CalendarMonth[] {
  if (!refISO || count <= 0) return [];
  const ref = new Date(`${refISO}T00:00:00`);
  const months: CalendarMonth[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(ref.getFullYear(), ref.getMonth() + i, 1);
    months.push(generateMonth(d.getFullYear(), d.getMonth()));
  }
  return months;
}

/** 기준일이 속한 [전월, 해당월, 익월] 달력 데이터 */
export function buildCalendarMonths(refISO: string): CalendarMonth[] {
  if (!refISO) return [];
  const ref = new Date(`${refISO}T00:00:00`);
  const year = ref.getFullYear();
  const month = ref.getMonth();

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);

  return [
    generateMonth(prev.getFullYear(), prev.getMonth()),
    generateMonth(year, month),
    generateMonth(next.getFullYear(), next.getMonth()),
  ];
}
