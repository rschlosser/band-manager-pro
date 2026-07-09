import {
  calcAnnualReport,
  calcEventBalance,
  calcTotals,
  contributedSoFar,
  contributionForNewEvent,
  eventsRemainingToRecover,
  outstandingSharedCosts,
  reportToCSV,
  totalYearlyCosts,
} from "./calc";
import { ADMIN_HOURLY_RATE, DONATION_RATE } from "./constants";
import { BandEvent, Member, YearlyCostItem, YearlySettings } from "./types";

function makeEvent(overrides: Partial<BandEvent> = {}): BandEvent {
  return {
    id: "e1",
    name: "Kirtan Night",
    date: "2026-01-10",
    memberIds: [],
    incomes: [],
    expenses: [],
    adminItems: [],
    costContribution: 0,
    ...overrides,
  };
}

function makeYearlyItem(amount: number, overrides: Partial<YearlyCostItem> = {}): YearlyCostItem {
  return { id: "y-" + amount, description: "item", invoiceDate: "2026-01-01", paidByMemberId: "m1", amount, ...overrides };
}

function makeYearly(overrides: Partial<YearlySettings> = {}): YearlySettings {
  return { items: [], contributionPerEvent: 50, ...overrides };
}

describe("shared cost pot", () => {
  it("outstanding equals total purchases when no event has contributed yet", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(500)] });
    expect(totalYearlyCosts(yearly)).toBe(500);
    expect(outstandingSharedCosts(yearly, [])).toBe(500);
  });

  it("each event's locked-in contribution reduces the outstanding balance", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(500)] });
    const events = [makeEvent({ id: "e1", costContribution: 50 }), makeEvent({ id: "e2", costContribution: 50 })];
    expect(contributedSoFar(events)).toBe(100);
    expect(outstandingSharedCosts(yearly, events)).toBe(400);
  });

  it("a mid-year purchase grows the pot without touching existing events", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(500)] });
    const events = [makeEvent({ id: "e1", costContribution: 50 })];
    const before = calcEventBalance(events[0]);

    const grown = makeYearly({ items: [makeYearlyItem(500), makeYearlyItem(100, { id: "y-new" })] });
    const after = calcEventBalance(events[0]);

    expect(outstandingSharedCosts(grown, events)).toBe(550);
    // the already-created event's numbers are identical before and after
    expect(after).toEqual(before);
  });

  it("a new event contributes the fixed amount while the pot covers it", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(500)], contributionPerEvent: 50 });
    expect(contributionForNewEvent(yearly, [])).toBe(50);
  });

  it("the last contribution is capped at what is still outstanding", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(120)], contributionPerEvent: 50 });
    const events = [makeEvent({ id: "e1", costContribution: 50 }), makeEvent({ id: "e2", costContribution: 50 })];
    expect(outstandingSharedCosts(yearly, events)).toBe(20);
    expect(contributionForNewEvent(yearly, events)).toBe(20);
  });

  it("an empty pot means new events contribute nothing", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(100)], contributionPerEvent: 50 });
    const events = [makeEvent({ id: "e1", costContribution: 100 })];
    expect(contributionForNewEvent(yearly, events)).toBe(0);
  });

  it("outstanding never goes negative when cost items are deleted after contributions", () => {
    const yearly = makeYearly({ items: [] });
    const events = [makeEvent({ costContribution: 50 })];
    expect(outstandingSharedCosts(yearly, events)).toBe(0);
    expect(contributionForNewEvent(yearly, events)).toBe(0);
  });

  it("a negative configured contribution is treated as 0", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(100)], contributionPerEvent: -10 });
    expect(contributionForNewEvent(yearly, [])).toBe(0);
  });
});

describe("eventsRemainingToRecover", () => {
  it("rounds up to whole events", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(500)], contributionPerEvent: 50 });
    const events = [makeEvent({ costContribution: 50 })];
    // 450 outstanding / 50 per event = 9
    expect(eventsRemainingToRecover(yearly, events)).toBe(9);
    const oddYearly = makeYearly({ items: [makeYearlyItem(510)], contributionPerEvent: 50 });
    expect(eventsRemainingToRecover(oddYearly, events)).toBe(10); // ceil(460 / 50)
  });

  it("returns 0 once the pot is settled", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(50)], contributionPerEvent: 50 });
    expect(eventsRemainingToRecover(yearly, [makeEvent({ costContribution: 50 })])).toBe(0);
    expect(eventsRemainingToRecover(makeYearly(), [])).toBe(0);
  });

  it("returns null when contribution is 0 but costs are outstanding", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(100)], contributionPerEvent: 0 });
    expect(eventsRemainingToRecover(yearly, [])).toBeNull();
  });
});

describe("calcEventBalance", () => {
  it("computes the full waterfall in the specified order", () => {
    const event = makeEvent({
      memberIds: ["m1", "m2"],
      costContribution: 30,
      incomes: [
        { id: "i1", source: "Twint direct", amount: 300 },
        { id: "i2", source: "Cash", amount: 100 },
      ],
      expenses: [{ id: "x1", category: "Venue rental", description: "", amount: 80 }],
      adminItems: [{ id: "a1", memberId: "m1", type: "Marketing", hours: 2, description: "" }],
    });
    const balance = calcEventBalance(event);

    expect(balance.income).toBe(400);
    expect(balance.expenses).toBe(80);
    expect(balance.costContribution).toBe(30);
    // subtotal = 400 - 80 - 30 = 290
    expect(balance.subtotal).toBe(290);
    // donation = 10% of income = 40
    expect(balance.donation).toBeCloseTo(400 * DONATION_RATE);
    // admin = 2h * 20 = 40
    expect(balance.adminCompensation).toBe(2 * ADMIN_HOURLY_RATE);
    // net = 290 - 40 - 40 = 210
    expect(balance.netPayout).toBeCloseTo(210);
    expect(balance.payoutPerMember).toBeCloseTo(105);
    expect(balance.participantCount).toBe(2);
  });

  it("donation is based on income only, unaffected by expenses or the pot contribution", () => {
    const event = makeEvent({
      costContribution: 500,
      incomes: [{ id: "i1", source: "Cash", amount: 1000 }],
      expenses: [{ id: "x1", category: "Other", description: "", amount: 900 }],
    });
    expect(calcEventBalance(event).donation).toBeCloseTo(100);
  });

  it("returns 0 payout per member when there are no participating members", () => {
    const event = makeEvent({
      memberIds: [],
      incomes: [{ id: "i1", source: "Cash", amount: 200 }],
    });
    const balance = calcEventBalance(event);
    expect(balance.participantCount).toBe(0);
    expect(balance.payoutPerMember).toBe(0);
    expect(balance.netPayout).toBeCloseTo(200 - 20);
  });

  it("allows a negative net payout when costs exceed income", () => {
    const event = makeEvent({
      memberIds: ["m1"],
      costContribution: 40,
      incomes: [{ id: "i1", source: "Cash", amount: 50 }],
      expenses: [{ id: "x1", category: "Venue rental", description: "", amount: 200 }],
    });
    const balance = calcEventBalance(event);
    expect(balance.netPayout).toBeLessThan(0);
    expect(balance.payoutPerMember).toBeLessThan(0);
  });

  it("returns an all-zero balance for a completely empty event", () => {
    expect(calcEventBalance(makeEvent())).toMatchObject({
      income: 0,
      expenses: 0,
      costContribution: 0,
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
    expect(calcTotals([])).toEqual({ totalIncome: 0, totalDonations: 0 });
  });

  it("sums income and donations across multiple events", () => {
    const events = [
      makeEvent({ id: "e1", incomes: [{ id: "i1", source: "Cash", amount: 100 }] }),
      makeEvent({ id: "e2", incomes: [{ id: "i2", source: "Cash", amount: 200 }] }),
    ];
    const totals = calcTotals(events);
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
    }
    expect(report.totalDonations).toBe(0);
    expect(report.totalIncome).toBe(0);
  });

  it("returns an empty row list for zero members", () => {
    const report = calcAnnualReport([], [makeEvent({ incomes: [{ id: "i1", source: "Cash", amount: 100 }] })], makeYearly());
    expect(report.rows).toHaveLength(0);
    expect(report.totalIncome).toBe(100);
  });

  it("aggregates performance payouts, admin pay, and reimbursements per member", () => {
    const yearly = makeYearly({ items: [makeYearlyItem(100, { id: "y1", description: "PA system" })] });
    const events: BandEvent[] = [
      makeEvent({
        id: "e1",
        memberIds: ["m1", "m2"],
        costContribution: 10,
        incomes: [{ id: "i1", source: "Cash", amount: 220 }],
        adminItems: [{ id: "a1", memberId: "m2", type: "Organization", hours: 1, description: "" }],
      }),
    ];
    const report = calcAnnualReport(members, events, yearly);
    const balance = calcEventBalance(events[0]);

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
    const yearly = makeYearly({ items: [makeYearlyItem(50, { paidByMemberId: "ghost" })] });
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
