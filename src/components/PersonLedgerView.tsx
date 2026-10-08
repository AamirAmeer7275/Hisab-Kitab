import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  HandCoins,
  Share2,
  Edit2,
  Trash2,
  Phone,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Clock,
  Tag,
  Copy,
  Check,
  MoreVertical,
  FileDown,
  MessageSquare,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Person, Transaction, PersonBalance } from '../types';
import {
  calculatePersonBalance,
  formatCurrency,
  formatDisplayDate,
  formatFullDate,
  getTransactionDisplayInfo,
} from '../utils/calculations';
import { ExportPDFModal } from './ExportPDFModal';
import { ReminderModal, normalizePhoneForWhatsApp } from './ReminderModal';

interface PersonLedgerViewProps {
  person: Person;
  transactions: Transaction[];
  currencySymbol: string;
  onBack: () => void;
  onAddTransaction: (person: Person) => void;
  onSettleBalance: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  onSelectTransaction: (transaction: Transaction) => void;
  onShowToast: (message: string) => void;
  onUpdatePersonPhone?: (newPhone: string) => void;
}

export const PersonLedgerView: React.FC<PersonLedgerViewProps> = ({
  person,
  transactions,
  currencySymbol,
  onBack,
  onAddTransaction,
  onSettleBalance,
  onEditPerson,
  onDeletePerson,
  onSelectTransaction,
  onShowToast,
  onUpdatePersonPhone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'RECEIVABLE' | 'PAYABLE'>('all');
  const [isExportPDFOpen, setIsExportPDFOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Compute this person's balance from all transactions
  const balanceInfo: PersonBalance = useMemo(() => {
    return calculatePersonBalance(person, transactions);
  }, [person, transactions]);

  // Person's transactions filtered and sorted
  const personTransactions = useMemo(() => {
    const list = transactions.filter((t) => t.person_id === person.id);

    return list
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const descMatch = t.description.toLowerCase().includes(q);
          const catMatch = t.category.toLowerCase().includes(q);
          const noteMatch = t.note ? t.note.toLowerCase().includes(q) : false;
          return descMatch || catMatch || noteMatch;
        }
        return true;
      })
      .sort((a, b) => {
        const dtA = `${a.date} ${a.time || '00:00'}`;
        const dtB = `${b.date} ${b.time || '00:00'}`;
        return dtB.localeCompare(dtA);
      });
  }, [transactions, person.id, typeFilter, searchQuery]);

  // Group transactions by date for clear chronological reading
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    for (const t of personTransactions) {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    }
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [personTransactions]);

  // Handle automatic reminder message dispatch
  const handleAutomaticReminder = () => {
    const isTheyOwe = balanceInfo.status === 'THEY_OWE_ME';
    const isIOwe = balanceInfo.status === 'I_OWE_THEM';

    let message = '';
    if (isTheyOwe) {
      message = `Salam ${person.name}, hope you are doing well! As per our personal Hisab-Kitab ledger, your pending balance is ${formatCurrency(
        balanceInfo.netBalance,
        currencySymbol
      )}. Kindly settle when convenient. Thanks!`;
    } else if (isIOwe) {
      message = `Salam ${person.name}, just checking our ledger: I owe you ${formatCurrency(
        Math.abs(balanceInfo.netBalance),
        currencySymbol
      )}. Please share your payment details (Bank/JazzCash/EasyPaisa) so I can clear it. Thanks!`;
    } else {
      message = `Salam ${person.name}, our Hisab-Kitab ledger is completely settled (${formatCurrency(
        0,
        currencySymbol
      )}). Thanks!`;
    }

    if (person.phone) {
      const cleanPhone = normalizePhoneForWhatsApp(person.phone);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      // Automatically launch WhatsApp with filled message!
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast(`Sending reminder to ${person.name} via WhatsApp...`);
    } else {
      // Prompt modal so user can enter phone number to send
      setIsReminderModalOpen(true);
    }
  };

  const isTheyOwe = balanceInfo.status === 'THEY_OWE_ME';
  const isIOwe = balanceInfo.status === 'I_OWE_THEM';
  const isSettled = balanceInfo.status === 'SETTLED';

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            aria-label="Back to People list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                person.avatarColor || 'bg-slate-800 text-white'
              }`}
            >
              {person.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-lg leading-tight">{person.name}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {person.phone && <span>{person.phone}</span>}
                {person.phone && person.notes && <span>·</span>}
                {person.notes && <span className="truncate max-w-[200px]">{person.notes}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="relative">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditPerson(person)}
              title="Edit Person Details"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeletePerson(person)}
              title="Delete Person"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Balance Banner */}
      <div
        className={`bg-white border rounded-2xl p-5 shadow-xs relative overflow-hidden ${
          isTheyOwe
            ? 'border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/50'
            : isIOwe
            ? 'border-rose-200 bg-gradient-to-br from-white via-white to-rose-50/50'
            : 'border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Balance
            </span>
            <div
              className={`text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight mt-0.5 ${
                isTheyOwe
                  ? 'text-emerald-700'
                  : isIOwe
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}
            >
              {isTheyOwe && `+ ${currencySymbol} ${balanceInfo.netBalance.toLocaleString('en-US')}`}
              {isIOwe && `− ${currencySymbol} ${Math.abs(balanceInfo.netBalance).toLocaleString('en-US')}`}
              {isSettled && `${currencySymbol} 0`}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-md ${
                  isTheyOwe
                    ? 'bg-emerald-100 text-emerald-800'
                    : isIOwe
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isTheyOwe && `${person.name} owes me`}
                {isIOwe && `I owe ${person.name}`}
                {isSettled && 'Settled · Zero balance'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              onClick={() => onAddTransaction(person)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Transaction</span>
            </button>

            <button
              onClick={() => onSettleBalance(person)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <HandCoins className="w-4 h-4" />
              <span>Settle Payment</span>
            </button>

            <button
              onClick={() => setIsExportPDFOpen(true)}
              title="Export Statement as PDF (1-200 days, lifetime)"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Export PDF</span>
            </button>

            <div className="flex items-center">
              <button
                onClick={handleAutomaticReminder}
                title="Automatically send message to recipient via WhatsApp"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-l-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Remind</span>
              </button>
              <button
                onClick={() => setIsReminderModalOpen(true)}
                title="Customize reminder message or send via SMS"
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-y border-r border-emerald-200 rounded-r-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">{person.name} owes me</span>
            <span className="font-bold text-emerald-700 font-mono tabular-nums text-sm">
              {formatCurrency(balanceInfo.receivableTotal, currencySymbol, { absolute: true })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">I owe {person.name}</span>
            <span className="font-bold text-rose-700 font-mono tabular-nums text-sm">
              {formatCurrency(balanceInfo.payableTotal, currencySymbol, { absolute: true })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Settled Payments</span>
            <span className="font-bold text-slate-700 font-mono tabular-nums text-sm">
              {formatCurrency(balanceInfo.totalReceived + balanceInfo.totalPaid, currencySymbol, { absolute: true })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Transactions</span>
            <span className="font-bold text-slate-800 text-sm">
              {balanceInfo.transactionCount} entries
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('RECEIVABLE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'RECEIVABLE' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            They Owe Me
          </button>
          <button
            onClick={() => setTypeFilter('PAYABLE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'PAYABLE' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            I Owe Them
          </button>
        </div>
      </div>

      {/* Transactions History by Date */}
      <div className="space-y-4">
        {groupedTransactions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            {searchQuery || typeFilter !== 'all' ? (
              <>
                <h4 className="font-semibold text-slate-900 text-sm">No matching transactions</h4>
                <p className="text-xs text-slate-500 mt-1">Try resetting the search or type filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                  }}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h4 className="font-bold text-slate-900 text-base">No transactions yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add a transaction to start tracking money owed between you and {person.name}.
                </p>
                <button
                  onClick={() => onAddTransaction(person)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  + Add First Transaction
                </button>
              </>
            )}
          </div>
        ) : (
          groupedTransactions.map(([date, txList]) => (
            <div key={date} className="space-y-2">
              <div className="text-xs font-bold text-slate-600 tracking-wider flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatFullDate(date)}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 font-normal">
                  {formatDisplayDate(date)}
                </span>
              </div>

              <div className="space-y-2">
                {txList.map((tx) => {
                  const displayInfo = getTransactionDisplayInfo(tx, person.name);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            displayInfo.isSettlement
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : displayInfo.isReceivable
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}
                        >
                          {displayInfo.isSettlement ? (
                            <HandCoins className="w-4 h-4 stroke-[2.2]" />
                          ) : displayInfo.isReceivable ? (
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                              {tx.description}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${
                                displayInfo.isSettlement
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {displayInfo.isSettlement ? displayInfo.badgeLabel : tx.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span
                              className={`font-semibold ${
                                displayInfo.isSettlement
                                  ? 'text-blue-700 font-bold'
                                  : displayInfo.isReceivable
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {displayInfo.directionLabel}
                            </span>
                            {tx.time && (
                              <>
                                <span>·</span>
                                <span>{tx.time}</span>
                              </>
                            )}
                            {tx.note && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[150px] text-slate-400">
                                  {tx.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-base font-extrabold font-mono tabular-nums ${
                            displayInfo.isSettlement
                              ? 'text-blue-700'
                              : displayInfo.isReceivable
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {displayInfo.sign}{' '}
                          {currencySymbol} {Number(tx.amount).toLocaleString('en-US')}
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">
                          View details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export PDF Statement Modal (1-200 days, lifetime) */}
      <ExportPDFModal
        isOpen={isExportPDFOpen}
        onClose={() => setIsExportPDFOpen(false)}
        person={person}
        transactions={transactions}
        currencySymbol={currencySymbol}
        onShowToast={onShowToast}
      />

      {/* Automatic Reminder / Message Dispatch Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        person={person}
        balanceInfo={balanceInfo}
        currencySymbol={currencySymbol}
        onUpdatePersonPhone={onUpdatePersonPhone}
        onShowToast={onShowToast}
      />
    </div>
  );
};
