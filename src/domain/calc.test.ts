import {
  calcAnnualReport,
  calcEventBalance,
  calcTotals,
  eventsRemainingToRecoverYearlyCosts,
  reportToCSV,
  totalYearlyCosts,
  yearlyCostSharePerEvent,
} from "./calc";
import { ADMIN_HOURLY_RATE, DONATION_RATE } from "./constants";
import { BandEvent, Member, YearlySettings } from "./types";

function makeEvent(overrides: Partial<BandEvent> = {}): BandEvent {
  return {
    id: "e1",
    name: "Kirtan Night",
    date: "2026-01-10",
    memberIds: [],
    incomes: [],
    expenses: [],
    adminItems: [],
    ...overrides,
  };
}

function makeYearly(overrides: Partial<YearlySettings> = {}): YearlySettings {
  return { items: [], distributeOverEvents: 10, ...overrides };
}

describe("yearlyCostSharePerEvent", () => {
  it("splits total yearly cost evenly over N events", () => {
    const yearly = makeYearly({
      items: [{ id: "y1", description: "Harmonium", invoiceDate: "2026-01-01", paidByMemberId: "m1", amount: 500 }],
      distributeOverEvents: 10,
    });
    expect(yearlyCostSharePerEvent(yearly)).toBeCloseTo(50);
    expect(totalYearlyCosts(yearly)).toBe(500);
  });

  it("returns 0 when there are no yearly items", () => {
    expect(yearlyCostSharePerEvent(makeYearly())).toBe(0);
  });

  it("does not throw or return Infinity/NaN when distributeOverEvents is 0", () => {
    const yearly = makeYearly({
      items: [{ id: "y1", description: "x", invoiceDate: "2026-01-01", paidByMemberId: "m1", amount: 100 }],
      distributeOverEvents: 0,
    });
    expect(yearlyCostSharePerEvent(yearly)).toBe(0);
  });
});

describe("eventsRemainingToRecoverYearlyCosts", () => {
  it("counts down as events are held and never goes negative", () => {
    const yearly = makeYearly({ distributeOverEvents: 10 });
    expect(eventsRemainingToRecoverYearlyCosts(yearly, 4)).toBe(6);
    expect(eventsRemainingToRecoverYearlyCosts(yearly, 10)).toBe(0);
    expect(eventsRemainingToRecoverYearlyCosts(yearly, 15)).toBe(0);
  });
});

describe("calcEventBalance", () => {
  it("computes the full waterfall in the specified order", () => {
    const event = makeEvent({
      memberIds: ["m1", "m2"],
      incomes: [
        { id: "i1", source: "Twint direct", amount: 300 },
        { id: "i2", source: "Cash", amount: 100 },
      ],
      expenses: [{ id: "x1", category: "Venue rental", description: "", amount: 80 }],
      adminItems: [{ id: "a1", memberId: "m1", type: "Marketing", hours: 2, description: "" }],
    });
    const yearlyShare = 30;
    const balance = calcEventBalance(event, yearlyShare);

    // income = 400
    expect(balance.income).toBe(400);
    // expenses = 80
    expect(balance.expenses).toBe(80);
    expect(balance.yearlyCostShare).toBe(30);
    // subtotal = 400 - 80 - 30 = 290
    expect(balance.subtotal).toBe(290);
    // donation = 10% of income = 40
    expect(balance.donation).toBeCloseTo(400 * DONATION_RATE);
    // admin = 2h * 20 = 40
    expect(balance.adminCompensation).toBe(2 * ADMIN_HOURLY_RATE);
    // net = 290 - 40 - 40 = 210
    expect(balance.netPayout).toBeCloseTo(210);
    // per member = 210 / 2 = 105
    expect(balance.payoutPerMember).toBeCloseTo(105);
    expect(balance.participantCount).toBe(2);
  });

  it("donation is based on income only, unaffected by expenses or yearly share", () => {
    const event = makeEvent({
      incomes: [{ id: "i1", source: "Cash", amount: 1000 }],
      expenses: [{ id: "x1", category: "Other", description: "", amount: 900 }],
    });
    const balance = calcEventBalance(event, 500);
    expect(balance.donation).toBeCloseTo(100);
  });

  it("returns 0 payout per member when there are no participating members", () => {
    const event = makeEvent({
      memberIds: [],
      incomes: [{ id: "i1", source: "Cash", amount: 200 }],
    });
    const balance = calcEventBalance(event, 0);
    expect(balance.participantCount).toBe(0);
    expect(balance.payoutPerMember).toBe(0);
    // net payout itself is still computed even with nobody to pay
    expect(balance.netPayout).toBeCloseTo(200 - 20);
  });

  it("allows a negative net payout when costs exceed income", () => {
    const event = makeEvent({
      memberIds: ["m1"],
      incomes: [{ id: "i1", source: "Cash", amount: 50 }],
      expenses: [{ id: "x1", category: "Venue rental", description: "", amount: 200 }],
    });
    const balance = calcEventBalance(event, 40);
    expect(balance.netPayout).toBeLessThan(0);
    expect(balance.payoutPerMember).toBeLessThan(0);
  });

  it("returns an all-zero balance for a completely empty event", () => {
    const balance = calcEventBalance(makeEvent(), 0);
    expect(balance).toMatchObject({
      income: 0,
      expenses: 0,
      yearlyCostShare: 0,
      subtotal: 0,
      donation: 0,
      adminCompensation: 0,
      netPayout: 0,
      payoutPerMember: 0,
      participantCount: 0,
    });
  });
});

describe("calcTotals", () => {
  it("returns zeroed totals for an empty event list", () => {
    expect(calcTotals([], 0)).toEqual({ totalIncome: 0, totalDonations: 0 });
  });

  it("sums income and donations across multiple events", () => {
    const events = [
      makeEvent({ id: "e1", incomes: [{ id: "i1", source: "Cash", amount: 100 }] }),
      makeEvent({ id: "e2", incomes: [{ id: "i2", source: "Cash", amount: 200 }] }),
    ];
    const totals = calcTotals(events, 0);
    expect(totals.totalIncome).toBe(300);
    expect(totals.totalDonations).toBeCloseTo(30);
  });
});

describe("calcAnnualReport", () => {
  const members: Member[] = [
    { id: "m1", name: "Alice" },
    { id: "m2", name: "Bob" },
  ];

  it("returns a zeroed row per member when there are no events", () => {
    const report = calcAnnualReport(members, [], makeYearly());
    expect(report.rows).toHaveLength(2);
    for (const row of report.rows) {
      expect(row.total).toBe(0);
      expect(row.performancePayouts).toBe(0);
      expect(row.adminCompensation).toBe(0);
      expect(row.yearlyCostReimbursement).toBe(0);
    }
    expect(report.totalDonations).toBe(0);
    expect(report.totalIncome).toBe(0);
  });

  it("returns an empty row list for zero members", () => {
    const report = calcAnnualReport([], [makeEvent({ incomes: [{ id: "i1", source: "Cash", amount: 100 }] })], makeYearly());
    expect(report.rows).toHaveLength(0);
    // totals are still tracked even though nobody is around to receive them
    expect(report.totalIncome).toBe(100);
  });

  it("aggregates performance payouts, admin pay, and reimbursements per member", () => {
    const yearly = makeYearly({
      items: [{ id: "y1", description: "PA system", invoiceDate: "2026-01-01", paidByMemberId: "m1", amount: 100 }],
      distributeOverEvents: 10,
    });
    const events: BandEvent[] = [
      makeEvent({
        id: "e1",
        memberIds: ["m1", "m2"],
        incomes: [{ id: "i1", source: "Cash", amount: 220 }],
        adminItems: [{ id: "a1", memberId: "m2", type: "Organization", hours: 1, description: "" }],
      }),
    ];
    const report = calcAnnualReport(members, events, yearly);
    const share = yearlyCostSharePerEvent(yearly); // 10
    const balance = calcEventBalance(events[0], share);

    const alice = report.rows.find((r) => r.memberId === "m1")!;
    const bob = report.rows.find((r) => r.memberId === "m2")!;

    expect(alice.performancePayouts).toBeCloseTo(balance.payoutPerMember);
    expect(alice.yearlyCostReimbursement).toBe(100);
    expect(alice.adminCompensation).toBe(0);
    expect(alice.total).toBeCloseTo(balance.payoutPerMember + 100);

    expect(bob.performancePayouts).toBeCloseTo(balance.payoutPerMember);
    expect(bob.adminCompensation).toBe(ADMIN_HOURLY_RATE);
    expect(bob.total).toBeCloseTo(balance.payoutPerMember + ADMIN_HOURLY_RATE);

    expect(report.totalDonations).toBeCloseTo(balance.donation);
  });

  it("ignores admin items and yearly items referencing an unknown member", () => {
    const yearly = makeYearly({
      items: [{ id: "y1", description: "x", invoiceDate: "2026-01-01", paidByMemberId: "ghost", amount: 50 }],
    });
    const events: BandEvent[] = [
      makeEvent({ adminItems: [{ id: "a1", memberId: "ghost", type: "Other", hours: 3, description: "" }] }),
    ];
    expect(() => calcAnnualReport(members, events, yearly)).not.toThrow();
    const report = calcAnnualReport(members, events, yearly);
    for (const row of report.rows) {
      expect(row.adminCompensation).toBe(0);
      expect(row.yearlyCostReimbursement).toBe(0);
    }
  });
});

describe("reportToCSV", () => {
  it("produces a header row, one row per member, and a donations footer", () => {
    const report = calcAnnualReport(
      [{ id: "m1", name: "Alice" }],
      [makeEvent({ memberIds: ["m1"], incomes: [{ id: "i1", source: "Cash", amount: 100 }] })],
      makeYearly()
    );
    const csv = reportToCSV(report);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Member,Performance,Admin,Reimbursement,Total");
    expect(lines[1]).toMatch(/^Alice,/);
    expect(lines[lines.length - 1]).toMatch(/^Total Donations \(10%\),10\.00$/);
  });

  it("quotes member names containing commas", () => {
    const report = calcAnnualReport([{ id: "m1", name: "Doe, Jane" }], [], makeYearly());
    const csv = reportToCSV(report);
    expect(csv).toContain('"Doe, Jane"');
  });
});
