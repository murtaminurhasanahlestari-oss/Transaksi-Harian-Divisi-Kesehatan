import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  BellRing,
} from 'lucide-react';
import { formatRupiah, getBillUrgency } from '../utils/formatters';
import { Transaction, CashAdvance, BillReminder } from '../types/finance';

interface KPISummaryProps {
  transactions: Transaction[];
  cashAdvances: CashAdvance[];
  bills: BillReminder[];
  onTabSelect: (tab: 'transactions' | 'cash_advances' | 'bills' | 'analytics') => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  transactions,
  cashAdvances,
  bills,
  onTabSelect,
}) => {
  // 1. Transactions metrics
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // 2. Cash Advance metrics
  const totalOriginalAdvance = cashAdvances.reduce((acc, ca) => acc + ca.originalAmount, 0);
  const totalRealizedAdvance = cashAdvances.reduce((acc, ca) => acc + ca.realizedAmount, 0);
  const totalOutstandingAdvance = totalOriginalAdvance - totalRealizedAdvance;
  const activeAdvancesCount = cashAdvances.filter((ca) => ca.status !== 'settled').length;

  // 3. Bill metrics
  const unpaidBills = bills.filter((b) => b.status === 'unpaid');
  const totalUnpaidBills = unpaidBills.reduce((acc, b) => acc + b.amount, 0);
  
  const urgentBills = unpaidBills.map((b) => ({
    ...b,
    urgency: getBillUrgency(b.dueDay, b.specificDueDate),
  }));

  const overdueBills = urgentBills.filter((b) => b.urgency.isOverdue);
  const dueTodayOrSoonBills = urgentBills.filter((b) => b.urgency.isDueToday || b.urgency.isDueSoon);

  return (
    <div className="space-y-4">
      {/* High-priority Reminder Banner if any bill is overdue or due today/soon */}
      {(overdueBills.length > 0 || dueTodayOrSoonBills.length > 0) && (
        <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-800/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Pemberitahuan Pengingat Tagihan Aktif</span>
                  {overdueBills.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                      {overdueBills.length} Tagihan Terlambat!
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Terdapat {unpaidBills.length} tagihan bulan ini sebesar{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatRupiah(totalUnpaidBills)}
                  </span>{' '}
                  yang memerlukan pembayaran. Tagihan terdekat:{' '}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {urgentBills[0]?.title} ({urgentBills[0]?.urgency.label})
                  </span>
                  .
                </p>
              </div>
            </div>
            <button
              onClick={() => onTabSelect('bills')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors whitespace-nowrap self-start sm:self-center shadow-sm"
            >
              Lihat Tagihan
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Pemasukan
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(totalIncome)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Arus Kas Masuk</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-80" />
        </div>

        {/* Card 2: Total Realisasi Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Realisasi Pengeluaran
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatRupiah(totalExpense)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Pengeluaran Riil</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 opacity-80" />
        </div>

        {/* Card 3: Saldo Bersih (Surplus / Defisit) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo Bersih (Net)
            </span>
            <div className={`p-2 rounded-lg ${netBalance >= 0 ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl lg:text-2xl font-bold tracking-tight ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
              {formatRupiah(netBalance)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{netBalance >= 0 ? 'Surplus Finansial' : 'Defisit Anggaran'}</span>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${netBalance >= 0 ? 'bg-blue-500' : 'bg-rose-500'} opacity-80`} />
        </div>

        {/* Card 4: Uang Muka (Kasbon) Outstanding */}
        <div
          onClick={() => onTabSelect('cash_advances')}
          className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Uang Muka Outstanding
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {formatRupiah(totalOutstandingAdvance)}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{activeAdvancesCount} Kasbon Belum LPJ</span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
                Kelola &rarr;
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 opacity-80" />
        </div>

        {/* Card 5: Tagihan Jatuh Tempo */}
        <div
          onClick={() => onTabSelect('bills')}
          className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tagihan Jatuh Tempo
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatRupiah(totalUnpaidBills)}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{unpaidBills.length} Belum Dibayar</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                Rincian &rarr;
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 opacity-80" />
        </div>
      </div>
    </div>
  );
};
