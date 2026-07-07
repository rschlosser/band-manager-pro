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
  distributeOverEvents: number;
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
  yearlyCostShare: number;
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
