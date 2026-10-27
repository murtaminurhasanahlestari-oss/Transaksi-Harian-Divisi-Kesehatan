import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  FileText,
  Tag,
  ChevronDown,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc'); // default asc for journal chronology
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // table matches user spreadsheet

  // Distinct categories available in current transactions
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchRef = t.refNumber?.toLowerCase().includes(q);
          const matchMethod = t.paymentMethod.toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchRef && !matchMethod) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
      });
  }, [transactions, typeFilter, categoryFilter, searchQuery, sortOrder]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const dates = Object.keys(groupedTransactions);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Filter & Search Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Buku Catatan Transaksi Harian</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola seluruh catatan arus kas harian secara rinci dan terstruktur
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Jurnal Akuntansi (COA, Ref, Penerima, Debit, Kredit)"
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tabel Jurnal</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Ringkasan Harian"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
                <span>Kartu Harian</span>
              </button>
            </div>

            <button
              onClick={onAddTransaction}
              className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari keterangan, no. ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 rounded-md text-center transition-colors font-medium ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-1.5 rounded-md text-center transition-colors font-medium ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-1.5 rounded-md text-center transition-colors font-medium ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Keluar
            </button>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Kategori ({availableCategories.length})</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort date order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="desc">Urutan: Tanggal Terbaru</option>
              <option value="asc">Urutan: Tanggal Terlama</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction View: Table (Spreadsheet format) or Cards */}
      {filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Tidak ada transaksi ditemukan
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sesuaikan kata kunci pencarian atau tambah transaksi baru.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-3 whitespace-nowrap">Ref (Nomor Bukti)</th>
                <th className="py-3 px-3 min-w-[200px]">Keterangan</th>
                <th className="py-3 px-3 whitespace-nowrap">COA</th>
                <th className="py-3 px-3 min-w-[160px]">Nama Akun</th>
                <th className="py-3 px-3 whitespace-nowrap">Penerima</th>
                <th className="py-3 px-3 text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                  Debit (Rp)
                </th>
                <th className="py-3 px-3 text-right whitespace-nowrap text-rose-600 dark:text-rose-400">
                  Kredit (Rp)
                </th>
                <th className="py-3 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx, idx) => {
                const isDebit = tx.type === 'income' || (tx.debit && tx.debit > 0);
                const isCredit = tx.type === 'expense' || (tx.credit && tx.credit > 0);
                const debitVal = isDebit ? (tx.debit || tx.amount) : 0;
                const creditVal = isCredit ? (tx.credit || tx.amount) : 0;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {tx.refNumber ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {tx.refNumber}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-white font-medium">
                      <div>{tx.description}</div>
                      {tx.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                          {tx.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {tx.coa ? (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono font-semibold">
                          {tx.coa}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {tx.accountName || tx.category}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {tx.recipient ? (
                        <span className="font-medium">{tx.recipient}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-mono">
                      {debitVal > 0 ? formatRupiah(debitVal, false) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap font-mono">
                      {creditVal > 0 ? formatRupiah(creditVal, false) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Summary Footer */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={7} className="py-3 px-3 text-right">
                  TOTAL SALDO JURNAL:
                </td>
                <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                  {formatRupiah(
                    filteredTransactions
                      .filter((t) => t.type === 'income')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </td>
                <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 font-mono text-xs">
                  {formatRupiah(
                    filteredTransactions
                      .filter((t) => t.type === 'expense')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Cards View (Grouped by date) */
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {dates.map((date) => {
            const dayTxs = groupedTransactions[date];
            const dayIncome = dayTxs
              .filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const dayExpense = dayTxs
              .filter((t) => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div key={date} className="p-4 sm:p-5">
                {/* Date Header with Daily Subtotals */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatTanggalIndo(date)}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      {dayTxs.length} Transaksi
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        + {formatRupiah(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        - {formatRupiah(dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Items */}
                <div className="space-y-2.5">
                  {dayTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-100 dark:border-slate-800 gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Type Icon */}
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {tx.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {tx.coa && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono font-semibold border border-indigo-200 dark:border-indigo-800">
                                COA {tx.coa}
                              </span>
                            )}
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3 text-slate-500" />
                              {tx.category}
                            </span>
                            {tx.recipient && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                                Rekanan: {tx.recipient}
                              </span>
                            )}
                            {tx.refNumber && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                Ref: #{tx.refNumber}
                              </span>
                            )}
                            {tx.cashAdvanceId && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold border border-amber-300 dark:border-amber-800">
                                Realisasi Kasbon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/60">
                        <div className="text-left sm:text-right">
                          <span
                            className={`text-base font-bold block ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
