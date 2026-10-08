import { jsPDF } from 'jspdf';
import { Person, Transaction, PersonBalance } from '../types';
import {
  formatCurrency,
  formatDisplayDate,
  formatFullDate,
  getTransactionDisplayInfo,
} from './calculations';

export interface PDFExportOptions {
  person: Person;
  transactions: Transaction[];
  currencySymbol: string;
  daysOption: string; // e.g. "Lifetime", "40 Days", "200 Days"
  startDateStr?: string;
  endDateStr?: string;
}

export function generatePersonLedgerPDF(options: PDFExportOptions): void {
  const { person, transactions, currencySymbol, daysOption, startDateStr, endDateStr } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Compute summary for this filtered list
  let totalReceivable = 0;
  let totalPayable = 0;
  let totalSettled = 0;

  // Sort ascending for ledger statement order (oldest to newest) to show running balance
  const chronologicalTx = [...transactions].sort((a, b) => {
    const dtA = `${a.date} ${a.time || '00:00'}`;
    const dtB = `${b.date} ${b.time || '00:00'}`;
    return dtA.localeCompare(dtB);
  });

  for (const t of chronologicalTx) {
    const amt = Number(t.amount) || 0;
    const isSettlement =
      t.category === 'Settlement' ||
      t.subType === 'SETTLEMENT' ||
      t.subType === 'PAYMENT_RECEIVED' ||
      t.subType === 'PAYMENT_PAID' ||
      t.description.toLowerCase().includes('settle');

    if (isSettlement) {
      totalSettled += amt;
    }

    if (t.type === 'RECEIVABLE') {
      totalReceivable += amt;
    } else {
      totalPayable += amt;
    }
  }

  const netBalance = totalReceivable - totalPayable;
  const isTheyOwe = netBalance > 0.001;
  const isIOwe = netBalance < -0.001;
  const pendingReceivable = isTheyOwe ? netBalance : 0;
  const pendingPayable = isIOwe ? Math.abs(netBalance) : 0;

  // Header Banner
  doc.setFillColor(5, 150, 105); // Emerald-600
  doc.rect(margin, y, pageWidth - margin * 2, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HISAB-KITAB / PERSONAL LEDGER STATEMENT', margin + 6, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account Statement · ${daysOption}`, margin + 6, y + 14);

  const nowFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  doc.text(`Generated: ${nowFormatted}`, pageWidth - margin - 6, y + 14, { align: 'right' });

  y += 24;

  // Account Info & Period
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(person.name, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  let metaLine = '';
  if (person.phone) metaLine += `Phone: ${person.phone}   `;
  if (person.notes) metaLine += `Note: ${person.notes}   `;
  if (metaLine) {
    y += 5;
    doc.text(metaLine, margin, y);
  }

  y += 5;
  const periodText =
    startDateStr && endDateStr
      ? `Period: ${daysOption} (${startDateStr} to ${endDateStr})`
      : `Period: ${daysOption}`;
  doc.text(periodText, margin, y);

  y += 8;

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  const colWidth = (pageWidth - margin * 2) / 3;

  // Metric 1: Pending Receivable (never counts settlement payment into I owe)
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`${person.name.toUpperCase()} OWES ME`, margin + 6, y + 7);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${currencySymbol} ${pendingReceivable.toLocaleString('en-US')}`, margin + 6, y + 16);

  // Metric 2: Pending Payable (0 if they owe me or settled!)
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`I OWE ${person.name.toUpperCase()}`, margin + colWidth + 6, y + 7);
  doc.setTextColor(pendingPayable > 0 ? 225 : 100, pendingPayable > 0 ? 29 : 116, pendingPayable > 0 ? 72 : 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${currencySymbol} ${pendingPayable.toLocaleString('en-US')}`, margin + colWidth + 6, y + 16);

  // Metric 3: Net Balance
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('NET BALANCE', margin + colWidth * 2 + 6, y + 7);

  if (isTheyOwe) {
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`+ ${currencySymbol} ${netBalance.toLocaleString('en-US')}`, margin + colWidth * 2 + 6, y + 14);
    doc.setFontSize(7.5);
    doc.text('STATUS: OWES ME', margin + colWidth * 2 + 6, y + 19);
  } else if (isIOwe) {
    doc.setTextColor(225, 29, 72);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`- ${currencySymbol} ${Math.abs(netBalance).toLocaleString('en-US')}`, margin + colWidth * 2 + 6, y + 14);
    doc.setFontSize(7.5);
    doc.text('STATUS: I OWE', margin + colWidth * 2 + 6, y + 19);
  } else {
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${currencySymbol} 0`, margin + colWidth * 2 + 6, y + 14);
    doc.setFontSize(7.5);
    doc.text('STATUS: SETTLED', margin + colWidth * 2 + 6, y + 19);
  }

  y += 28;

  // Transactions Table Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const colDate = margin + 3;
  const colDesc = margin + 25;
  const colCat = margin + 85;
  const colDir = margin + 115;
  const colAmt = margin + 145;
  const colBal = pageWidth - margin - 3;

  doc.text('DATE', colDate, y + 5);
  doc.text('DESCRIPTION / NOTE', colDesc, y + 5);
  doc.text('CATEGORY', colCat, y + 5);
  doc.text('DIRECTION', colDir, y + 5);
  doc.text('AMOUNT', colAmt, y + 5);
  doc.text('BALANCE', colBal, y + 5, { align: 'right' });

  y += 8;

  // Transactions Rows
  let runningBalance = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (chronologicalTx.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('No transactions found in this date period.', margin + 4, y + 8);
    y += 14;
  } else {
    for (let i = 0; i < chronologicalTx.length; i++) {
      const tx = chronologicalTx[i];
      const amt = Number(tx.amount) || 0;
      const displayInfo = getTransactionDisplayInfo(tx, person.name);

      if (tx.type === 'RECEIVABLE') {
        runningBalance += amt;
      } else {
        runningBalance -= amt;
      }

      // Check if page overflow
      if (y > pageHeight - 20) {
        doc.addPage();
        y = margin;

        // Repeat table header
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('DATE', colDate, y + 5);
        doc.text('DESCRIPTION / NOTE', colDesc, y + 5);
        doc.text('CATEGORY', colCat, y + 5);
        doc.text('DIRECTION', colDir, y + 5);
        doc.text('AMOUNT', colAmt, y + 5);
        doc.text('BALANCE', colBal, y + 5, { align: 'right' });
        y += 8;
        doc.setFont('helvetica', 'normal');
      }

      // Alternating row background
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      }

      doc.setTextColor(51, 65, 85);

      // Date
      doc.text(tx.date, colDate, y + 4.8);

      // Description & note
      let descText = tx.description || 'Transaction';
      if (tx.note) descText += ` (${tx.note})`;
      if (descText.length > 34) {
        descText = descText.substring(0, 31) + '...';
      }
      doc.text(descText, colDesc, y + 4.8);

      // Category
      doc.text(tx.category || 'Other', colCat, y + 4.8);

      // Direction
      if (displayInfo.isSettlement) {
        doc.setTextColor(37, 99, 235); // Blue
        doc.text(displayInfo.badgeLabel, colDir, y + 4.8);
      } else if (displayInfo.isReceivable) {
        doc.setTextColor(5, 150, 105);
        doc.text('They Owe (+)', colDir, y + 4.8);
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text('I Owe (-)', colDir, y + 4.8);
      }

      // Amount
      const amtFormatted = `${displayInfo.sign}${currencySymbol} ${amt.toLocaleString('en-US')}`;
      doc.text(amtFormatted, colAmt, y + 4.8);

      // Running Balance
      doc.setFont('helvetica', 'bold');
      if (runningBalance > 0.001) {
        doc.setTextColor(5, 150, 105);
        doc.text(`+${currencySymbol} ${runningBalance.toLocaleString('en-US')}`, colBal, y + 4.8, {
          align: 'right',
        });
      } else if (runningBalance < -0.001) {
        doc.setTextColor(225, 29, 72);
        doc.text(`-${currencySymbol} ${Math.abs(runningBalance).toLocaleString('en-US')}`, colBal, y + 4.8, {
          align: 'right',
        });
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text(`${currencySymbol} 0`, colBal, y + 4.8, { align: 'right' });
      }
      doc.setFont('helvetica', 'normal');

      y += 7;
    }
  }

  // Footer line & note
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Total: ${chronologicalTx.length} transactions · Total Settled: ${currencySymbol} ${totalSettled.toLocaleString('en-US')} · Certified statement by Hisab-Kitab`,
    margin,
    y
  );

  const cleanName = person.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanRange = daysOption.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`statement_${cleanName}_${cleanRange}.pdf`);
}

