import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Tag,
  User,
  DollarSign,
  Plus,
  HandCoins,
  Sparkles,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Person, Transaction, TransactionType, TransactionSubType } from '../types';
import { generateId } from '../utils/storage';
import { calculatePersonBalance, formatCurrency } from '../utils/calculations';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  transactions?: Transaction[];
  defaultPersonId?: string;
  editingTransaction?: Transaction | null;
  currencySymbol: string;
  onSave: (transaction: Transaction) => void;
  onAddNewPersonModal?: () => void;
}

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const PRESET_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Internet',
  'Rent',
  'Loan',
  'Cash',
  'Settlement',
  'Other',
];

const QUICK_DESCRIPTIONS = [
  'Dinner',
  'Lunch',
  'Groceries',
  'Fuel',
  'Cash loan',
  'Internet bill',
  'Settlement payment',
  'Tea & snacks',
  'Apartment rent',
];

type EntryMode = 'THEY_OWE_ME' | 'I_OWE_THEM' | 'SETTLE_PAYMENT';
type SettlementDirection = 'PAYMENT_RECEIVED' | 'PAYMENT_PAID';

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  people,
  transactions = [],
  defaultPersonId,
  editingTransaction,
  currencySymbol,
  onSave,
  onAddNewPersonModal,
}) => {
  const [personId, setPersonId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [entryMode, setEntryMode] = useState<EntryMode>('THEY_OWE_ME');
  const [settlementDirection, setSettlementDirection] = useState<SettlementDirection>('PAYMENT_RECEIVED');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Food');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Selected person & balance
  const selectedPerson = useMemo(() => {
    return people.find((p) => p.id === personId) || null;
  }, [people, personId]);

  const personBalance = useMemo(() => {
    if (!selectedPerson) return null;
    return calculatePersonBalance(selectedPerson, transactions);
  }, [selectedPerson, transactions]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (editingTransaction) {
        setPersonId(editingTransaction.person_id);
        setAmount(editingTransaction.amount.toString());

        const isSettlement =
          editingTransaction.category === 'Settlement' ||
          editingTransaction.subType === 'SETTLEMENT' ||
          editingTransaction.subType === 'PAYMENT_RECEIVED' ||
          editingTransaction.subType === 'PAYMENT_PAID' ||
          editingTransaction.description.toLowerCase().includes('settle');

        if (isSettlement) {
          setEntryMode('SETTLE_PAYMENT');
          if (editingTransaction.subType === 'PAYMENT_PAID' || editingTransaction.type === 'RECEIVABLE') {
            setSettlementDirection('PAYMENT_PAID');
          } else {
            setSettlementDirection('PAYMENT_RECEIVED');
          }
        } else if (editingTransaction.type === 'RECEIVABLE') {
          setEntryMode('THEY_OWE_ME');
        } else {
          setEntryMode('I_OWE_THEM');
        }

        setDescription(editingTransaction.description);
        if (PRESET_CATEGORIES.includes(editingTransaction.category)) {
          setCategory(editingTransaction.category);
          setIsCustomCategory(false);
          setCustomCategory('');
        } else {
          setCategory('Other');
          setIsCustomCategory(true);
          setCustomCategory(editingTransaction.category);
        }
        setDate(editingTransaction.date);
        setTime(editingTransaction.time || '');
        setNote(editingTransaction.note || '');
      } else {
        // New transaction defaults
        const targetId = defaultPersonId || (people.length > 0 ? people[0].id : '');
        setPersonId(targetId);
        setAmount('');
        setEntryMode('THEY_OWE_ME');
        setSettlementDirection('PAYMENT_RECEIVED');
        setDescription('');
        setCategory('Food');
        setIsCustomCategory(false);
        setCustomCategory('');

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);

        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        setTime(`${hh}:${min}`);
        setNote('');
      }
    }
  }, [isOpen, defaultPersonId, editingTransaction, people]);

  // Adjust settlement direction when person changes and user is in SETTLE_PAYMENT mode
  const handlePersonChange = (newPersonId: string) => {
    setPersonId(newPersonId);
    const targetPerson = people.find((p) => p.id === newPersonId);
    if (targetPerson && entryMode === 'SETTLE_PAYMENT') {
      const bal = calculatePersonBalance(targetPerson, transactions);
      if (bal.netBalance >= 0) {
        setSettlementDirection('PAYMENT_RECEIVED');
      } else {
        setSettlementDirection('PAYMENT_PAID');
      }
      const absBal = Math.abs(bal.netBalance);
      if (absBal > 0 && !amount) {
        setAmount(absBal.toString());
      }
    }
  };

  const handleSelectMode = (mode: EntryMode) => {
    setEntryMode(mode);
    if (mode === 'SETTLE_PAYMENT') {
      setCategory('Settlement');
      if (!description.trim() || description === 'Dinner' || description === 'Lunch') {
        setDescription('Settlement payment');
      }
      if (personBalance) {
        if (personBalance.netBalance >= 0) {
          setSettlementDirection('PAYMENT_RECEIVED');
        } else {
          setSettlementDirection('PAYMENT_PAID');
        }
        const absBal = Math.abs(personBalance.netBalance);
        if (absBal > 0 && (!amount || parseFloat(amount) === 0)) {
          setAmount(absBal.toString());
        }
      }
    } else {
      if (category === 'Settlement') {
        setCategory('Food');
      }
      if (description === 'Settlement payment') {
        setDescription('');
      }
    }
  };

  if (!isOpen) return null;

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
  };

  const handleFillFullBalance = () => {
    if (!personBalance) return;
    const absBal = Math.abs(personBalance.netBalance);
    if (absBal > 0) {
      setAmount(absBal.toString());
    }
  };

  const handleFillHalfBalance = () => {
    if (!personBalance) return;
    const absBal = Math.abs(personBalance.netBalance);
    if (absBal > 0) {
      setAmount(Math.round(absBal / 2).toString());
    }
  };

  // Live balance preview calculation
  const enteredAmount = parseFloat(amount) || 0;
  const currentNetBalance = personBalance ? personBalance.netBalance : 0;
  let previewNetBalance = currentNetBalance;

  if (entryMode === 'THEY_OWE_ME') {
    previewNetBalance = currentNetBalance + enteredAmount;
  } else if (entryMode === 'I_OWE_THEM') {
    previewNetBalance = currentNetBalance - enteredAmount;
  } else if (entryMode === 'SETTLE_PAYMENT') {
    if (settlementDirection === 'PAYMENT_RECEIVED') {
      previewNetBalance = currentNetBalance - enteredAmount;
    } else {
      previewNetBalance = currentNetBalance + enteredAmount;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!personId) {
      setError('Please select a person');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description (e.g. Dinner, Groceries, Settlement)');
      return;
    }
    if (!date) {
      setError('Please select a valid date');
      return;
    }

    let finalType: TransactionType;
    let finalSubType: TransactionSubType;
    let finalCategory = isCustomCategory ? customCategory.trim() || 'Other' : category;

    if (entryMode === 'THEY_OWE_ME') {
      finalType = 'RECEIVABLE';
      finalSubType = 'GIVEN';
    } else if (entryMode === 'I_OWE_THEM') {
      finalType = 'PAYABLE';
      finalSubType = 'BORROWED';
    } else {
      // SETTLE_PAYMENT
      finalCategory = 'Settlement';
      if (settlementDirection === 'PAYMENT_RECEIVED') {
        // Section 14 accounting: Payment received from debtor offsets receivable balance -> stored as PAYABLE
        // CRITICAL: SubType is PAYMENT_RECEIVED so it is NEVER counted or displayed as "I owe them"!
        finalType = 'PAYABLE';
        finalSubType = 'PAYMENT_RECEIVED';
      } else {
        // Payment paid to creditor offsets payable balance -> stored as RECEIVABLE
        finalType = 'RECEIVABLE';
        finalSubType = 'PAYMENT_PAID';
      }
    }

    const tx: Transaction = {
      id: editingTransaction ? editingTransaction.id : generateId(),
      person_id: personId,
      amount: numAmount,
      type: finalType,
      subType: finalSubType,
      description: description.trim(),
      category: finalCategory,
      date,
      time: time || undefined,
      note: note.trim() || undefined,
      created_at: editingTransaction ? editingTransaction.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
              </h2>
              <p className="text-xs text-slate-500">Fast Udhaar and payment entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Person Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Person *
              </label>
              {onAddNewPersonModal && (
                <button
                  type="button"
                  onClick={onAddNewPersonModal}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  + Add New Person
                </button>
              )}
            </div>

            {people.length === 0 ? (
              <div className="text-xs text-rose-600 p-2 bg-rose-50 rounded-lg">
                No people created yet. Please create a person first!
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  value={personId}
                  onChange={(e) => handlePersonChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {people.map((p) => {
                    const b = calculatePersonBalance(p, transactions);
                    const bText =
                      b.status === 'THEY_OWE_ME'
                        ? `(Owes you ${currencySymbol} ${b.netBalance.toLocaleString()})`
                        : b.status === 'I_OWE_THEM'
                        ? `(You owe ${currencySymbol} ${Math.abs(b.netBalance).toLocaleString()})`
                        : `(Settled · ${currencySymbol} 0)`;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {bText}
                      </option>
                    );
                  })}
                </select>

                {/* Current balance indicator bar */}
                {selectedPerson && personBalance && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Current Balance</span>
                      <span
                        className={`font-mono font-bold ${
                          personBalance.status === 'THEY_OWE_ME'
                            ? 'text-emerald-700'
                            : personBalance.status === 'I_OWE_THEM'
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatCurrency(personBalance.netBalance, currencySymbol, {
                          includeSign: true,
                        })}
                        {' '}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({personBalance.status === 'THEY_OWE_ME'
                            ? `${selectedPerson.name} owes you`
                            : personBalance.status === 'I_OWE_THEM'
                            ? `You owe ${selectedPerson.name}`
                            : 'Settled'})
                        </span>
                      </span>
                    </div>

                    {Math.abs(personBalance.netBalance) > 0 && entryMode !== 'SETTLE_PAYMENT' && (
                      <button
                        type="button"
                        onClick={() => handleSelectMode('SETTLE_PAYMENT')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>Settle Payment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Transaction Direction: 3 Distinct Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Type / Direction *
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Option A: They Owe Me */}
              <button
                type="button"
                onClick={() => handleSelectMode('THEY_OWE_ME')}
                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  entryMode === 'THEY_OWE_ME'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs sm:text-sm">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>They Owe Me</span>
                </div>
                <span
                  className={`text-[10px] leading-tight ${
                    entryMode === 'THEY_OWE_ME' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  Udhaar / Gave money
                </span>
              </button>

              {/* Option B: I Owe Them */}
              <button
                type="button"
                onClick={() => handleSelectMode('I_OWE_THEM')}
                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  entryMode === 'I_OWE_THEM'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs sm:text-sm">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>I Owe Them</span>
                </div>
                <span
                  className={`text-[10px] leading-tight ${
                    entryMode === 'I_OWE_THEM' ? 'text-rose-100' : 'text-slate-400'
                  }`}
                >
                  Borrowed from them
                </span>
              </button>

              {/* Option C: Settle Payment */}
              <button
                type="button"
                onClick={() => handleSelectMode('SETTLE_PAYMENT')}
                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  entryMode === 'SETTLE_PAYMENT'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs sm:text-sm">
                  <HandCoins className="w-4 h-4 stroke-[2.2]" />
                  <span>Settle Payment</span>
                </div>
                <span
                  className={`text-[10px] leading-tight ${
                    entryMode === 'SETTLE_PAYMENT' ? 'text-slate-200' : 'text-slate-400'
                  }`}
                >
                  Clear balance / Cash
                </span>
              </button>
            </div>

            {/* Settle Payment Sub-Section */}
            {entryMode === 'SETTLE_PAYMENT' && (
              <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Settlement Direction
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Never added into "I owe someone"</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlementDirection('PAYMENT_RECEIVED')}
                    className={`py-2.5 px-3 rounded-lg border text-left transition-all cursor-pointer ${
                      settlementDirection === 'PAYMENT_RECEIVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>They Paid Me</span>
                    </div>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        settlementDirection === 'PAYMENT_RECEIVED'
                          ? 'text-emerald-100'
                          : 'text-slate-400'
                      }`}
                    >
                      Payment received from debtor
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementDirection('PAYMENT_PAID')}
                    className={`py-2.5 px-3 rounded-lg border text-left transition-all cursor-pointer ${
                      settlementDirection === 'PAYMENT_PAID'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>I Paid Them</span>
                    </div>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        settlementDirection === 'PAYMENT_PAID'
                          ? 'text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      Payment paid to clear debt
                    </span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {settlementDirection === 'PAYMENT_RECEIVED'
                    ? `✓ Money received from ${selectedPerson?.name || 'them'} reduces their debt towards Rs. 0. It will never be added to what you owe.`
                    : `✓ Money paid by you to ${selectedPerson?.name || 'them'} reduces what you owed them towards Rs. 0.`}
                </p>
              </div>
            )}
          </div>

          {/* 3. Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Amount ({currencySymbol}) *
              </label>
              {selectedPerson && personBalance && Math.abs(personBalance.netBalance) > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillFullBalance}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Full {currencySymbol} {Math.abs(personBalance.netBalance).toLocaleString()}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillHalfBalance}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Half (50%)
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus={!editingTransaction}
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  +{val.toLocaleString('en-US')}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Live Balance Projection Box */}
          {enteredAmount > 0 && selectedPerson && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>Resulting balance after this entry:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Math.abs(previewNetBalance) < 0.001 ? (
                    <span className="text-emerald-700 font-extrabold">
                      {currencySymbol} 0 (Completely Settled!)
                    </span>
                  ) : previewNetBalance > 0 ? (
                    <span className="text-emerald-700">
                      +{currencySymbol} {previewNetBalance.toLocaleString()} ({selectedPerson.name} owes you)
                    </span>
                  ) : (
                    <span className="text-rose-700">
                      −{currencySymbol} {Math.abs(previewNetBalance).toLocaleString()} (You owe {selectedPerson.name})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* 4. Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner, Fuel, Internet, Settlement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />

            {/* Quick Description chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_DESCRIPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDescription(item)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Category (only shown if not in settlement mode) */}
          {entryMode !== 'SETTLE_PAYMENT' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setIsCustomCategory(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      !isCustomCategory && category === cat
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isCustomCategory
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Custom...
                </button>
              </div>

              {isCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              )}
            </div>
          )}

          {/* 6. Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Time (optional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 7. Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via Cash, JazzCash, EasyPaisa, restaurant bill..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {editingTransaction
                  ? 'Save Changes'
                  : entryMode === 'SETTLE_PAYMENT'
                  ? 'Record Settlement Payment'
                  : 'Record Transaction'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
