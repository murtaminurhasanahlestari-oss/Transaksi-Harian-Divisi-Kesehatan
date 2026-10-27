import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, DollarSign, Bell } from 'lucide-react';
import { BillReminder } from '../../types/finance';
import { EXPENSE_CATEGORIES } from '../../data/initialData';
import { formatRupiah } from '../../utils/formatters';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Omit<BillReminder, 'id' | 'status'>, id?: string) => void;
  initialData?: BillReminder | null;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[2]);
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState<number>(20);
  const [frequency, setFrequency] = useState<'monthly' | 'one_time'>('monthly');
  const [autoRemindDaysBefore, setAutoRemindDaysBefore] = useState<number>(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setAmount(initialData.amount.toString());
      setDueDay(initialData.dueDay);
      setFrequency(initialData.frequency);
      setAutoRemindDaysBefore(initialData.autoRemindDaysBefore);
      setNotes(initialData.notes || '');
    } else {
      setTitle('');
      setCategory(EXPENSE_CATEGORIES[2]);
      setAmount('');
      setDueDay(20);
      setFrequency('monthly');
      setAutoRemindDaysBefore(5);
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!title.trim()) {
      alert('Nama tagihan wajib diisi.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      alert('Masukkan nominal tagihan yang valid.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        category,
        amount: numAmount,
        dueDay,
        frequency,
        autoRemindDaysBefore,
        notes: notes.trim() || undefined,
      },
      initialData?.id
    );
    onClose();
  };

  const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, '')) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-500/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {initialData ? 'Edit Pengingat Tagihan' : 'Tambah Pengingat Tagihan Baru'}
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Tagihan *
            </label>
            <input
              type="text"
              placeholder="Contoh: Tagihan Listrik PLN Pasca Bayar Kantor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nominal Tagihan (Rp) *
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
                className="w-full pl-10 pr-3 py-2 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {parsedAmount > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Terbilang: {formatRupiah(parsedAmount)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Beban
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Frekuensi
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'one_time')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="monthly">Berulang Setiap Bulan</option>
                <option value="one_time">Satu Kali Bayar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Jatuh Tempo (Hari ke-1 s.d 31) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Tiap tanggal</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value, 10) || 1)}
                  required
                  className="w-20 px-3 py-2 text-sm font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500">setiap bulan</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ingatkan Sebelumnya
              </label>
              <select
                value={autoRemindDaysBefore}
                onChange={(e) => setAutoRemindDaysBefore(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={1}>1 hari sebelumnya</option>
                <option value={3}>3 hari sebelumnya</option>
                <option value={5}>5 hari sebelumnya</option>
                <option value={7}>7 hari sebelumnya</option>
                <option value={10}>10 hari sebelumnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus (No. Pelanggan / Rekening Tujuan)
            </label>
            <input
              type="text"
              placeholder="Contoh: No. Pelanggan PLN 5382-9011-4829 / VA Mandiri"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-sm"
            >
              Simpan Pengingat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
