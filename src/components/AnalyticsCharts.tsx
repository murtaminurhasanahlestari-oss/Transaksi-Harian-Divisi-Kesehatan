import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Transaction, BudgetCategory } from '../types/finance';
import { formatRupiah, formatShortRupiah } from '../utils/formatters';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  budgets: BudgetCategory[];
  selectedMonth: number;
  selectedYear: number;
}

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#64748b', // slate
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  budgets,
  selectedMonth,
  selectedYear,
}) => {
  const [chartMode, setChartMode] = useState<'both' | 'income' | 'expense'>('both');
  const [hoveredDay, setHoveredDay] = useState<{
    day: number;
    income: number;
    expense: number;
    dateStr: string;
  } | null>(null);

  // Group transactions by day of the month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyData: { day: number; income: number; expense: number; dateStr: string }[] = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = String(i).padStart(2, '0');
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    const dateStr = `${selectedYear}-${mStr}-${dayStr}`;

    const txs = transactions.filter((t) => t.date === dateStr);
    const income = txs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = txs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    dailyData.push({ day: i, income, expense, dateStr });
  }

  const maxVal = Math.max(
    ...dailyData.map((d) => Math.max(d.income, d.expense)),
    1000000 // minimum scale 1 juta
  );

  // Category breakdown for expenses
  const expenseByCategory: Record<string, number> = {};
  let totalExpenseMonth = 0;

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      totalExpenseMonth += t.amount;
    });

  const sortedExpenseCategories = Object.entries(expenseByCategory)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalExpenseMonth > 0 ? (amount / totalExpenseMonth) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate Donut Segments
  let cumulativeAngle = 0;
  const donutSegments = sortedExpenseCategories.map((item, idx) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return {
      ...item,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      startAngle,
      angle,
    };
  });

  // Calculate Budget Realization
  const budgetComparisons = budgets.map((b) => {
    const spent = expenseByCategory[b.category] || 0;
    const ratio = b.allocatedAmount > 0 ? (spent / b.allocatedAmount) * 100 : 0;
    return {
      category: b.category,
      allocated: b.allocatedAmount,
      spent,
      ratio,
      isOver: spent > b.allocatedAmount,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Daily Cash Flow Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Grafik Tren Arus Kas Harian</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Perbandingan harian antara pemasukan dan realisasi pengeluaran
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setChartMode('both')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'both'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Arus
            </button>
            <button
              onClick={() => setChartMode('income')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setChartMode('expense')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>

        {/* Hover info tooltip box */}
        <div className="h-9 flex items-center justify-between px-2 text-xs text-slate-600 dark:text-slate-300">
          {hoveredDay ? (
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white">
                Tgl {hoveredDay.day} ({hoveredDay.dateStr}):
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Masuk: {formatRupiah(hoveredDay.income)}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                Keluar: {formatRupiah(hoveredDay.expense)}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Net: {formatRupiah(hoveredDay.income - hoveredDay.expense)}
              </span>
            </div>
          ) : (
            <span className="italic text-slate-400">
              Arahkan kursor pada batang grafik untuk melihat rincian tanggal tertentu
            </span>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
              <span>Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
              <span>Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="relative h-64 mt-2 w-full">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${daysInMonth * 20} 200`}>
            {/* Horizontal guide lines */}
            <line x1="0" y1="20" x2={daysInMonth * 20} y2="20" stroke="#94a3b8" strokeOpacity="0.2" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2={daysInMonth * 20} y2="80" stroke="#94a3b8" strokeOpacity="0.2" strokeDasharray="3 3" />
            <line x1="0" y1="140" x2={daysInMonth * 20} y2="140" stroke="#94a3b8" strokeOpacity="0.2" strokeDasharray="3 3" />
            <line x1="0" y1="180" x2={daysInMonth * 20} y2="180" stroke="#94a3b8" strokeOpacity="0.4" />

            {/* Bars for each day */}
            {dailyData.map((d, index) => {
              const xCenter = index * 20 + 10;
              const incomeHeight = maxVal > 0 ? (d.income / maxVal) * 150 : 0;
              const expenseHeight = maxVal > 0 ? (d.expense / maxVal) * 150 : 0;

              return (
                <g
                  key={d.day}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="cursor-pointer group"
                >
                  {/* Invisible hit area for easier hover */}
                  <rect
                    x={index * 20}
                    y="10"
                    width="20"
                    height="180"
                    fill="transparent"
                    className="hover:fill-slate-500/10"
                  />

                  {/* Income Bar */}
                  {(chartMode === 'both' || chartMode === 'income') && d.income > 0 && (
                    <rect
                      x={chartMode === 'both' ? xCenter - 7 : xCenter - 5}
                      y={180 - incomeHeight}
                      width={chartMode === 'both' ? 6 : 10}
                      height={Math.max(incomeHeight, 2)}
                      rx="2"
                      fill="#10b981"
                      className="transition-all duration-200 group-hover:brightness-110"
                    />
                  )}

                  {/* Expense Bar */}
                  {(chartMode === 'both' || chartMode === 'expense') && d.expense > 0 && (
                    <rect
                      x={chartMode === 'both' ? xCenter + 1 : xCenter - 5}
                      y={180 - expenseHeight}
                      width={chartMode === 'both' ? 6 : 10}
                      height={Math.max(expenseHeight, 2)}
                      rx="2"
                      fill="#f43f5e"
                      className="transition-all duration-200 group-hover:brightness-110"
                    />
                  )}

                  {/* Day label */}
                  {d.day % 2 === 1 && (
                    <text
                      x={xCenter}
                      y="196"
                      fontSize="9"
                      fill="#94a3b8"
                      textAnchor="middle"
                      className="select-none font-medium"
                    >
                      {d.day}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 2. Grid: Category Breakdown Donut & Budget Realization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Proporsi Kategori Pengeluaran</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {sortedExpenseCategories.length} Kategori
              </span>
            </div>

            {sortedExpenseCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                Belum ada transaksi pengeluaran pada periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 items-center">
                {/* Donut Chart representation */}
                <div className="flex flex-col items-center justify-center relative">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                      {donutSegments.map((seg, i) => {
                        const strokeDasharray = `${seg.angle} ${360 - seg.angle}`;
                        const strokeDashoffset = -seg.startAngle;
                        return (
                          <circle
                            key={seg.category}
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="16"
                            strokeDasharray={`${(seg.percentage / 100) * 226.2} 226.2`}
                            strokeDashoffset={-((seg.startAngle / 360) * 226.2)}
                            className="transition-all duration-300 hover:opacity-90"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[11px] text-slate-400 font-medium">Total Keluar</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white px-2">
                        {formatShortRupiah(totalExpenseMonth)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {donutSegments.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/60"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {formatRupiah(item.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget Realization vs Target */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                <span>Total Realisasi vs Anggaran (Budget)</span>
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Bulan Ini
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3">
              Pantau batas plafon anggaran belanja operasional agar tidak overbudget.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {budgetComparisons.map((b) => {
                const isOver = b.isOver;
                const isWarning = b.ratio >= 80 && !isOver;

                return (
                  <div key={b.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                        {b.category}
                      </span>
                      <div className="flex items-center gap-2 text-right shrink-0">
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatRupiah(b.spent)} / {formatRupiah(b.allocated)}
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            isOver
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : isWarning
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {b.ratio.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(b.ratio, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
