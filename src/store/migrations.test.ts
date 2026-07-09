import { DEFAULT_CONTRIBUTION_PER_EVENT } from "../domain/constants";
import { migratePersistedData } from "./migrations";

describe("migratePersistedData", () => {
  it("returns null for garbage input", () => {
    expect(migratePersistedData(null)).toBeNull();
    expect(migratePersistedData("nope")).toBeNull();
    expect(migratePersistedData({})).toBeNull();
  });

  it("passes current-shape data through unchanged", () => {
    const data = {
      members: [{ id: "m1", name: "Anna" }],
      events: [{ id: "e1", name: "X", date: "", memberIds: [], incomes: [], expenses: [], adminItems: [], costContribution: 50 }],
      yearly: { items: [], contributionPerEvent: 50 },
    };
    expect(migratePersistedData(data)).toEqual(data);
  });

  it("converts the v1 distribute-over-N shape into the pot model", () => {
    const v1 = {
      members: [],
      events: [{ id: "e1", name: "X", date: "", memberIds: [], incomes: [], expenses: [], adminItems: [] }],
      yearly: {
        items: [{ id: "y1", description: "PA", invoiceDate: "", paidByMemberId: "m1", amount: 500 }],
        distributeOverEvents: 10,
      },
    };
    const migrated = migratePersistedData(v1)!;
    // old share (500 / 10) becomes both the per-event contribution and the
    // locked-in contribution of every pre-existing event
    expect(migrated.yearly.contributionPerEvent).toBe(50);
    expect(migrated.events[0].costContribution).toBe(50);
    expect((migrated.yearly as Record<string, unknown>).distributeOverEvents).toBeUndefined();
  });

  it("falls back to the default contribution when v1 had no costs yet", () => {
    const v1 = {
      members: [],
      events: [],
      yearly: { items: [], distributeOverEvents: 10 },
    };
    const migrated = migratePersistedData(v1)!;
    expect(migrated.yearly.contributionPerEvent).toBe(DEFAULT_CONTRIBUTION_PER_EVENT);
  });
});
