import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Transaction, CashAdvance, BillReminder } from '../../types/finance';
import { MONTH_NAMES_ID, formatRupiah } from '../../utils/formatters';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  cashAdvances: CashAdvance[];
  bills: BillReminder[];
  currentMonth: number;
  currentYear: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  cashAdvances,
  bills,
  currentMonth,
  currentYear,
}) => {
  const [formatType, setFormatType] = useState<'pdf' | 'excel'>('pdf');
  const [periodOption, setPeriodOption] = useState<'current' | 'all'>('current');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Filter transactions according to chosen period
  const filteredTxs = periodOption === 'all'
    ? transactions
    : transactions.filter((t) => {
        const parts = t.date.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === selectedYear && m === selectedMonth;
      });

  const periodLabel = periodOption === 'all'
    ? 'Semua Periode Transaksi'
    : `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`;

  const totalIncome = filteredTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutstandingAdvance = cashAdvances.reduce(
    (sum, ca) => sum + (ca.originalAmount - ca.realizedAmount),
    0
  );

  const handleExecuteExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        if (formatType === 'excel') {
          exportToExcel({
            transactions: filteredTxs,
            cashAdvances,
            bills,
            selectedMonth,
            selectedYear,
            periodLabel,
          });
        } else {
          exportToPDF({
            transactions: filteredTxs,
            cashAdvances,
            bills,
            selectedMonth,
            selectedYear,
            periodLabel,
          });
        }
      } catch (err) {
        console.error('Export error:', err);
        alert('Gagal mengekspor laporan. Silakan coba kembali.');
      } finally {
        setIsExporting(false);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ekspor Laporan Keuangan Bulanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format PDF siap cetak & Lembar Kerja Excel (.xlsx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* 1. Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Format Berkas:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormatType('pdf')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  formatType === 'pdf'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-rose-500 text-white shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Dokumen PDF (.pdf)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Laporan resmi siap cetak, tabel terstruktur & tanda tangan pengesahan.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormatType('excel')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  formatType === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Spreadsheet Excel (.xlsx)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Multi-sheet: Ringkasan, Buku Kas, Uang Muka & Tagihan untuk olah data.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Period Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Periode Pelaporan:
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPeriodOption('current')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  periodOption === 'current'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                Bulan Spesifik
              </button>
              <button
                type="button"
                onClick={() => setPeriodOption('all')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  periodOption === 'all'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                Seluruh Data ({transactions.length} Transaksi)
              </button>
            </div>

            {periodOption === 'current' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {MONTH_NAMES_ID.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            )}
          </div>

          {/* 3. Export Summary Preview Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
              <span>Pratinjau Data Periode:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{periodLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-500 block">Total Transaksi:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredTxs.length} Transaksi
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Pemasukan Kas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(totalIncome)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Realisasi Pengeluaran:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatRupiah(totalExpense)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Uang Muka Outstanding:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatRupiah(totalOutstandingAdvance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            File langsung diunduh ke peramban
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExecuteExport}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-md active:scale-95 ${
                formatType === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/30'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Menyiapkan...'
                  : formatType === 'excel'
                  ? 'Unduh Excel (.xlsx)'
                  : 'Unduh PDF (.pdf)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
