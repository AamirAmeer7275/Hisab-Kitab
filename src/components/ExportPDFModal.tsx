import React, { useState, useMemo } from 'react';
import {
  X,
  FileDown,
  Printer,
  Calendar,
  Clock,
  Check,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Person, Transaction } from '../types';
import { generatePersonLedgerPDF } from '../utils/pdfGenerator';
import { formatCurrency, formatDisplayDate, getTransactionDisplayInfo } from '../utils/calculations';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  transactions: Transaction[];
  currencySymbol: string;
  onShowToast: (msg: string) => void;
}

const PRESET_DAYS = [
  { label: '1 Day', days: 1 },
  { label: '2 Days', days: 2 },
  { label: '3 Days', days: 3 },
  { label: '4 Days', days: 4 },
  { label: '5 Days', days: 5 },
  { label: '6 Days', days: 6 },
  { label: '7 Days', days: 7 },
  { label: '8 Days', days: 8 },
  { label: '9 Days', days: 9 },
  { label: '15 Days', days: 15 },
  { label: '30 Days', days: 30 },
  { label: '40 Days', days: 40 },
  { label: '60 Days', days: 60 },
  { label: '90 Days', days: 90 },
  { label: '200 Days', days: 200 },
  { label: 'Lifetime', days: 0 }, // 0 = all time
];

export const ExportPDFModal: React.FC<ExportPDFModalProps> = ({
  isOpen,
  onClose,
  person,
  transactions,
  currencySymbol,
  onShowToast,
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(0); // 0 = Lifetime
  const [customDaysInput, setCustomDaysInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [showTablePreview, setShowTablePreview] = useState<boolean>(true);

  // Filter transactions for this person by days
  const { filteredTx, startDateStr, endDateStr, activeDaysLabel } = useMemo(() => {
    const personTx = transactions.filter((t) => t.person_id === person.id);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const effectiveDays = isCustomMode
      ? parseInt(customDaysInput, 10) || 0
      : selectedDays;

    if (effectiveDays <= 0) {
      // Lifetime / All time
      return {
        filteredTx: personTx,
        startDateStr: undefined,
        endDateStr: todayStr,
        activeDaysLabel: 'Lifetime (All Time)',
      };
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (effectiveDays - 1));
    cutoffDate.setHours(0, 0, 0, 0);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const filtered = personTx.filter((t) => t.date && t.date >= cutoffStr && t.date <= todayStr);

    return {
      filteredTx: filtered,
      startDateStr: cutoffStr,
      endDateStr: todayStr,
      activeDaysLabel: `${effectiveDays} Days`,
    };
  }, [transactions, person.id, selectedDays, customDaysInput, isCustomMode]);

  // Sort ascending for chronological ledger reading with running balance
  const chronologicalTx = useMemo(() => {
    return [...filteredTx].sort((a, b) => {
      const dtA = `${a.date} ${a.time || '00:00'}`;
      const dtB = `${b.date} ${b.time || '00:00'}`;
      return dtA.localeCompare(dtB);
    });
  }, [filteredTx]);

  // Summary for filtered transactions with running balances
  const summary = useMemo(() => {
    let rec = 0;
    let pay = 0;
    let settled = 0;

    for (const t of filteredTx) {
      const amt = Number(t.amount) || 0;
      const isSettlement =
        t.category === 'Settlement' ||
        t.subType === 'SETTLEMENT' ||
        t.subType === 'PAYMENT_RECEIVED' ||
        t.subType === 'PAYMENT_PAID' ||
        t.description.toLowerCase().includes('settle');

      if (isSettlement) {
        settled += amt;
      }
      if (t.type === 'RECEIVABLE') rec += amt;
      else pay += amt;
    }

    const net = rec - pay;
    const isTheyOwe = net > 0.001;
    const isIOwe = net < -0.001;

    return {
      receivable: isTheyOwe ? net : 0,
      payable: isIOwe ? Math.abs(net) : 0,
      settled,
      net,
      count: filteredTx.length,
    };
  }, [filteredTx]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    generatePersonLedgerPDF({
      person,
      transactions: filteredTx,
      currencySymbol,
      daysOption: activeDaysLabel,
      startDateStr,
      endDateStr,
    });
    onShowToast(`PDF statement for ${person.name} (${activeDaysLabel}) generated successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileDown className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Export Detailed PDF Statement</h2>
              <p className="text-xs text-slate-500">
                Detailed account ledger statement for <span className="font-semibold text-slate-700">{person.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Days Selection Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Time Period *
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Active Period: {activeDaysLabel}
              </span>
            </div>

            {/* Quick Days Preset Grid: 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 30, 40, 60, 90, 200, Lifetime */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {PRESET_DAYS.map((p) => {
                const isActive = !isCustomMode && selectedDays === p.days;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedDays(p.days);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Manual Custom Days Section */}
            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Manual Days Option:
                </span>
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    placeholder="Enter manual days (e.g. 5, 40, 200...)"
                    value={customDaysInput}
                    onChange={(e) => {
                      setCustomDaysInput(e.target.value);
                      setIsCustomMode(true);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {customDaysInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDaysInput('');
                        setIsCustomMode(false);
                        setSelectedDays(0);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statement Preview Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Date Range Filter:</span>
              <span className="font-semibold text-slate-800">
                {startDateStr ? `${startDateStr} to ${endDateStr}` : 'Complete History (Lifetime)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">{person.name} Owes Me</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  {formatCurrency(summary.receivable, currencySymbol, { absolute: true })}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">I Owe {person.name}</span>
                <span className="font-bold text-rose-700 font-mono text-sm">
                  {formatCurrency(summary.payable, currencySymbol, { absolute: true })}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Settled Payments</span>
                <span className="font-bold text-slate-700 font-mono text-sm">
                  {formatCurrency(summary.settled, currencySymbol, { absolute: true })}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Net Balance</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    summary.net > 0
                      ? 'text-emerald-700'
                      : summary.net < 0
                      ? 'text-rose-700'
                      : 'text-slate-700'
                  }`}
                >
                  {formatCurrency(summary.net, currencySymbol, { includeSign: true })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">
                {summary.count} detailed {summary.count === 1 ? 'transaction' : 'transactions'} included in PDF
              </span>
              <button
                type="button"
                onClick={() => setShowTablePreview(!showTablePreview)}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{showTablePreview ? 'Hide Details' : 'Preview Table'}</span>
                {showTablePreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Detailed Statement Table Preview */}
          {showTablePreview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Detailed Statement Breakdown</span>
                <span className="text-[11px] font-normal text-slate-500">Chronological with running balance</span>
              </div>

              {chronologicalTx.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No transactions recorded in this date period.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {(() => {
                    let running = 0;
                    return chronologicalTx.map((tx) => {
                      const amt = Number(tx.amount) || 0;
                      if (tx.type === 'RECEIVABLE') running += amt;
                      else running -= amt;

                      const displayInfo = getTransactionDisplayInfo(tx, person.name);

                      return (
                        <div key={tx.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 text-[11px]">{tx.date}</span>
                              <span className="font-bold text-slate-900 truncate">{tx.description}</span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                                  displayInfo.isSettlement
                                    ? 'bg-blue-50 text-blue-700'
                                    : displayInfo.isReceivable
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {displayInfo.badgeLabel}
                              </span>
                            </div>
                            {tx.note && <p className="text-[11px] text-slate-400 truncate mt-0.5">{tx.note}</p>}
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono font-bold block ${
                                displayInfo.isSettlement
                                  ? 'text-blue-700'
                                  : displayInfo.isReceivable
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {displayInfo.sign}{currencySymbol} {amt.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Bal: {running > 0 ? `+${running.toLocaleString()}` : running < 0 ? `-${Math.abs(running).toLocaleString()}` : '0'}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Download & Print Actions */}
          <div className="pt-1">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4 stroke-[2.5]" />
              <span>Download PDF Statement ({activeDaysLabel})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
