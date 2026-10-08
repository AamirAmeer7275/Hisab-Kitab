import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { OverallSummary } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SummaryCardsProps {
  summary: OverallSummary;
  currencySymbol: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, currencySymbol }) => {
  const isNetPositive = summary.netBalance > 0.001;
  const isNetNegative = summary.netBalance < -0.001;
  const isNetZero = !isNetPositive && !isNetNegative;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Card 1: People Owe Me */}
      <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-700">
            People Owe Me
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
          {formatCurrency(summary.peopleOweMe, currencySymbol, { absolute: true })}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Total receivable amount</span>
        </div>
      </div>

      {/* Card 2: I Owe People */}
      <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-bold tracking-wider uppercase text-rose-700">
            I Owe People
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
          {formatCurrency(summary.iOwePeople, currencySymbol, { absolute: true })}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-700 font-medium">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Total payable amount</span>
        </div>
      </div>

      {/* Card 3: Net Balance */}
      <div
        className={`bg-white border rounded-xl p-4 shadow-xs relative overflow-hidden ${
          isNetPositive
            ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40'
            : isNetNegative
            ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50/40'
            : 'border-slate-200 bg-gradient-to-br from-white to-slate-50/60'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-bold tracking-wider uppercase text-slate-700">
            Net Balance
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isNetPositive
                ? 'bg-emerald-100 text-emerald-700'
                : isNetNegative
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Scale className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div
          className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${
            isNetPositive
              ? 'text-emerald-700'
              : isNetNegative
              ? 'text-rose-700'
              : 'text-slate-800'
          }`}
        >
          {formatCurrency(summary.netBalance, currencySymbol, {
            includeSign: true,
          })}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-600 truncate">
          {isNetPositive && 'You are owed money overall'}
          {isNetNegative && 'You owe more money than people owe you'}
          {isNetZero && 'All accounts are completely settled'}
        </div>
      </div>
    </div>
  );
};
