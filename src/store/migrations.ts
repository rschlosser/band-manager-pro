import { DEFAULT_CONTRIBUTION_PER_EVENT } from "../domain/constants";
import { AppData } from "../domain/types";

/**
 * Brings persisted data from any older shape up to the current one.
 *
 * v1 stored `yearly.distributeOverEvents` (total costs spread evenly over N
 * events) and events without a `costContribution`. The pot model keeps every
 * event's deduction fixed at creation, so we lock the old share
 * (total / N at migration time) into each existing event and convert the
 * setting into an equivalent per-event contribution.
 */
export function migratePersistedData(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, any>;
  if (!Array.isArray(data.members) || !Array.isArray(data.events) || typeof data.yearly !== "object" || !data.yearly) {
    return null;
  }

  const yearly = data.yearly as Record<string, any>;
  const items = Array.isArray(yearly.items) ? yearly.items : [];

  let contributionPerEvent: number;
  let legacyShare = 0;
  if (typeof yearly.contributionPerEvent === "number") {
    contributionPerEvent = yearly.contributionPerEvent;
  } else {
    const total = items.reduce((s: number, i: { amount?: number }) => s + (i.amount ?? 0), 0);
    const n = typeof yearly.distributeOverEvents === "number" ? yearly.distributeOverEvents : 0;
    legacyShare = n > 0 ? total / n : 0;
    contributionPerEvent = legacyShare > 0 ? Math.round(legacyShare * 100) / 100 : DEFAULT_CONTRIBUTION_PER_EVENT;
  }

  const events = data.events.map((e: Record<string, any>) => ({
    ...e,
    costContribution: typeof e.costContribution === "number" ? e.costContribution : legacyShare,
  }));

  return {
    members: data.members,
    events,
    yearly: { items, contributionPerEvent },
  } as AppData;
}
