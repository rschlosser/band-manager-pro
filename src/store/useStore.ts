import { create } from "zustand";
import { contributionForNewEvent } from "../domain/calc";
import { DEFAULT_CONTRIBUTION_PER_EVENT } from "../domain/constants";
import { uid } from "../domain/format";
import { AdminItem, AppData, Expense, Income, YearlyCostItem } from "../domain/types";
import { asyncStorageRepository } from "./asyncStorageRepository";
import { DataRepository } from "./repository";
import { seedData } from "./seedData";

// The repository currently backing the store. Defaults to local-only
// storage; the root layout swaps this for a cloud repository once the user
// has signed in and selected a band (see hydrate()).
let activeRepository: DataRepository = asyncStorageRepository;

function isEmptyData(data: AppData): boolean {
  return data.members.length === 0 && data.events.length === 0 && data.yearly.items.length === 0;
}

type StoreState = AppData & {
  hydrated: boolean;
  /**
   * Loads from `repository` (default: local storage) and makes it the store's
   * active repository, so subsequent writes go there too. Passing a new
   * repository re-hydrates even if already hydrated — that's how switching
   * from local-only to a synced band works after sign-in.
   */
  hydrate: (repository?: DataRepository) => Promise<void>;

  addMember: (name: string) => void;
  deleteMember: (id: string) => void;

  addEvent: (input: { name: string; date: string; memberIds: string[] }) => string;
  deleteEvent: (id: string) => void;
  toggleEventMember: (eventId: string, memberId: string) => void;

  addIncome: (eventId: string, income: Omit<Income, "id">) => void;
  deleteIncome: (eventId: string, incomeId: string) => void;

  addExpense: (eventId: string, expense: Omit<Expense, "id">) => void;
  deleteExpense: (eventId: string, expenseId: string) => void;

  addAdminItem: (eventId: string, item: Omit<AdminItem, "id">) => void;
  deleteAdminItem: (eventId: string, itemId: string) => void;

  addYearlyItem: (item: Omit<YearlyCostItem, "id">) => void;
  deleteYearlyItem: (id: string) => void;
  setContributionPerEvent: (amount: number) => void;
};

const emptyData = (): AppData => ({
  members: [],
  events: [],
  yearly: { items: [], contributionPerEvent: DEFAULT_CONTRIBUTION_PER_EVENT },
});

export const useStore = create<StoreState>()((set, get) => ({
  ...emptyData(),
  hydrated: false,

  hydrate: async (repository) => {
    // No repository passed means "reload from whatever is currently active"
    // (e.g. pull-to-refresh) rather than resetting to local-only storage.
    const targetRepository = repository ?? activeRepository;
    activeRepository = targetRepository;
    set({ hydrated: false });
    let data = await targetRepository.load();
    // Demo seed only applies to the local, pre-sign-in experience — a freshly
    // created cloud band should start genuinely empty, not with Anna/Ben/Clara.
    if (targetRepository === asyncStorageRepository && (!data || isEmptyData(data))) {
      data = seedData();
      await targetRepository.save(data);
    }
    set({ ...(data ?? { members: [], events: [], yearly: { items: [], contributionPerEvent: DEFAULT_CONTRIBUTION_PER_EVENT } }), hydrated: true });
  },

  addMember: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({ members: [...s.members, { id: uid(), name: trimmed }] }));
  },
  deleteMember: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),

  addEvent: ({ name, date, memberIds }) => {
    const id = uid();
    set((s) => ({
      events: [
        ...s.events,
        {
          id,
          name: name.trim(),
          date,
          memberIds,
          incomes: [],
          expenses: [],
          adminItems: [],
          // Locked in at creation: later purchases never change this event.
          costContribution: contributionForNewEvent(s.yearly, s.events),
        },
      ],
    }));
    return id;
  },
  deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  toggleEventMember: (eventId, memberId) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.id !== eventId
          ? e
          : {
              ...e,
              memberIds: e.memberIds.includes(memberId)
                ? e.memberIds.filter((m) => m !== memberId)
                : [...e.memberIds, memberId],
            }
      ),
    })),

  addIncome: (eventId, income) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, incomes: [...e.incomes, { ...income, id: uid() }] } : e)),
    })),
  deleteIncome: (eventId, incomeId) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, incomes: e.incomes.filter((i) => i.id !== incomeId) } : e)),
    })),

  addExpense: (eventId, expense) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, expenses: [...e.expenses, { ...expense, id: uid() }] } : e)),
    })),
  deleteExpense: (eventId, expenseId) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, expenses: e.expenses.filter((x) => x.id !== expenseId) } : e)),
    })),

  addAdminItem: (eventId, item) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, adminItems: [...e.adminItems, { ...item, id: uid() }] } : e)),
    })),
  deleteAdminItem: (eventId, itemId) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === eventId ? { ...e, adminItems: e.adminItems.filter((a) => a.id !== itemId) } : e)),
    })),

  addYearlyItem: (item) =>
    set((s) => ({ yearly: { ...s.yearly, items: [...s.yearly.items, { ...item, id: uid() }] } })),
  deleteYearlyItem: (id) =>
    set((s) => ({ yearly: { ...s.yearly, items: s.yearly.items.filter((i) => i.id !== id) } })),
  setContributionPerEvent: (amount) =>
    set((s) => ({ yearly: { ...s.yearly, contributionPerEvent: Math.max(0, amount) || 0 } })),
}));

// Persist to the repository whenever the domain data changes, once hydration has completed.
useStore.subscribe((state, prevState) => {
  if (!state.hydrated) return;
  if (state.members === prevState.members && state.events === prevState.events && state.yearly === prevState.yearly) {
    return;
  }
  activeRepository.save({ members: state.members, events: state.events, yearly: state.yearly });
});
