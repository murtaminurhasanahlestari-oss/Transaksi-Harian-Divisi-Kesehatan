import React, { useState } from 'react';
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Receipt,
  User,
  Calendar,
  ChevronRight,
  Trash2,
  Edit2,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { CashAdvance, CashAdvanceStatus } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

interface CashAdvanceManagerProps {
  cashAdvances: CashAdvance[];
  onOpenNewAdvanceModal: () => void;
  onOpenSettleModal: (cashAdvance: CashAdvance) => void;
  onEditAdvance: (cashAdvance: CashAdvance) => void;
  onDeleteAdvance: (id: string) => void;
  onDirectSettlementToggle: (id: string) => void;
}

export const CashAdvanceManager: React.FC<CashAdvanceManagerProps> = ({
  cashAdvances,
  onOpenNewAdvanceModal,
  onOpenSettleModal,
  onEditAdvance,
  onDeleteAdvance,
  onDirectSettlementToggle,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | CashAdvanceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Totals
  const totalOriginal = cashAdvances.reduce((sum, ca) => sum + ca.originalAmount, 0);
  const totalRealized = cashAdvances.reduce((sum, ca) => sum + ca.realizedAmount, 0);
  const totalOutstanding = totalOriginal - totalRealized;

  const filteredAdvances = cashAdvances.filter((ca) => {
    if (statusFilter !== 'all' && ca.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ca.recipientName.toLowerCase().includes(q);
      const matchPurpose = ca.purpose.toLowerCase().includes(q);
      const matchDept = ca.departmentOrRole?.toLowerCase().includes(q);
      if (!matchName && !matchPurpose && !matchDept) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Pengelolaan Uang Muka & Kasbon (Outstanding Advances)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pantau seluruh dana panjar kerja, realisasi laporan pertanggungjawaban (LPJ), dan sisa saldo outstanding
            </p>
          </div>

          <button
            onClick={onOpenNewAdvanceModal}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-md shadow-amber-950/20 active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Ajukan Uang Muka</span>
          </button>
        </div>

        {/* 3 Metric Cards for Cash Advance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Total Uang Muka Diberikan (Plafon)
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {formatRupiah(totalOriginal)}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {cashAdvances.length} Total pengajuan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">
              Total Realisasi Terlapor (LPJ)
            </span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
              {formatRupiah(totalRealized)}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {totalOriginal > 0 ? ((totalRealized / totalOriginal) * 100).toFixed(0) : 0}% telah dipertanggungjawabkan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-400 block">
              Sisa Uang Muka Outstanding
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
              {formatRupiah(totalOutstanding)}
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 block font-medium">
              Wajib diselesaikan / dilaporkan
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filters & Advances List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({cashAdvances.length})
            </button>
            <button
              onClick={() => setStatusFilter('outstanding')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'outstanding'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
              }`}
            >
              Outstanding ({cashAdvances.filter((c) => c.status === 'outstanding').length})
            </button>
            <button
              onClick={() => setStatusFilter('partially_settled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'partially_settled'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
              }`}
            >
              Sebagian ({cashAdvances.filter((c) => c.status === 'partially_settled').length})
            </button>
            <button
              onClick={() => setStatusFilter('settled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'settled'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              Selesai ({cashAdvances.filter((c) => c.status === 'settled').length})
            </button>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari nama penerima / keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* List of advances */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredAdvances.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Tidak ada data uang muka pada kategori ini
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan tombol "+ Ajukan Uang Muka" untuk mencatat panjar dana baru.
              </p>
            </div>
          ) : (
            filteredAdvances.map((ca) => {
              const outstanding = ca.originalAmount - ca.realizedAmount;
              const ratio = ca.originalAmount > 0 ? (ca.realizedAmount / ca.originalAmount) * 100 : 0;
              const isExpanded = expandedId === ca.id;

              return (
                <div
                  key={ca.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {ca.recipientName}
                        </span>
                        {ca.departmentOrRole && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {ca.departmentOrRole}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            ca.status === 'settled'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : ca.status === 'partially_settled'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {ca.status === 'settled'
                            ? 'Selesai / Lunas'
                            : ca.status === 'partially_settled'
                            ? 'Sebagian LPJ'
                            : 'Outstanding Penuh'}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                        Keperluan: <span className="font-normal">{ca.purpose}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Tanggal Pencairan: {formatTanggalIndo(ca.date)}
                        </span>
                        {ca.dueDate && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Target LPJ: {formatTanggalIndo(ca.dueDate)}
                          </span>
                        )}
                        {ca.notes && (
                          <span className="text-slate-400 italic">
                            Catatan: {ca.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Financial amounts */}
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700/60 shrink-0 text-center sm:text-left">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Plafon UM</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {formatRupiah(ca.originalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          Realisasi (LPJ)
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(ca.realizedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">
                          Sisa Outstanding
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                          {formatRupiah(outstanding)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 justify-end shrink-0">
                      {ca.status !== 'settled' && (
                        <button
                          onClick={() => onOpenSettleModal(ca)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
                          title="Input kuitansi bukti pengeluaran dan potong saldo outstanding"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Catat Realisasi</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ca.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        title="Lihat rincian kuitansi"
                      >
                        {isExpanded ? 'Tutup' : `Rincian (${ca.settlements.length})`}
                      </button>

                      <button
                        onClick={() => onEditAdvance(ca)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Edit Uang Muka"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan uang muka untuk ${ca.recipientName}?`)) {
                            onDeleteAdvance(ca.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        title="Hapus Uang Muka"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar of Realization */}
                  <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ca.status === 'settled' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>

                  {/* Expanded Settlements / Receipts History */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-emerald-500" />
                          Riwayat Kuitansi & Realisasi ({ca.settlements.length})
                        </span>
                        {ca.status !== 'settled' && (
                          <button
                            onClick={() => onDirectSettlementToggle(ca.id)}
                            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                          >
                            Tandai Langsung Selesai Lunas
                          </button>
                        )}
                      </div>

                      {ca.settlements.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Belum ada bukti kuitansi / LPJ yang diserahkan untuk uang muka ini.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {ca.settlements.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                            >
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {st.description}
                                </span>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{formatTanggalIndo(st.date)}</span>
                                  {st.refNumber && <span>• Ref: {st.refNumber}</span>}
                                </div>
                              </div>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(st.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
