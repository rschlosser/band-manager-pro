export function fmtCHF(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return "CHF " + rounded.toFixed(2);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
