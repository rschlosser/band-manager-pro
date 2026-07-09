// TEMPORARY: one-shot demo data, seeded only when storage is completely empty.
// Remove this file (and its use in useStore.hydrate) once the demo data has
// landed on the device — it persists via the normal save path afterwards.
import { AppData } from "../domain/types";

export function seedData(): AppData {
  const anna = "seed-anna";
  const ben = "seed-ben";
  const clara = "seed-clara";
  return {
    members: [
      { id: anna, name: "Anna" },
      { id: ben, name: "Ben" },
      { id: clara, name: "Clara" },
    ],
    yearly: {
      contributionPerEvent: 50,
      items: [
        {
          id: "seed-y1",
          description: "Harmonium maintenance",
          invoiceDate: "2026-07-09",
          paidByMemberId: anna,
          amount: 500,
        },
      ],
    },
    events: [
      {
        id: "seed-e1",
        name: "Kirtan Night",
        date: "2026-07-09",
        costContribution: 50,
        memberIds: [anna, ben],
        incomes: [{ id: "seed-i1", source: "Twint direct", amount: 400 }],
        expenses: [{ id: "seed-x1", category: "Venue rental", description: "", amount: 80 }],
        adminItems: [{ id: "seed-a1", memberId: ben, type: "Organization", hours: 2, description: "" }],
      },
    ],
  };
}
