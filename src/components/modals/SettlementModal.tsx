import React, { useState } from 'react';
import { X, Receipt, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { CashAdvance } from '../../types/finance';
import { formatRupiah } from '../../utils/formatters';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashAdvance: CashAdvance | null;
  onSaveSettlement: (
    cashAdvanceId: string,
    settlement: {
      date: string;
      amount: number;
      description: string;
      refNumber?: string;
    },
    logToTransactions: boolean
  ) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  cashAdvance,
  onSaveSettlement,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [logToTransactions, setLogToTransactions] = useState(true);

  if (!isOpen || !cashAdvance) return null;

  const currentOutstanding = cashAdvance.originalAmount - cashAdvance.realizedAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert('Masukkan nominal kuitansi realisasi yang valid.');
      return;
    }
    if (!description.trim()) {
      alert('Tuliskan rincian pengeluaran realisasi.');
      return;
    }

    onSaveSettlement(
      cashAdvance.id,
      {
        date,
        amount: numAmount,
        description: description.trim(),
        refNumber: refNumber.trim() || undefined,
      },
      logToTransactions
    );

    // Reset and close
    setAmount('');
    setDescription('');
    setRefNumber('');
    onClose();
  };

  const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
  const newOutstanding = Math.max(0, currentOutstanding - parsedAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-500/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Catat Realisasi (LPJ) Uang Muka
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advance Info summary card */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Penerima Uang Muka:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {cashAdvance.recipientName} ({cashAdvance.departmentOrRole || 'Operasional'})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Keperluan:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[250px]">
              {cashAdvance.purpose}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Plafon Awal:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatRupiah(cashAdvance.originalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-amber-600 dark:text-amber-400 font-medium">Sisa Outstanding Saat Ini:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {formatRupiah(currentOutstanding)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nominal Kuitansi / Realisasi (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {parsedAmount > 0 && (
              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Realisasi: {formatRupiah(parsedAmount)}
                </span>
                <span className="text-slate-500">
                  Estimasi Sisa: <strong>{formatRupiah(newOutstanding)}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Kuitansi / Bukti *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Kuitansi / Dokumen Pendukung
              </label>
              <input
                type="text"
                placeholder="KW-0912 / INV-44"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rincian Pengeluaran Realisasi *
            </label>
            <input
              type="text"
              placeholder="Contoh: Tiket akomodasi kereta eksekutif & hotel 2 malam"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-emerald-900 dark:text-emerald-300">
              <input
                type="checkbox"
                checked={logToTransactions}
                onChange={(e) => setLogToTransactions(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Masukkan otomatis bukti riil ini ke <strong>Buku Catatan Pengeluaran Harian</strong>
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-sm"
            >
              Simpan Realisasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
