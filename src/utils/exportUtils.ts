import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, CashAdvance, BillReminder } from '../types/finance';
import { formatRupiah, formatTanggalIndo, MONTH_NAMES_ID } from './formatters';

interface ExportParams {
  transactions: Transaction[];
  cashAdvances: CashAdvance[];
  bills: BillReminder[];
  selectedMonth: number; // 0-11
  selectedYear: number;
  periodLabel: string;
}

export const exportToExcel = ({
  transactions,
  cashAdvances,
  bills,
  periodLabel,
}: ExportParams) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Ringkasan Eksekutif
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const totalOriginalAdvance = cashAdvances.reduce((sum, ca) => sum + ca.originalAmount, 0);
  const totalRealizedAdvance = cashAdvances.reduce((sum, ca) => sum + ca.realizedAmount, 0);
  const totalOutstandingAdvance = totalOriginalAdvance - totalRealizedAdvance;

  const totalUnpaidBills = bills
    .filter((b) => b.status === 'unpaid')
    .reduce((sum, b) => sum + b.amount, 0);

  const summaryData = [
    ['LAPORAN KEUANGAN DAN REALISASI ANGGARAN'],
    [`Periode: ${periodLabel}`],
    [`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`],
    [],
    ['METRIK UTAMA', 'NILAI (IDR)', 'KETERANGAN'],
    ['Total Pemasukan (Inflow)', totalIncome, 'Total arus kas masuk'],
    ['Total Realisasi Pengeluaran (Outflow)', totalExpense, 'Total pengeluaran operasional & riil'],
    ['Surplus / Defisit Bersih', netBalance, netBalance >= 0 ? 'Surplus Kas' : 'Defisit Kas'],
    [],
    ['STATUS UANG MUKA / KASBON', '', ''],
    ['Total Uang Muka Diberikan', totalOriginalAdvance, 'Total plafon dana panjar'],
    ['Total Realisasi Terlapor (LPJ)', totalRealizedAdvance, 'Total kuitansi/bukti sah diterima'],
    ['Sisa Uang Muka Outstanding', totalOutstandingAdvance, 'Dana masih dipegang karyawan/belum selesai'],
    [],
    ['STATUS TAGIHAN BULANAN', '', ''],
    ['Total Tagihan Belum Dibayar', totalUnpaidBills, `${bills.filter((b) => b.status === 'unpaid').length} tagihan aktif`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  // Set column widths
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 22 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 2. Sheet: Rincian Transaksi & Jurnal Akuntansi
  const txHeader = [
    'No',
    'Tanggal',
    'Ref (Nomor Bukti)',
    'Keterangan',
    'COA',
    'Nama Akun',
    'Penerima',
    'Debit (Rp)',
    'Kredit (Rp)',
    'Metode Pembayaran',
  ];

  const txRows = transactions.map((t, index) => [
    index + 1,
    t.date,
    t.refNumber || '-',
    t.description,
    t.coa || (t.type === 'income' ? '1.6.1' : '5.0'),
    t.accountName || t.category,
    t.recipient || '-',
    t.type === 'income' ? t.amount : (t.debit || 0),
    t.type === 'expense' ? t.amount : (t.credit || 0),
    t.paymentMethod,
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  wsTx['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 22 },
    { wch: 45 },
    { wch: 10 },
    { wch: 35 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Buku Kas & Jurnal');

  // 3. Sheet: Uang Muka & Kasbon
  const caHeader = [
    'No',
    'Tanggal Pengajuan',
    'Nama Penerima',
    'Divisi / Peran',
    'Keperluan / Deskripsi',
    'Plafon UM (Rp)',
    'Total Realisasi LPJ (Rp)',
    'Sisa Outstanding (Rp)',
    'Status',
    'Jatuh Tempo LPJ',
    'Catatan',
  ];

  const caRows = cashAdvances.map((ca, index) => [
    index + 1,
    ca.date,
    ca.recipientName,
    ca.departmentOrRole || '-',
    ca.purpose,
    ca.originalAmount,
    ca.realizedAmount,
    ca.originalAmount - ca.realizedAmount,
    ca.status === 'settled' ? 'Selesai (Lunas)' : ca.status === 'partially_settled' ? 'Sebagian (Partial)' : 'Outstanding',
    ca.dueDate || '-',
    ca.notes || '-',
  ]);

  const wsCA = XLSX.utils.aoa_to_sheet([caHeader, ...caRows]);
  wsCA['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 40 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCA, 'Uang Muka & Kasbon');

  // 4. Sheet: Tagihan & Komitmen
  const billsHeader = [
    'No',
    'Nama Tagihan',
    'Kategori',
    'Nominal (Rp)',
    'Tgl Jatuh Tempo',
    'Frekuensi',
    'Status',
    'Tgl Bayar',
    'Catatan',
  ];

  const billRows = bills.map((b, index) => [
    index + 1,
    b.title,
    b.category,
    b.amount,
    `Tgl ${b.dueDay}`,
    b.frequency === 'monthly' ? 'Bulanan' : 'Sekali Bayar',
    b.status === 'paid' ? 'Lunas' : 'Belum Dibayar',
    b.paidDate || '-',
    b.notes || '-',
  ]);

  const wsBills = XLSX.utils.aoa_to_sheet([billsHeader, ...billRows]);
  wsBills['!cols'] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 25 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBills, 'Pengingat Tagihan');

  // Download XLSX file
  const fileName = `Laporan_Keuangan_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportToPDF = ({
  transactions,
  cashAdvances,
  bills,
  periodLabel,
}: ExportParams) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary color: Emerald / Slate theme
  const primaryColor = [16, 120, 90] as const; // Emerald 700
  const darkTextColor = [30, 41, 59] as const; // Slate 800
  const mutedTextColor = [100, 116, 139] as const; // Slate 500

  // 1. Company / App Header
  doc.setFillColor(16, 120, 90);
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('FINLAPOR', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedTextColor);
  doc.text('SISTEM LAPORAN KEUANGAN & MANAJEMEN KASBON', 14, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkTextColor);
  doc.text(`LAPORAN KEUANGAN BULANAN`, pageWidth - 14, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Periode: ${periodLabel}`, pageWidth - 14, 25, { align: 'right' });
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 14, 30, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 34, pageWidth - 14, 34);

  // 2. Executive Summary Box
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const totalOriginalAdvance = cashAdvances.reduce((sum, ca) => sum + ca.originalAmount, 0);
  const totalRealizedAdvance = cashAdvances.reduce((sum, ca) => sum + ca.realizedAmount, 0);
  const totalOutstandingAdvance = totalOriginalAdvance - totalRealizedAdvance;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text('RINGKASAN EKSEKUTIF ARUS KAS & KASBON', 14, 42);

  autoTable(doc, {
    startY: 46,
    head: [['Indikator Finansial', 'Jumlah (IDR)', 'Status / Catatan']],
    body: [
      ['Total Pemasukan Kas (Inflow)', formatRupiah(totalIncome), 'Penerimaan operasional & proyek'],
      ['Total Realisasi Pengeluaran (Outflow)', formatRupiah(totalExpense), 'Beban operasional & belanja riil'],
      ['Surplus / Defisit Bersih (Net Cash)', formatRupiah(netBalance), netBalance >= 0 ? 'Surplus Operasional' : 'Defisit'],
      ['Total Uang Muka (Kasbon) Beredar', formatRupiah(totalOriginalAdvance), 'Plafon panjar disalurkan'],
      ['Total Realisasi Uang Muka (LPJ)', formatRupiah(totalRealizedAdvance), 'Telah dilaporkan dengan bukti sah'],
      ['Sisa Uang Muka Masih Outstanding', formatRupiah(totalOutstandingAdvance), 'Wajib dipertanggungjawabkan'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [16, 120, 90],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  // 3. Transactions Table (Jurnal Buku Kas)
  const lastSummaryY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text('BUKU KAS & JURNAL TRANSAKSI', 14, lastSummaryY);

  const txBody = transactions.map((t) => [
    t.date,
    t.refNumber || '-',
    t.coa || (t.type === 'income' ? '1.6.1' : '-'),
    t.description,
    t.recipient || '-',
    t.type === 'income' ? formatRupiah(t.amount, false) : (t.debit ? formatRupiah(t.debit, false) : '-'),
    t.type === 'expense' ? formatRupiah(t.amount, false) : (t.credit ? formatRupiah(t.credit, false) : '-'),
  ]);

  autoTable(doc, {
    startY: lastSummaryY + 4,
    head: [['Tanggal', 'Ref Bukti', 'COA', 'Keterangan', 'Penerima', 'Debit (Rp)', 'Kredit (Rp)']],
    body: txBody.length > 0 ? txBody : [['-', '-', '-', 'Tidak ada data transaksi pada periode ini', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 30 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 50 },
      4: { cellWidth: 24 },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 23, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Cash Advance Table
  const lastTxY = (doc as any).lastAutoTable.finalY + 10;

  // Add new page if not enough space
  if (lastTxY > pageHeight - 65) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text('LAPORAN UANG MUKA / KASBON OUTSTANDING', 14, 20);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text('LAPORAN UANG MUKA / KASBON OUTSTANDING', 14, lastTxY);
  }

  const caStart = lastTxY > pageHeight - 65 ? 24 : lastTxY + 4;
  const caBody = cashAdvances.map((ca) => [
    ca.recipientName,
    ca.purpose,
    formatRupiah(ca.originalAmount, false),
    formatRupiah(ca.realizedAmount, false),
    formatRupiah(ca.originalAmount - ca.realizedAmount, false),
    ca.status === 'settled' ? 'Selesai' : ca.status === 'partially_settled' ? 'Sebagian' : 'Outstanding',
    ca.dueDate ? ca.dueDate : '-',
  ]);

  autoTable(doc, {
    startY: caStart,
    head: [['Penerima', 'Keperluan Uang Muka', 'Plafon UM (Rp)', 'Realisasi (Rp)', 'Sisa Outstanding (Rp)', 'Status', 'Jatuh Tempo']],
    body: caBody.length > 0 ? caBody : [['-', 'Tidak ada uang muka tercatat', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [180, 83, 9], // Amber 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 50 },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Monthly Bills Table
  const lastCaY = (doc as any).lastAutoTable.finalY + 10;
  if (lastCaY > pageHeight - 55) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text('DAFTAR TAGIHAN JATUH TEMPO BULANAN', 14, 20);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text('DAFTAR TAGIHAN JATUH TEMPO BULANAN', 14, lastCaY);
  }

  const billsStart = lastCaY > pageHeight - 55 ? 24 : lastCaY + 4;
  const billsBody = bills.map((b) => [
    b.title,
    b.category,
    formatRupiah(b.amount, false),
    `Tgl ${b.dueDay}`,
    b.status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR',
    b.paidDate || '-',
  ]);

  autoTable(doc, {
    startY: billsStart,
    head: [['Nama Tagihan', 'Kategori', 'Nominal (Rp)', 'Jatuh Tempo', 'Status', 'Tgl Bayar']],
    body: billsBody.length > 0 ? billsBody : [['-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Blue 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 42 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // 6. Signatures Footer
  const lastBillsY = (doc as any).lastAutoTable.finalY + 12;
  const signatureY = lastBillsY > pageHeight - 35 ? pageHeight - 25 : lastBillsY;

  // If needed, add signature on same or new page
  if (lastBillsY > pageHeight - 30) {
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkTextColor);
    doc.text('Dibuat Oleh,', 25, 25);
    doc.text('( Bagian Keuangan / Finance )', 25, 45);

    doc.text('Mengetahui / Menyetujui,', pageWidth - 70, 25);
    doc.text('( Manajer Operasional )', pageWidth - 70, 45);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkTextColor);
    doc.text('Dibuat Oleh,', 25, signatureY);
    doc.text('( Bagian Keuangan / Finance )', 25, signatureY + 18);

    doc.text('Mengetahui / Menyetujui,', pageWidth - 70, signatureY);
    doc.text('( Manajer Operasional )', pageWidth - 70, signatureY + 18);
  }

  // Page numbering in footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    doc.text(
      `FinLapor • Laporan Keuangan Periode ${periodLabel} • Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save PDF
  const fileName = `Laporan_Keuangan_${periodLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
