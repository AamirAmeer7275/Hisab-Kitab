import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, ChevronRight, HandCoins } from 'lucide-react';
import { Person, Transaction } from '../types';
import { formatCurrency, formatDisplayDate, getTransactionDisplayInfo } from '../utils/calculations';

interface RecentTransactionsProps {
  transactions: Transaction[];
  people: Person[];
  currencySymbol: string;
  onSelectTransaction: (transaction: Transaction) => void;
  onViewAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  people,
  currencySymbol,
  onSelectTransaction,
  onViewAll,
}) => {
  const peopleMap = new Map(people.map((p) => [p.id, p]));

  // Get 5 most recent transactions
  const recent = [...transactions]
    .sort((a, b) => {
      const dtA = `${a.date} ${a.time || '00:00'}`;
      const dtB = `${b.date} ${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    })
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm sm:text-base">Recent Transactions</h2>
        </div>
        {transactions.length > 5 && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {recent.map((tx) => {
          const person = peopleMap.get(tx.person_id);
          const displayInfo = getTransactionDisplayInfo(tx, person ? person.name : 'Unknown');

          return (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    displayInfo.isSettlement
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : displayInfo.isReceivable
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}
                >
                  {displayInfo.isSettlement ? (
                    <HandCoins className="w-3.5 h-3.5 stroke-[2.2]" />
                  ) : displayInfo.isReceivable ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                      {person ? person.name : 'Unknown Person'}
                    </span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs text-slate-600 truncate">{tx.description}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{formatDisplayDate(tx.date)}</span>
                    <span>·</span>
                    <span className={displayInfo.isSettlement ? 'text-blue-700 font-semibold' : ''}>
                      {displayInfo.isSettlement ? displayInfo.badgeLabel : tx.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-xs sm:text-sm font-extrabold font-mono tabular-nums ${
                    displayInfo.isSettlement
                      ? 'text-blue-700'
                      : displayInfo.isReceivable
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {displayInfo.sign} {currencySymbol} {Number(tx.amount).toLocaleString('en-US')}
                </div>
                <div
                  className={`text-[10px] uppercase font-bold tracking-tight ${
                    displayInfo.isSettlement
                      ? 'text-blue-700'
                      : displayInfo.isReceivable
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {displayInfo.isSettlement ? 'Settlement' : displayInfo.isReceivable ? 'Owes me' : 'I owe'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
