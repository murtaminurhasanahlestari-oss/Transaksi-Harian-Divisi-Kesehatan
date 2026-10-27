export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const formatRupiah = (amount: number, withPrefix = true): string => {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return withPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
};

export const formatShortRupiah = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount);
};

export const formatTanggalIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTH_NAMES_ID[monthIdx] || parts[1]} ${year}`;
};

export const formatTanggalSingkat = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${shortMonths[monthIdx] || parts[1]} ${year.slice(2)}`;
};

export interface BillUrgency {
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  daysRemaining: number;
  label: string;
  badgeClass: string;
  calculatedDueDate: string;
}

export const getBillUrgency = (
  dueDay: number,
  specificDueDate?: string,
  referenceDateStr?: string
): BillUrgency => {
  const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
  today.setHours(0, 0, 0, 0);

  let targetDate: Date;
  if (specificDueDate) {
    targetDate = new Date(specificDueDate);
  } else {
    // Generate date for current year & month based on dueDay
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    // Clamp to days in month
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const actualDay = Math.min(dueDay, daysInCurrentMonth);
    targetDate = new Date(currentYear, currentMonth, actualDay);
  }
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  const calculatedDueDate = `${y}-${m}-${d}`;

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isDueToday: false,
      isDueSoon: false,
      daysRemaining: diffDays,
      label: `Lewat ${Math.abs(diffDays)} hari`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      calculatedDueDate,
    };
  }

  if (diffDays === 0) {
    return {
      isOverdue: false,
      isDueToday: true,
      isDueSoon: true,
      daysRemaining: 0,
      label: 'Jatuh tempo Hari Ini!',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 animate-pulse',
      calculatedDueDate,
    };
  }

  if (diffDays <= 3) {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueSoon: true,
      daysRemaining: diffDays,
      label: `${diffDays} hari lagi`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      calculatedDueDate,
    };
  }

  if (diffDays <= 7) {
    return {
      isOverdue: false,
      isDueToday: false,
      isDueSoon: true,
      daysRemaining: diffDays,
      label: `${diffDays} hari lagi`,
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      calculatedDueDate,
    };
  }

  return {
    isOverdue: false,
    isDueToday: false,
    isDueSoon: false,
    daysRemaining: diffDays,
    label: `${diffDays} hari lagi`,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    calculatedDueDate,
  };
};
