import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';

interface MonthlySummaryProps {
  transactions: Transaction[];
  currencySymbol: string;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ transactions, currencySymbol }) => {
  // Default to current year & month (e.g. 2026-10)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });

  // Calculate statistics for selected month
  const stats = useMemo(() => {
    let moneyOthersOweMe = 0; // RECEIVABLES recorded in this month
    let moneyIOwe = 0;         // PAYABLES recorded in this month
    let txCount = 0;

    for (const t of transactions) {
      if (t.date && t.date.startsWith(selectedMonth)) {
        txCount++;
        const amt = Number(t.amount) || 0;
        if (t.type === 'RECEIVABLE') {
          moneyOthersOweMe += amt;
        } else {
          moneyIOwe += amt;
        }
      }
    }

    const net = moneyOthersOweMe - moneyIOwe;

    return {
      moneyOthersOweMe,
      moneyIOwe,
      net,
      txCount,
    };
  }, [transactions, selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm sm:text-base">Monthly Summary</h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-2 min-w-[100px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-800 block">Money others owe me</span>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono tabular-nums mt-0.5">
            {formatCurrency(stats.moneyOthersOweMe, currencySymbol, { absolute: true })}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Receivable entries</span>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
          <span className="text-[11px] font-bold text-rose-800 block">Money I owe people</span>
          <div className="text-sm sm:text-base font-extrabold text-rose-700 font-mono tabular-nums mt-0.5">
            {formatCurrency(stats.moneyIOwe, currencySymbol, { absolute: true })}
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Payable entries</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[11px] font-bold text-slate-700 block">Month's Net</span>
          <div
            className={`text-sm sm:text-base font-extrabold font-mono tabular-nums mt-0.5 ${
              stats.net > 0
                ? 'text-emerald-700'
                : stats.net < 0
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {formatCurrency(stats.net, currencySymbol, { includeSign: true })}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {stats.txCount} {stats.txCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>
    </div>
  );
};
