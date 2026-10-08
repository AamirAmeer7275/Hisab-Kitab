import React, { useState, useMemo } from 'react';
import { Search, UserPlus, ArrowUpDown, ChevronRight, Phone, Clock, FileText, CheckCircle2, Send } from 'lucide-react';
import { Person, Transaction, PersonBalance, BalanceStatus } from '../types';
import { calculatePersonBalance, formatCurrency, formatDisplayDate } from '../utils/calculations';

interface PeopleListProps {
  people: Person[];
  transactions: Transaction[];
  currencySymbol: string;
  onSelectPerson: (person: Person) => void;
  onOpenAddPerson: () => void;
  onQuickAddTransaction: (person: Person) => void;
  onQuickSettle: (person: Person) => void;
  onQuickRemind?: (person: Person, balance: PersonBalance) => void;
}

type FilterType = 'all' | 'they_owe_me' | 'i_owe_them' | 'settled';
type SortType = 'recent' | 'highest' | 'lowest' | 'name_asc' | 'name_desc' | 'transactions';

export const PeopleList: React.FC<PeopleListProps> = ({
  people,
  transactions,
  currencySymbol,
  onSelectPerson,
  onOpenAddPerson,
  onQuickAddTransaction,
  onQuickSettle,
  onQuickRemind,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');

  // Compute balances for all people
  const peopleWithBalances: PersonBalance[] = useMemo(() => {
    return people.map((p) => calculatePersonBalance(p, transactions));
  }, [people, transactions]);

  // Filter & Search
  const filteredPeople = useMemo(() => {
    let result = peopleWithBalances.filter((item) => {
      // Search filter
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const nameMatch = item.person.name.toLowerCase().includes(query);
        const phoneMatch = item.person.phone ? item.person.phone.toLowerCase().includes(query) : false;
        const notesMatch = item.person.notes ? item.person.notes.toLowerCase().includes(query) : false;
        if (!nameMatch && !phoneMatch && !notesMatch) return false;
      }

      // Status filter
      if (filter === 'they_owe_me') {
        return item.status === 'THEY_OWE_ME';
      }
      if (filter === 'i_owe_them') {
        return item.status === 'I_OWE_THEM';
      }
      if (filter === 'settled') {
        return item.status === 'SETTLED';
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return b.netBalance - a.netBalance;
        case 'lowest':
          return a.netBalance - b.netBalance;
        case 'name_asc':
          return a.person.name.localeCompare(b.person.name);
        case 'name_desc':
          return b.person.name.localeCompare(a.person.name);
        case 'transactions':
          return b.transactionCount - a.transactionCount;
        case 'recent':
        default: {
          const dateA = a.lastActivityDate || a.person.updated_at;
          const dateB = b.lastActivityDate || b.person.updated_at;
          return dateB.localeCompare(dateA);
        }
      }
    });

    return result;
  }, [peopleWithBalances, searchQuery, filter, sortBy]);

  // Status counts for filter chips
  const counts = useMemo(() => {
    let theyOwe = 0;
    let iOwe = 0;
    let settled = 0;
    for (const item of peopleWithBalances) {
      if (item.status === 'THEY_OWE_ME') theyOwe++;
      else if (item.status === 'I_OWE_THEM') iOwe++;
      else settled++;
    }
    return {
      all: peopleWithBalances.length,
      they_owe_me: theyOwe,
      i_owe_them: iOwe,
      settled,
    };
  }, [peopleWithBalances]);

  return (
    <div className="space-y-3">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="w-full sm:w-auto appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="recent">Recently updated</option>
              <option value="highest">Highest balance</option>
              <option value="lowest">Lowest balance</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="transactions">Most transactions</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Add Person CTA */}
          <button
            onClick={onOpenAddPerson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Person</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white font-semibold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilter('they_owe_me')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'they_owe_me'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          They Owe Me ({counts.they_owe_me})
        </button>
        <button
          onClick={() => setFilter('i_owe_them')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'i_owe_them'
              ? 'bg-rose-600 text-white font-semibold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          I Owe Them ({counts.i_owe_them})
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            filter === 'settled'
              ? 'bg-slate-700 text-white font-semibold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Settled ({counts.settled})
        </button>
      </div>

      {/* People List */}
      <div className="space-y-2">
        {filteredPeople.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            {searchQuery ? (
              <>
                <h4 className="font-semibold text-slate-900 text-sm">No people found matching "{searchQuery}"</h4>
                <p className="text-xs text-slate-500 mt-1">Try another search term or clear the filter.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : people.length === 0 ? (
              <>
                <h4 className="font-bold text-slate-900 text-base">No people added yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your first person to start tracking daily transactions, udhaar, and balances.
                </p>
                <button
                  onClick={onOpenAddPerson}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  + Add First Person
                </button>
              </>
            ) : (
              <>
                <h4 className="font-semibold text-slate-900 text-sm">No accounts in this category</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Change the active filter tab to view other accounts.
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  View All ({people.length})
                </button>
              </>
            )}
          </div>
        ) : (
          filteredPeople.map((item) => {
            const isTheyOwe = item.status === 'THEY_OWE_ME';
            const isIOwe = item.status === 'I_OWE_THEM';
            const isSettled = item.status === 'SETTLED';

            return (
              <div
                key={item.person.id}
                onClick={() => onSelectPerson(item.person)}
                className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Person Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      item.person.avatarColor || 'bg-slate-800 text-white'
                    }`}
                  >
                    {item.person.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-emerald-700 transition-colors">
                        {item.person.name}
                      </h3>
                      {isSettled && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          Settled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate">
                      {item.person.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{item.person.phone}</span>
                        </span>
                      ) : item.person.notes ? (
                        <span className="truncate text-slate-400">{item.person.notes}</span>
                      ) : null}

                      <span className="text-slate-400">·</span>
                      <span>{item.transactionCount} {item.transactionCount === 1 ? 'entry' : 'entries'}</span>

                      {item.lastActivityDate && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400 truncate">
                            {formatDisplayDate(item.lastActivityDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance & Status badge */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div
                      className={`text-base sm:text-lg font-extrabold font-mono tabular-nums leading-tight ${
                        isTheyOwe
                          ? 'text-emerald-700'
                          : isIOwe
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {isTheyOwe && `+ ${currencySymbol} ${item.netBalance.toLocaleString('en-US')}`}
                      {isIOwe && `− ${currencySymbol} ${Math.abs(item.netBalance).toLocaleString('en-US')}`}
                      {isSettled && `${currencySymbol} 0`}
                    </div>

                    <div
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isTheyOwe
                          ? 'text-emerald-700'
                          : isIOwe
                          ? 'text-rose-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {isTheyOwe && 'They owe me'}
                      {isIOwe && 'I owe them'}
                      {isSettled && 'Settled'}
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAddTransaction(item.person);
                      }}
                      title="Add transaction for this person"
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      + Entry
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickSettle(item.person);
                      }}
                      title="Record settlement payment"
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        !isSettled
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      Settle
                    </button>

                    {item.status === 'THEY_OWE_ME' && onQuickRemind && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickRemind(item.person, item);
                        }}
                        title={`Automatically send reminder to ${item.person.name}`}
                        className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Remind</span>
                      </button>
                    )}

                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
