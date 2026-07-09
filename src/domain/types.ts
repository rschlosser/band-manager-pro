export type Member = {
  id: string;
  name: string;
};

export type IncomeSource = "Twint direct" | "Twint QR Code" | "Cash";
export type ExpenseCategory = "Venue rental" | "Marketing" | "Other";
export type AdminWorkType = "Marketing" | "Organization" | "Other";

export type Income = {
  id: string;
  source: IncomeSource;
  amount: number;
};

export type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
};

export type AdminItem = {
  id: string;
  memberId: string;
  type: AdminWorkType;
  hours: number;
  description: string;
};

export type BandEvent = {
  id: string;
  name: string;
  date: string; // ISO yyyy-mm-dd
  memberIds: string[];
  incomes: Income[];
  expenses: Expense[];
  adminItems: AdminItem[];
  /**
   * This event's contribution to the shared cost pot, locked in when the
   * event is created (min of the configured per-event contribution and the
   * pot's outstanding balance at that moment). Later purchases never change
   * an already-created event.
   */
  costContribution: number;
};

export type YearlyCostItem = {
  id: string;
  description: string;
  invoiceDate: string; // ISO yyyy-mm-dd
  paidByMemberId: string;
  amount: number;
};

export type YearlySettings = {
  items: YearlyCostItem[];
  /** Fixed CHF amount each new event contributes to the shared cost pot. */
  contributionPerEvent: number;
};

export type AppData = {
  members: Member[];
  events: BandEvent[];
  yearly: YearlySettings;
};

/** Line-by-line waterfall for a single event's balance sheet. */
export type EventBalance = {
  income: number;
  expenses: number;
  costContribution: number;
  subtotal: number;
  donation: number;
  adminCompensation: number;
  netPayout: number;
  payoutPerMember: number;
  participantCount: number;
};

export type MemberReportRow = {
  memberId: string;
  name: string;
  performancePayouts: number;
  adminCompensation: number;
  yearlyCostReimbursement: number;
  total: number;
};

export type AnnualReport = {
  rows: MemberReportRow[];
  totalDonations: number;
  totalIncome: number;
};
