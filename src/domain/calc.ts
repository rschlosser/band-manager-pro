import { ADMIN_HOURLY_RATE, DONATION_RATE } from "./constants";
import {
  AnnualReport,
  BandEvent,
  EventBalance,
  Member,
  MemberReportRow,
  YearlySettings,
} from "./types";

function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((s, i) => s + i.amount, 0);
}

export function totalYearlyCosts(yearly: YearlySettings): number {
  return sumAmounts(yearly.items);
}

/** Sum of the cost-pot contributions already locked into existing events. */
export function contributedSoFar(events: BandEvent[]): number {
  return events.reduce((s, e) => s + e.costContribution, 0);
}

/**
 * The shared cost pot's open balance: everything purchased minus everything
 * events have already contributed. Never negative — deleting cost items after
 * events contributed simply means the pot is settled.
 */
export function outstandingSharedCosts(yearly: YearlySettings, events: BandEvent[]): number {
  return Math.max(0, totalYearlyCosts(yearly) - contributedSoFar(events));
}

/**
 * What a newly created event contributes to the pot: the configured fixed
 * amount, capped at whatever is still outstanding (an empty pot means no
 * deduction at all).
 */
export function contributionForNewEvent(yearly: YearlySettings, events: BandEvent[]): number {
  return Math.min(Math.max(0, yearly.contributionPerEvent), outstandingSharedCosts(yearly, events));
}

/**
 * How many more events (at the configured contribution) it takes to pay off
 * the pot. Null when the contribution is 0 but costs are still outstanding —
 * the pot will never be recovered at that rate.
 */
export function eventsRemainingToRecover(yearly: YearlySettings, events: BandEvent[]): number | null {
  const outstanding = outstandingSharedCosts(yearly, events);
  if (outstanding <= 0) return 0;
  if (yearly.contributionPerEvent <= 0) return null;
  return Math.ceil(outstanding / yearly.contributionPerEvent);
}

/**
 * Event balance waterfall, in display order:
 * income -> - expenses -> - cost pot contribution -> subtotal
 * -> - donation (10% of income) -> - admin compensation -> net payout
 * -> split equally among participating members.
 */
export function calcEventBalance(event: BandEvent): EventBalance {
  const income = sumAmounts(event.incomes);
  const expenses = sumAmounts(event.expenses);
  const costContribution = event.costContribution;
  const subtotal = income - expenses - costContribution;
  const donation = income * DONATION_RATE;
  const adminCompensation = event.adminItems.reduce((s, a) => s + a.hours * ADMIN_HOURLY_RATE, 0);
  const netPayout = subtotal - donation - adminCompensation;
  const participantCount = event.memberIds.length;
  const payoutPerMember = participantCount > 0 ? netPayout / participantCount : 0;

  return {
    income,
    expenses,
    costContribution,
    subtotal,
    donation,
    adminCompensation,
    netPayout,
    payoutPerMember,
    participantCount,
  };
}

export function calcTotals(events: BandEvent[]): { totalIncome: number; totalDonations: number } {
  let totalIncome = 0;
  let totalDonations = 0;
  for (const event of events) {
    const balance = calcEventBalance(event);
    totalIncome += balance.income;
    totalDonations += balance.donation;
  }
  return { totalIncome, totalDonations };
}

export function calcAnnualReport(members: Member[], events: BandEvent[], yearly: YearlySettings): AnnualReport {
  const rowMap = new Map<string, MemberReportRow>();
  for (const member of members) {
    rowMap.set(member.id, {
      memberId: member.id,
      name: member.name,
      performancePayouts: 0,
      adminCompensation: 0,
      yearlyCostReimbursement: 0,
      total: 0,
    });
  }

  let totalDonations = 0;
  let totalIncome = 0;

  for (const event of events) {
    const balance = calcEventBalance(event);
    totalDonations += balance.donation;
    totalIncome += balance.income;

    for (const memberId of event.memberIds) {
      const row = rowMap.get(memberId);
      if (row) row.performancePayouts += balance.payoutPerMember;
    }
    for (const admin of event.adminItems) {
      const row = rowMap.get(admin.memberId);
      if (row) row.adminCompensation += admin.hours * ADMIN_HOURLY_RATE;
    }
  }

  for (const item of yearly.items) {
    const row = rowMap.get(item.paidByMemberId);
    if (row) row.yearlyCostReimbursement += item.amount;
  }

  const rows = Array.from(rowMap.values()).map((r) => ({
    ...r,
    total: r.performancePayouts + r.adminCompensation + r.yearlyCostReimbursement,
  }));

  return { rows, totalDonations, totalIncome };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function reportToCSV(report: AnnualReport): string {
  const lines = ["Member,Performance,Admin,Reimbursement,Total"];
  for (const row of report.rows) {
    lines.push(
      [
        csvEscape(row.name),
        row.performancePayouts.toFixed(2),
        row.adminCompensation.toFixed(2),
        row.yearlyCostReimbursement.toFixed(2),
        row.total.toFixed(2),
      ].join(",")
    );
  }
  lines.push("");
  lines.push(`Total Donations (10%),${report.totalDonations.toFixed(2)}`);
  return lines.join("\n");
}
