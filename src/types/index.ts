export type TransactionType = 'RECEIVABLE' | 'PAYABLE';

export type TransactionSubType =
  | 'GIVEN'            // Money given / Lent (They owe me)
  | 'PAYMENT_RECEIVED' // Payment received / Settlement from them (Reduces debt, NEVER "I owe them")
  | 'BORROWED'         // Money borrowed (I owe them)
  | 'PAYMENT_PAID'     // Payment paid / Settlement to them (Reduces debt, NEVER "They owe me")
  | 'SETTLEMENT';      // Settlement payment

export interface Person {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  avatarColor?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  person_id: string;
  amount: number;
  type: TransactionType; // 'RECEIVABLE' or 'PAYABLE' (mathematical effect)
  subType?: TransactionSubType; // Explicit semantic intent
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  note?: string;
  created_at: string;
  updated_at: string;
}

export type BalanceStatus = 'THEY_OWE_ME' | 'I_OWE_THEM' | 'SETTLED';

export interface PersonBalance {
  person: Person;
  receivableTotal: number; // Net pending amount they owe me (or 0 if I owe them or settled)
  payableTotal: number;    // Net pending amount I owe them (or 0 if they owe me or settled)
  totalGiven: number;      // Total money lent/given to this person
  totalReceived: number;   // Total payment received / settled by this person (NEVER "I owe them")
  totalBorrowed: number;   // Total money borrowed from this person
  totalPaid: number;       // Total payment paid / settled to this person
  netBalance: number;      // Net balance (positive = they owe me, negative = I owe them, 0 = settled)
  status: BalanceStatus;
  transactionCount: number;
  lastActivityDate?: string;
}

export interface OverallSummary {
  peopleOweMe: number; // Sum of positive person balances
  iOwePeople: number;  // Sum of absolute values of negative person balances
  netBalance: number;  // peopleOweMe - iOwePeople
  totalReceivableTransactions: number;
  totalPayableTransactions: number;
  totalSettlementTransactions?: number;
  totalPeople: number;
  settledCount: number;
  activeCount: number;
}

export interface AppSettings {
  currencyCode: string;
  currencySymbol: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  theme: 'light' | 'dark' | 'system';
  pinLockEnabled: boolean;
  pinCode?: string;
  autoLockMinutes?: number;
}

export type TabType = 'home' | 'people' | 'reports' | 'settings';
