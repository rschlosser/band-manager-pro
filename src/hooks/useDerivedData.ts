import { useMemo } from "react";
import {
  calcAnnualReport,
  calcEventBalance,
  calcTotals,
  eventsRemainingToRecoverYearlyCosts,
  totalYearlyCosts,
  yearlyCostSharePerEvent,
} from "../domain/calc";
import { useStore } from "../store/useStore";

export function useYearlyShare(): number {
  const yearly = useStore((s) => s.yearly);
  return useMemo(() => yearlyCostSharePerEvent(yearly), [yearly]);
}

export function useOverviewData() {
  const events = useStore((s) => s.events);
  const yearly = useStore((s) => s.yearly);
  const members = useStore((s) => s.members);

  return useMemo(() => {
    const share = yearlyCostSharePerEvent(yearly);
    const totals = calcTotals(events, share);
    return {
      share,
      totalYearlyCosts: totalYearlyCosts(yearly),
      totals,
      remaining: eventsRemainingToRecoverYearlyCosts(yearly, events.length),
      eventsHeld: events.length,
      membersCount: members.length,
      distributeOverEvents: yearly.distributeOverEvents,
    };
  }, [events, yearly, members]);
}

export function useEventBalance(eventId: string | null) {
  const events = useStore((s) => s.events);
  const yearly = useStore((s) => s.yearly);
  const event = eventId ? events.find((e) => e.id === eventId) ?? null : null;

  return useMemo(() => {
    if (!event) return null;
    const share = yearlyCostSharePerEvent(yearly);
    return { event, balance: calcEventBalance(event, share) };
  }, [event, yearly]);
}

export function useAnnualReport() {
  const members = useStore((s) => s.members);
  const events = useStore((s) => s.events);
  const yearly = useStore((s) => s.yearly);
  return useMemo(() => calcAnnualReport(members, events, yearly), [members, events, yearly]);
}
