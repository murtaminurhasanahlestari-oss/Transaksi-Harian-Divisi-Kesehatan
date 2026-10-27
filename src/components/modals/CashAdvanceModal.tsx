import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, User, DollarSign } from 'lucide-react';
import { CashAdvance } from '../../types/finance';
import { formatRupiah } from '../../utils/formatters';

interface CashAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    ca: Omit<CashAdvance, 'id' | 'realizedAmount' | 'settlements' | 'status'>,
    logToTransactions: boolean,
    id?: string
  ) => void;
  initialData?: CashAdvance | null;
  defaultDate?: string;
}

export const CashAdvanceModal: React.FC<CashAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDate,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [departmentOrRole, setDepartmentOrRole] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [originalAmount, setOriginalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [logToTransactions, setLogToTransactions] = useState(true);

  useEffect(() => {
    if (initialData) {
      setRecipientName(initialData.recipientName);
      setDepartmentOrRole(initialData.departmentOrRole || '');
      setPurpose(initialData.purpose);
      setDate(initialData.date);
      setOriginalAmount(initialData.originalAmount.toString());
      setDueDate(initialData.dueDate || '');
      setNotes(initialData.notes || '');
      setLogToTransactions(false); // don't duplicate on edit
    } else {
      setRecipientName('');
      setDepartmentOrRole('');
      setPurpose('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setOriginalAmount('');
      setDueDate('');
      setNotes('');
      setLogToTransactions(true);
    }
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(originalAmount.replace(/[^0-9]/g, ''));
    if (!recipientName.trim()) {
      alert('Nama penerima uang muka wajib diisi.');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal uang muka yang valid.');
      return;
    }
    if (!purpose.trim()) {
      alert('Tuliskan keperluan uang muka.');
      return;
    }

    onSave(
      {
        recipientName: recipientName.trim(),
        departmentOrRole: departmentOrRole.trim() || undefined,
        purpose: purpose.trim(),
        date,
        originalAmount: amountNum,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      },
      logToTransactions,
      initialData?.id
    );
    onClose();
  };

  const parsedAmount = parseFloat(originalAmount.replace(/[^0-9]/g, '')) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {initialData ? 'Edit Uang Muka / Kasbon' : 'Pengajuan Uang Muka / Kasbon Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Penerima Uang Muka *
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Divisi / Jabatan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Site Engineer / Logistik"
                value={departmentOrRole}
                onChange={(e) => setDepartmentOrRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah Uang Muka (Plafon Awal) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {parsedAmount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                Terbilang: {formatRupiah(parsedAmount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keperluan Uang Muka *
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Panjar operasional survei lapangan proyek dan sewa kendaraan dinas"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pencairan *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Waktu LPJ (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus (Opsional)
            </label>
            <input
              type="text"
              placeholder="Ketentuan pengembalian sisa atau no. memo persetujuan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {!initialData && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={logToTransactions}
                  onChange={(e) => setLogToTransactions(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>
                  Otomatis catat pengeluaran dana panjar ini ke <strong>Buku Kas Harian</strong>
                </span>
              </label>
            </div>
          )}

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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all shadow-sm"
            >
              Simpan Uang Muka
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
