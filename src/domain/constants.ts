/** CHF compensation per hour of admin work. */
export const ADMIN_HOURLY_RATE = 20;

/** Fraction of event income donated to charity, deducted before member payout. */
export const DONATION_RATE = 0.1;

export const INCOME_SOURCES = ["Twint direct", "Twint QR Code", "Cash"] as const;
export const EXPENSE_CATEGORIES = ["Venue rental", "Marketing", "Other"] as const;
export const ADMIN_WORK_TYPES = ["Marketing", "Organization", "Other"] as const;

export const STORAGE_KEY = "band-manager-pro/data/v1";

/** Default fixed CHF amount each event contributes to the shared cost pot. */
export const DEFAULT_CONTRIBUTION_PER_EVENT = 50;
