export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  paymentMethod: string;
  description: string;
  refNumber?: string;
  notes?: string;
  cashAdvanceId?: string; // Optional reference if realized from a cash advance
  coa?: string; // Chart of Account code, e.g. 1.6.1, 5.9
  accountName?: string; // e.g. Kas Bank Program BSM
  recipient?: string; // Penerima / Rekanan
  debit?: number;
  credit?: number;
}

export interface CashAdvanceSettlement {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  refNumber?: string;
}

export type CashAdvanceStatus = 'outstanding' | 'partially_settled' | 'settled';

export interface CashAdvance {
  id: string;
  date: string; // YYYY-MM-DD
  recipientName: string;
  departmentOrRole?: string;
  purpose: string;
  originalAmount: number; // Jumlah Uang Muka Awal
  realizedAmount: number; // Total Realisasi yang telah dilaporkan (LPJ)
  settlements: CashAdvanceSettlement[];
  status: CashAdvanceStatus;
  dueDate?: string; // Target tanggal penyelesaian LPJ
  notes?: string;
}

export type BillStatus = 'unpaid' | 'paid';

export interface BillReminder {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDay: number; // 1-31 (Day of month)
  specificDueDate?: string; // YYYY-MM-DD for this month
  frequency: 'monthly' | 'one_time';
  status: BillStatus;
  paidDate?: string;
  autoRemindDaysBefore: number; // e.g. 3 or 7 days
  notes?: string;
}

export interface BudgetCategory {
  category: string;
  allocatedAmount: number;
}
