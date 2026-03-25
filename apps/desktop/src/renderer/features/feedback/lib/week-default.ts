export function getMondayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().slice(0, 10);
}

export function parseWeekParam(value: string | null): string | null {
  if (value === null || value === "") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}
