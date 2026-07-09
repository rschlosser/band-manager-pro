import { useMemo } from "react";
import {
  calcAnnualReport,
  calcEventBalance,
  calcTotals,
  eventsRemainingToRecover,
  outstandingSharedCosts,
  totalYearlyCosts,
} from "../domain/calc";
import { useStore } from "../store/useStore";

export function useOverviewData() {
  const events = useStore((s) => s.events);
  const yearly = useStore((s) => s.yearly);
  const members = useStore((s) => s.members);

  return useMemo(() => {
    const total = totalYearlyCosts(yearly);
    const outstanding = outstandingSharedCosts(yearly, events);
    return {
      totals: calcTotals(events),
      totalYearlyCosts: total,
      outstanding,
      recovered: total - outstanding,
      remainingEvents: eventsRemainingToRecover(yearly, events),
      contributionPerEvent: yearly.contributionPerEvent,
      eventsHeld: events.length,
      membersCount: members.length,
    };
  }, [events, yearly, members]);
}

export function useEventBalance(eventId: string | null) {
  const events = useStore((s) => s.events);
  const event = eventId ? events.find((e) => e.id === eventId) ?? null : null;

  return useMemo(() => {
    if (!event) return null;
    return { event, balance: calcEventBalance(event) };
  }, [event]);
}

export function useAnnualReport() {
  const members = useStore((s) => s.members);
  const events = useStore((s) => s.events);
  const yearly = useStore((s) => s.yearly);
  return useMemo(() => calcAnnualReport(members, events, yearly), [members, events, yearly]);
}
