import React, { useState } from 'react';
import {
  Wallet,
  Bell,
  Download,
  PlusCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { MONTH_NAMES_ID, formatRupiah, getBillUrgency } from '../utils/formatters';
import { BillReminder } from '../types/finance';

interface NavbarProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  bills: BillReminder[];
  onOpenTransactionModal: () => void;
  onOpenCashAdvanceModal: () => void;
  onOpenBillModal: () => void;
  onOpenExportModal: () => void;
  onResetDemoData: () => void;
  onPayBillDirectly: (bill: BillReminder) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  bills,
  onOpenTransactionModal,
  onOpenCashAdvanceModal,
  onOpenBillModal,
  onOpenExportModal,
  onResetDemoData,
  onPayBillDirectly,
}) => {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Compute urgent bills for current reference
  const urgentBills = bills
    .filter((b) => b.status === 'unpaid')
    .map((b) => ({
      ...b,
      urgency: getBillUrgency(b.dueDay, b.specificDueDate),
    }))
    .sort((a, b) => a.urgency.daysRemaining - b.urgency.daysRemaining);

  const overdueCount = urgentBills.filter((b) => b.urgency.isOverdue).length;
  const dueSoonCount = urgentBills.filter((b) => b.urgency.isDueSoon || b.urgency.isDueToday).length;
  const totalBadgeCount = urgentBills.length;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                  FinLapor
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  Keuangan & Kasbon
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pencatatan Harian, Realisasi Uang Muka & Tagihan Bulanan
              </p>
            </div>
          </div>

          {/* Center: Period Selector */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES_ID.map((month, idx) => (
                <option key={month} value={idx} className="bg-slate-800 text-white">
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer border-l border-slate-700 pl-2 ml-1"
            >
              <option value={2025} className="bg-slate-800 text-white">2025</option>
              <option value={2026} className="bg-slate-800 text-white">2026</option>
              <option value={2027} className="bg-slate-800 text-white">2027</option>
            </select>
          </div>

          {/* Right Actions: Notifications, Export, Add Transactions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bill Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 focus:outline-none"
                title="Pengingat Tagihan Jatuh Tempo"
              >
                <Bell className="w-5 h-5" />
                {totalBadgeCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold rounded-full text-white shadow-md ${
                      overdueCount > 0
                        ? 'bg-rose-600 animate-pulse'
                        : dueSoonCount > 0
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {totalBadgeCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotificationMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-sm text-white">
                          Pengingat Tagihan ({urgentBills.length})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowNotificationMenu(false);
                          onOpenBillModal();
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
                      >
                        + Tagihan
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                      {urgentBills.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                          <p className="text-sm font-medium text-slate-300">Semua Tagihan Sudah Lunas</p>
                          <p className="text-xs text-slate-500 mt-1">Tidak ada tagihan tertunggak bulan ini</p>
                        </div>
                      ) : (
                        urgentBills.map((bill) => (
                          <div
                            key={bill.id}
                            className="p-3 hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {bill.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-emerald-400">
                                  {formatRupiah(bill.amount)}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${bill.urgency.badgeClass}`}>
                                  {bill.urgency.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Jatuh Tempo: Tanggal {bill.dueDay} ({bill.category})
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                onPayBillDirectly(bill);
                                setShowNotificationMenu(false);
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors shrink-0 shadow-sm"
                            >
                              Bayar
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-center">
                      <p className="text-[11px] text-slate-400">
                        Notifikasi ini otomatis mengingatkan tagihan berulang setiap bulannya
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Export Button */}
            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-sm"
              title="Unduh Laporan Format PDF atau Excel"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Ekspor</span>
              <span className="text-slate-400 text-xs hidden lg:inline">(PDF/XLS)</span>
            </button>

            {/* Quick Add Dropdown / Action */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenTransactionModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-md shadow-emerald-950/40 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Transaksi</span>
              </button>
            </div>

            {/* Reset Demo Data button */}
            <button
              type="button"
              onClick={onResetDemoData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
              title="Reset ke Data Demo Awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
