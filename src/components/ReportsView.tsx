import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Person, Transaction } from '../types';
import { calculatePersonBalance, formatCurrency } from '../utils/calculations';

interface ReportsViewProps {
  people: Person[];
  transactions: Transaction[];
  currencySymbol: string;
  onSelectPerson: (person: Person) => void;
}

type DateRangeFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  people,
  transactions,
  currencySymbol,
  onSelectPerson,
}) => {
  const [filterRange, setFilterRange] = useState<DateRangeFilter>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Filter transactions by selected range
  const filteredTransactions = useMemo(() => {
    if (filterRange === 'all') return transactions;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return transactions.filter((t) => {
      if (!t.date) return false;

      if (filterRange === 'today') {
        return t.date === todayStr;
      }

      if (filterRange === 'week') {
        // Last 7 days
        const tDate = new Date(t.date);
        const diffTime = now.getTime() - tDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      if (filterRange === 'month') {
        // Current month
        const currentYearMonth = todayStr.substring(0, 7);
        return t.date.startsWith(currentYearMonth);
      }

      if (filterRange === 'year') {
        // Current year
        const currentYear = todayStr.substring(0, 4);
        return t.date.startsWith(currentYear);
      }

      if (filterRange === 'custom') {
        if (customStart && t.date < customStart) return false;
        if (customEnd && t.date > customEnd) return false;
        return true;
      }

      return true;
    });
  }, [transactions, filterRange, customStart, customEnd]);

  // Overall calculations based on filtered transactions
  const reportSummary = useMemo(() => {
    let totalReceivable = 0;
    let totalPayable = 0;
    let totalSettled = 0;

    for (const t of filteredTransactions) {
      const amt = Number(t.amount) || 0;
      const isSettlement =
        t.category === 'Settlement' ||
        t.subType === 'SETTLEMENT' ||
        t.subType === 'PAYMENT_RECEIVED' ||
        t.subType === 'PAYMENT_PAID' ||
        t.description.toLowerCase().includes('settle');

      if (isSettlement) {
        totalSettled += amt;
      } else if (t.type === 'RECEIVABLE') {
        totalReceivable += amt;
      } else {
        // Pure payable/borrowing - never add settlement payments into I owe
        totalPayable += amt;
      }
    }

    // Net from all filtered transactions
    let net = 0;
    for (const t of filteredTransactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'RECEIVABLE') net += amt;
      else net -= amt;
    }

    // People accounts analysis (active vs settled)
    let activeAccountsCount = 0;
    let settledAccountsCount = 0;

    const peopleBalances = people.map((p) => calculatePersonBalance(p, transactions));
    for (const pb of peopleBalances) {
      if (pb.status === 'SETTLED') {
        settledAccountsCount++;
      } else {
        activeAccountsCount++;
      }
    }

    // Category breakdown
    const categoryMap: { [cat: string]: { receivable: number; payable: number; total: number } } = {};
    for (const t of filteredTransactions) {
      const cat = t.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { receivable: 0, payable: 0, total: 0 };
      }
      const amt = Number(t.amount) || 0;
      categoryMap[cat].total += amt;
      if (t.type === 'RECEIVABLE') {
        categoryMap[cat].receivable += amt;
      } else {
        categoryMap[cat].payable += amt;
      }
    }

    const categories = Object.entries(categoryMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    // Top Debtors (people who owe me the most)
    const topDebtors = [...peopleBalances]
      .filter((pb) => pb.netBalance > 0.001)
      .sort((a, b) => b.netBalance - a.netBalance)
      .slice(0, 5);

    // Top Creditors (people I owe the most)
    const topCreditors = [...peopleBalances]
      .filter((pb) => pb.netBalance < -0.001)
      .sort((a, b) => a.netBalance - b.netBalance)
      .slice(0, 5);

    return {
      totalReceivable,
      totalPayable,
      totalSettled,
      net,
      totalTransactionsCount: filteredTransactions.length,
      totalPeopleCount: people.length,
      settledAccountsCount,
      activeAccountsCount,
      categories,
      topDebtors,
      topCreditors,
    };
  }, [filteredTransactions, people, transactions]);

  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-xs text-slate-500">Summary statistics, cashflow, and category distribution</p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterRange('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterRange === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilterRange('month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterRange === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilterRange('week')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterRange === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilterRange('today')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterRange === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterRange('year')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterRange === 'year' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setFilterRange('custom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterRange === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {filterRange === 'custom' && (
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* High-level summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Receivable
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {formatCurrency(reportSummary.totalReceivable, currencySymbol, { absolute: true })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Recorded within selected range</span>
        </div>

        <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Total Payable
            </span>
            <ArrowUpRight className="w-4 h-4 text-rose-600 stroke-[2.5]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
            {formatCurrency(reportSummary.totalPayable, currencySymbol, { absolute: true })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Recorded within selected range</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Net Balance
            </span>
            <Scale className="w-4 h-4 text-slate-600 stroke-[2.5]" />
          </div>
          <div
            className={`text-2xl font-extrabold font-mono tabular-nums ${
              reportSummary.net > 0
                ? 'text-emerald-700'
                : reportSummary.net < 0
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {formatCurrency(reportSummary.net, currencySymbol, { includeSign: true })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Receivable minus payable</span>
        </div>
      </div>

      {/* Account Stats Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Total People</span>
          <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
            {reportSummary.totalPeopleCount} accounts
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Active (Pending)</span>
          <span className="text-lg font-extrabold text-amber-700 mt-0.5 block">
            {reportSummary.activeAccountsCount} accounts
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Settled (Zero Balance)</span>
          <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
            {reportSummary.settledAccountsCount} accounts
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block font-medium">Transactions</span>
          <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
            {reportSummary.totalTransactionsCount} recorded
          </span>
        </div>
      </div>

      {/* Top Debtors & Top Creditors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Debtors (Who owes me most) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Who Owes Me Most</span>
            </h3>
            <span className="text-[11px] text-slate-400">Top 5</span>
          </div>

          <div className="space-y-2">
            {reportSummary.topDebtors.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No pending receivables</p>
            ) : (
              reportSummary.topDebtors.map((item) => (
                <div
                  key={item.person.id}
                  onClick={() => onSelectPerson(item.person)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        item.person.avatarColor || 'bg-slate-800 text-white'
                      }`}
                    >
                      {item.person.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.person.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono tabular-nums text-emerald-700">
                    + {formatCurrency(item.netBalance, currencySymbol, { absolute: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Creditors (Whom I owe most) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Whom I Owe Most</span>
            </h3>
            <span className="text-[11px] text-slate-400">Top 5</span>
          </div>

          <div className="space-y-2">
            {reportSummary.topCreditors.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No pending payables</p>
            ) : (
              reportSummary.topCreditors.map((item) => (
                <div
                  key={item.person.id}
                  onClick={() => onSelectPerson(item.person)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        item.person.avatarColor || 'bg-slate-800 text-white'
                      }`}
                    >
                      {item.person.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{item.person.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono tabular-nums text-rose-700">
                    − {formatCurrency(Math.abs(item.netBalance), currencySymbol, { absolute: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Category Breakdown</span>
        </h3>

        <div className="space-y-2.5">
          {reportSummary.categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No transactions recorded</p>
          ) : (
            reportSummary.categories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    {cat.receivable > 0 && (
                      <span className="text-emerald-700">
                        +{formatCurrency(cat.receivable, currencySymbol, { absolute: true })}
                      </span>
                    )}
                    {cat.payable > 0 && (
                      <span className="text-rose-700">
                        −{formatCurrency(cat.payable, currencySymbol, { absolute: true })}
                      </span>
                    )}
                    <span className="font-bold text-slate-900">
                      Total: {formatCurrency(cat.total, currencySymbol, { absolute: true })}
                    </span>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  {cat.receivable > 0 && (
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(cat.receivable / cat.total) * 100}%` }}
                    />
                  )}
                  {cat.payable > 0 && (
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${(cat.payable / cat.total) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
