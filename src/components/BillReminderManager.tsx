import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Calendar,
  CreditCard,
  Check,
  Edit2,
  Trash2,
  Repeat,
  DollarSign,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { BillReminder, BillStatus } from '../types/finance';
import { formatRupiah, getBillUrgency } from '../utils/formatters';

interface BillReminderManagerProps {
  bills: BillReminder[];
  onOpenNewBillModal: () => void;
  onEditBill: (bill: BillReminder) => void;
  onDeleteBill: (id: string) => void;
  onPayBillWithExpense: (bill: BillReminder) => void;
  onToggleStatus: (id: string) => void;
}

export const BillReminderManager: React.FC<BillReminderManagerProps> = ({
  bills,
  onOpenNewBillModal,
  onEditBill,
  onDeleteBill,
  onPayBillWithExpense,
  onToggleStatus,
}) => {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleRequestNotif = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser Anda tidak mendukung Web Notifications API.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setBrowserNotifEnabled(true);
      new Notification('FinLapor Pengingat Aktif!', {
        body: 'Anda akan menerima pengingat berkala untuk tagihan yang akan jatuh tempo.',
        icon: '/favicon.ico',
      });
    }
  };

  // Add urgency data
  const billsWithUrgency = bills.map((b) => ({
    ...b,
    urgency: getBillUrgency(b.dueDay, b.specificDueDate),
  }));

  // Filtered and sorted: Overdue first, then due today, then due soon, then later, paid at bottom
  const filteredBills = billsWithUrgency
    .filter((b) => {
      if (filter === 'unpaid') return b.status === 'unpaid';
      if (filter === 'paid') return b.status === 'paid';
      return true;
    })
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'unpaid' ? -1 : 1;
      }
      return a.urgency.daysRemaining - b.urgency.daysRemaining;
    });

  const unpaidCount = bills.filter((b) => b.status === 'unpaid').length;
  const paidCount = bills.filter((b) => b.status === 'paid').length;
  const totalUnpaidNominal = bills
    .filter((b) => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Notifikasi Pengingat Tagihan Bulanan
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Otomatis melacak jadwal jatuh tempo rutin (listrik, internet, sewa, cicilan, pajak) setiap bulannya
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Desktop notification helper */}
            <button
              onClick={handleRequestNotif}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                browserNotifEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="Aktifkan notifikasi peramban/desktop"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{browserNotifEnabled ? 'Notifikasi Aktif' : 'Izinkan Notifikasi'}</span>
            </button>

            <button
              onClick={onOpenNewBillModal}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-950/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Tagihan</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards for Bills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Total Tagihan Terdaftar
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {bills.length} Tagihan
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Komitmen rutin & tempo bulanan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400 block">
              Belum Dibayar (Pending)
            </span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
              {formatRupiah(totalUnpaidNominal)}
            </span>
            <span className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 block font-medium">
              {unpaidCount} tagihan perlu diselesaikan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">
              Tagihan Sudah Lunas
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {paidCount} Tagihan
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              Telah dibayarkan bulan ini
            </span>
          </div>
        </div>
      </div>

      {/* 2. Bill Items List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua ({bills.length})
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'unpaid'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              }`}
            >
              Belum Lunas ({unpaidCount})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'paid'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              Sudah Lunas ({paidCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredBills.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Tidak ada tagihan pada filter ini
              </p>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const isPaid = bill.status === 'paid';

              return (
                <div
                  key={bill.id}
                  className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPaid
                      ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-75'
                      : bill.urgency.isOverdue
                      ? 'bg-rose-50/40 dark:bg-rose-950/20'
                      : bill.urgency.isDueToday
                      ? 'bg-amber-50/40 dark:bg-amber-950/20'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {bill.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {bill.category}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-blue-500" />
                        {bill.frequency === 'monthly' ? 'Bulanan' : 'Sekali'}
                      </span>
                      {isPaid ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lunas {bill.paidDate ? `(${bill.paidDate})` : ''}
                        </span>
                      ) : (
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${bill.urgency.badgeClass}`}>
                          {bill.urgency.label}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Jatuh Tempo: Setiap tanggal <strong>{bill.dueDay}</strong> (Bulan Ini: {bill.urgency.calculatedDueDate})
                      </span>
                      {bill.notes && (
                        <span className="italic text-slate-400">
                          Catatan: {bill.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Amount */}
                  <div className="shrink-0 text-left lg:text-right">
                    <span className="text-xs text-slate-400 block">Nominal Tagihan</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {formatRupiah(bill.amount)}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {!isPaid ? (
                      <button
                        onClick={() => onPayBillWithExpense(bill)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm active:scale-95"
                        title="Tandai lunas dan masukkan ke catatan pengeluaran harian"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Bayar & Catat Pengeluaran</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(bill.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        title="Kembalikan status ke Belum Bayar"
                      >
                        Batal Lunas
                      </button>
                    )}

                    <button
                      onClick={() => onEditBill(bill)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Edit Tagihan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus pengingat tagihan ${bill.title}?`)) {
                          onDeleteBill(bill.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      title="Hapus Tagihan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
