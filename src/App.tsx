import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Calendar,
  BarChart3,
  Briefcase,
  Clock,
  PlusCircle,
  Download,
  Receipt,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Transaction,
  CashAdvance,
  BillReminder,
  BudgetCategory,
} from './types/finance';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_CASH_ADVANCES,
  INITIAL_BILLS,
  INITIAL_BUDGETS,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { KPISummary } from './components/KPISummary';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TransactionList } from './components/TransactionList';
import { CashAdvanceManager } from './components/CashAdvanceManager';
import { BillReminderManager } from './components/BillReminderManager';
import { TransactionModal } from './components/modals/TransactionModal';
import { CashAdvanceModal } from './components/modals/CashAdvanceModal';
import { SettlementModal } from './components/modals/SettlementModal';
import { BillModal } from './components/modals/BillModal';
import { ExportModal } from './components/modals/ExportModal';
import { MONTH_NAMES_ID } from './utils/formatters';

const STORAGE_KEY_TX = 'finlapor_transactions_v2_dkes';
const STORAGE_KEY_CA = 'finlapor_cash_advances_v2_dkes';
const STORAGE_KEY_BILLS = 'finlapor_bills_v2_dkes';
const STORAGE_KEY_BUDGETS = 'finlapor_budgets_v2_dkes';

export default function App() {
  // Current date reference: October 2026
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 0-indexed: 9 = Oktober
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<'transactions' | 'cash_advances' | 'bills' | 'analytics'>('transactions');

  // Primary state with localStorage persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CA);
      return saved ? JSON.parse(saved) : INITIAL_CASH_ADVANCES;
    } catch {
      return INITIAL_CASH_ADVANCES;
    }
  });

  const [bills, setBills] = useState<BillReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BILLS);
      return saved ? JSON.parse(saved) : INITIAL_BILLS;
    } catch {
      return INITIAL_BILLS;
    }
  });

  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGETS);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CA, JSON.stringify(cashAdvances));
    } catch (e) {
      console.error(e);
    }
  }, [cashAdvances]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BILLS, JSON.stringify(bills));
    } catch (e) {
      console.error(e);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error(e);
    }
  }, [budgets]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isCaModalOpen, setIsCaModalOpen] = useState(false);
  const [editingCa, setEditingCa] = useState<CashAdvance | null>(null);

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [targetCaForSettlement, setTargetCaForSettlement] = useState<CashAdvance | null>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillReminder | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter transactions for current selected month & year
  const currentMonthTransactions = transactions.filter((t) => {
    const parts = t.date.split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === selectedYear && m === selectedMonth;
  });

  // 1. Transaction Handlers
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id'>,
    editId?: string
  ) => {
    if (editId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editId ? { ...txData, id: editId } : t))
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Cash Advance Handlers
  const handleSaveCashAdvance = (
    caData: Omit<CashAdvance, 'id' | 'realizedAmount' | 'settlements' | 'status'>,
    logToTransactions: boolean,
    editId?: string
  ) => {
    if (editId) {
      setCashAdvances((prev) =>
        prev.map((ca) =>
          ca.id === editId
            ? {
                ...ca,
                ...caData,
                status:
                  ca.realizedAmount >= caData.originalAmount
                    ? 'settled'
                    : ca.realizedAmount > 0
                    ? 'partially_settled'
                    : 'outstanding',
              }
            : ca
        )
      );
    } else {
      const newCaId = `ca-${Date.now()}`;
      const newCa: CashAdvance = {
        ...caData,
        id: newCaId,
        realizedAmount: 0,
        settlements: [],
        status: 'outstanding',
      };
      setCashAdvances((prev) => [newCa, ...prev]);

      // Automatically add expense transaction if requested
      if (logToTransactions) {
        const caTx: Transaction = {
          id: `tx-ca-${Date.now()}`,
          date: caData.date,
          type: 'expense',
          category: 'Pengeluaran Kasbon / Uang Muka',
          amount: caData.originalAmount,
          paymentMethod: 'Kas Tunai (Petty Cash)',
          description: `Pencairan Uang Muka / Kasbon: ${caData.recipientName} (${caData.purpose})`,
          refNumber: `UM-${newCaId.slice(-4)}`,
          notes: caData.notes,
        };
        setTransactions((prev) => [caTx, ...prev]);
      }
    }
  };

  const handleDeleteCashAdvance = (id: string) => {
    setCashAdvances((prev) => prev.filter((ca) => ca.id !== id));
  };

  // 3. Settlement (LPJ Realization) Handler
  const handleSaveSettlement = (
    cashAdvanceId: string,
    settlementData: {
      date: string;
      amount: number;
      description: string;
      refNumber?: string;
    },
    logToTransactions: boolean
  ) => {
    const settlementId = `set-${Date.now()}`;
    const newSettlement = {
      ...settlementData,
      id: settlementId,
    };

    let targetCaName = '';

    setCashAdvances((prev) =>
      prev.map((ca) => {
        if (ca.id !== cashAdvanceId) return ca;
        targetCaName = ca.recipientName;
        const newRealized = ca.realizedAmount + settlementData.amount;
        const newStatus =
          newRealized >= ca.originalAmount
            ? 'settled'
            : 'partially_settled';

        return {
          ...ca,
          realizedAmount: newRealized,
          settlements: [newSettlement, ...ca.settlements],
          status: newStatus,
        };
      })
    );

    // If checked, log to daily transactions
    if (logToTransactions) {
      const settleTx: Transaction = {
        id: `tx-settle-${Date.now()}`,
        date: settlementData.date,
        type: 'expense',
        category: 'Operasional & Utilitas (Listrik/Air/Net)',
        amount: settlementData.amount,
        paymentMethod: 'Kas Tunai (Petty Cash)',
        description: `Realisasi LPJ Kasbon (${targetCaName}): ${settlementData.description}`,
        refNumber: settlementData.refNumber,
        cashAdvanceId,
      };
      setTransactions((prev) => [settleTx, ...prev]);
    }
  };

  const handleDirectSettlementToggle = (id: string) => {
    setCashAdvances((prev) =>
      prev.map((ca) => {
        if (ca.id !== id) return ca;
        const remaining = ca.originalAmount - ca.realizedAmount;
        const finalSettlement = {
          id: `set-close-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: remaining,
          description: 'Penyelesaian / Pelunasan Sisa LPJ Kasbon',
          refNumber: 'AUTO-SETTLE',
        };
        return {
          ...ca,
          realizedAmount: ca.originalAmount,
          settlements: [finalSettlement, ...ca.settlements],
          status: 'settled',
        };
      })
    );
  };

  // 4. Bill Handlers
  const handleSaveBill = (
    billData: Omit<BillReminder, 'id' | 'status'>,
    editId?: string
  ) => {
    if (editId) {
      setBills((prev) =>
        prev.map((b) => (b.id === editId ? { ...b, ...billData } : b))
      );
    } else {
      const newBill: BillReminder = {
        ...billData,
        id: `bill-${Date.now()}`,
        status: 'unpaid',
      };
      setBills((prev) => [newBill, ...prev]);
    }
  };

  const handleDeleteBill = (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggleBillStatus = (id: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const isCurrentlyPaid = b.status === 'paid';
        return {
          ...b,
          status: isCurrentlyPaid ? 'unpaid' : 'paid',
          paidDate: isCurrentlyPaid ? undefined : new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const handlePayBillWithExpense = (bill: BillReminder) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Mark bill as paid
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? {
              ...b,
              status: 'paid',
              paidDate: today,
            }
          : b
      )
    );

    // 2. Automatically record in transactions
    const billTx: Transaction = {
      id: `tx-bill-${Date.now()}`,
      date: today,
      type: 'expense',
      category: bill.category,
      amount: bill.amount,
      paymentMethod: 'Transfer Bank BCA',
      description: `Pembayaran ${bill.title}`,
      refNumber: `BILL-${bill.id.slice(-4)}`,
      notes: bill.notes,
    };
    setTransactions((prev) => [billTx, ...prev]);
  };

  // 5. Reset Demo Data
  const handleResetDemoData = () => {
    if (confirm('Kembalikan seluruh data ke contoh demo awal?')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setCashAdvances(INITIAL_CASH_ADVANCES);
      setBills(INITIAL_BILLS);
      setBudgets(INITIAL_BUDGETS);
      localStorage.removeItem(STORAGE_KEY_TX);
      localStorage.removeItem(STORAGE_KEY_CA);
      localStorage.removeItem(STORAGE_KEY_BILLS);
      localStorage.removeItem(STORAGE_KEY_BUDGETS);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-16">
      {/* Navbar with Period Selector, Notifications, Export & Actions */}
      <Navbar
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        bills={bills}
        onOpenTransactionModal={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenCashAdvanceModal={() => {
          setEditingCa(null);
          setIsCaModalOpen(true);
        }}
        onOpenBillModal={() => {
          setEditingBill(null);
          setIsBillModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetDemoData={handleResetDemoData}
        onPayBillDirectly={handlePayBillWithExpense}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <KPISummary
          transactions={currentMonthTransactions}
          cashAdvances={cashAdvances}
          bills={bills}
          onTabSelect={setActiveTab}
        />

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Buku Kas Harian</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/15">
                {currentMonthTransactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cash_advances')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'cash_advances'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Uang Muka & Kasbon</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/15">
                {cashAdvances.filter((c) => c.status !== 'settled').length} Outstanding
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'bills'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pengingat Tagihan</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-black/15">
                {bills.filter((b) => b.status === 'unpaid').length} Pending
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-950/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Grafik Analitik</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Periode Aktif:</span>
            <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
              {MONTH_NAMES_ID[selectedMonth]} {selectedYear}
            </span>
          </div>
        </div>

        {/* Tab 1: Daily Transactions List */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <TransactionList
              transactions={currentMonthTransactions}
              onAddTransaction={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />

            {/* Quick mini analytics preview inside transactions */}
            <div className="pt-2">
              <AnalyticsCharts
                transactions={currentMonthTransactions}
                budgets={budgets}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Cash Advance Manager */}
        {activeTab === 'cash_advances' && (
          <CashAdvanceManager
            cashAdvances={cashAdvances}
            onOpenNewAdvanceModal={() => {
              setEditingCa(null);
              setIsCaModalOpen(true);
            }}
            onOpenSettleModal={(ca) => {
              setTargetCaForSettlement(ca);
              setIsSettlementModalOpen(true);
            }}
            onEditAdvance={(ca) => {
              setEditingCa(ca);
              setIsCaModalOpen(true);
            }}
            onDeleteAdvance={handleDeleteCashAdvance}
            onDirectSettlementToggle={handleDirectSettlementToggle}
          />
        )}

        {/* Tab 3: Bill Reminder Manager */}
        {activeTab === 'bills' && (
          <BillReminderManager
            bills={bills}
            onOpenNewBillModal={() => {
              setEditingBill(null);
              setIsBillModalOpen(true);
            }}
            onEditBill={(bill) => {
              setEditingBill(bill);
              setIsBillModalOpen(true);
            }}
            onDeleteBill={handleDeleteBill}
            onPayBillWithExpense={handlePayBillWithExpense}
            onToggleStatus={handleToggleBillStatus}
          />
        )}

        {/* Tab 4: Full Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsCharts
            transactions={currentMonthTransactions}
            budgets={budgets}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTx}
        defaultDate={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-19`}
      />

      <CashAdvanceModal
        isOpen={isCaModalOpen}
        onClose={() => setIsCaModalOpen(false)}
        onSave={handleSaveCashAdvance}
        initialData={editingCa}
        defaultDate={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-19`}
      />

      <SettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => {
          setIsSettlementModalOpen(false);
          setTargetCaForSettlement(null);
        }}
        cashAdvance={targetCaForSettlement}
        onSaveSettlement={handleSaveSettlement}
      />

      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onSave={handleSaveBill}
        initialData={editingBill}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        cashAdvances={cashAdvances}
        bills={bills}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />
    </div>
  );
}
