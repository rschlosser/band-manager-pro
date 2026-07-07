import { create } from "zustand";
import { DEFAULT_DISTRIBUTE_OVER_EVENTS } from "../domain/constants";
import { uid } from "../domain/format";
import { AdminItem, AppData, Expense, Income, YearlyCostItem } from "../domain/types";
import { asyncStorageRepository } from "./asyncStorageRepository";

type StoreState = AppData & {
  hydrated: boolean;
  hydrate: () => Promise<void>;

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
  setDistributeOverEvents: (n: number) => void;
};

const emptyData = (): AppData => ({
  members: [],
  events: [],
  yearly: { items: [], distributeOverEvents: DEFAULT_DISTRIBUTE_OVER_EVENTS },
});

export const useStore = create<StoreState>()((set, get) => ({
  ...emptyData(),
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const data = await asyncStorageRepository.load();
    set({ ...(data ?? emptyData()), hydrated: true });
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
        { id, name: name.trim(), date, memberIds, incomes: [], expenses: [], adminItems: [] },
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
  setDistributeOverEvents: (n) =>
    set((s) => ({ yearly: { ...s.yearly, distributeOverEvents: Math.max(1, Math.round(n) || 1) } })),
}));

// Persist to the repository whenever the domain data changes, once hydration has completed.
useStore.subscribe((state, prevState) => {
  if (!state.hydrated) return;
  if (state.members === prevState.members && state.events === prevState.events && state.yearly === prevState.yearly) {
    return;
  }
  asyncStorageRepository.save({ members: state.members, events: state.events, yearly: state.yearly });
});
