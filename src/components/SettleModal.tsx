import React, { useState, useEffect, useMemo } from 'react';
import { X, HandCoins, Check, ArrowDownLeft, ArrowUpRight, Calculator, Sparkles } from 'lucide-react';
import { Person, Transaction, PersonBalance, TransactionType } from '../types';
import { generateId } from '../utils/storage';
import { calculatePersonBalance, formatCurrency } from '../utils/calculations';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  initialPersonId?: string | null;
  transactions: Transaction[];
  currencySymbol: string;
  onSaveSettlement: (transaction: Transaction) => void;
}

export const SettleModal: React.FC<SettleModalProps> = ({
  isOpen,
  onClose,
  people,
  initialPersonId,
  transactions,
  currencySymbol,
  onSaveSettlement,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [settlementType, setSettlementType] = useState<'THEY_PAID_ME' | 'I_PAID_THEM'>('THEY_PAID_ME');
  const [description, setDescription] = useState<string>('Settlement payment');
  const [category, setCategory] = useState<string>('Settlement');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const currentPerson = useMemo(() => {
    return people.find((p) => p.id === selectedPersonId) || null;
  }, [people, selectedPersonId]);

  const balanceInfo: PersonBalance | null = useMemo(() => {
    if (!currentPerson) return null;
    return calculatePersonBalance(currentPerson, transactions);
  }, [currentPerson, transactions]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      const targetId = initialPersonId || (people.length > 0 ? people[0].id : '');
      setSelectedPersonId(targetId);

      const targetPerson = people.find((p) => p.id === targetId);
      if (targetPerson) {
        const bal = calculatePersonBalance(targetPerson, transactions);
        const absBal = Math.abs(bal.netBalance);
        setAmount(absBal > 0 ? absBal.toString() : '');

        // If they owe me (>0), default to "THEY_PAID_ME"
        // If I owe them (<0), default to "I_PAID_THEM"
        if (bal.netBalance >= 0) {
          setSettlementType('THEY_PAID_ME');
        } else {
          setSettlementType('I_PAID_THEM');
        }
      } else {
        setAmount('');
        setSettlementType('THEY_PAID_ME');
      }

      setDescription('Settlement payment');
      setCategory('Settlement');
      setNote('');
    }
  }, [isOpen, initialPersonId, people, transactions]);

  // When user changes person in dropdown
  const handlePersonChange = (newPersonId: string) => {
    setSelectedPersonId(newPersonId);
    const targetPerson = people.find((p) => p.id === newPersonId);
    if (targetPerson) {
      const bal = calculatePersonBalance(targetPerson, transactions);
      const absBal = Math.abs(bal.netBalance);
      setAmount(absBal > 0 ? absBal.toString() : '');
      if (bal.netBalance >= 0) {
        setSettlementType('THEY_PAID_ME');
      } else {
        setSettlementType('I_PAID_THEM');
      }
    }
  };

  if (!isOpen) return null;

  const currentBalance = balanceInfo ? balanceInfo.netBalance : 0;
  const enteredAmount = parseFloat(amount) || 0;

  // Calculate new balance preview
  // If THEY_PAID_ME: records PAYABLE (- enteredAmount from balance)
  // If I_PAID_THEM: records RECEIVABLE (+ enteredAmount towards balance)
  const previewNetBalance =
    settlementType === 'THEY_PAID_ME'
      ? currentBalance - enteredAmount
      : currentBalance + enteredAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) {
      setError('Please select a person to settle with');
      return;
    }
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero');
      return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    // Section 14 & 15 accounting logic:
    // When they pay me back, it offsets their debt -> PAYABLE, subType = 'PAYMENT_RECEIVED'
    // When I pay them back, it offsets my debt -> RECEIVABLE, subType = 'PAYMENT_PAID'
    const transactionType: TransactionType =
      settlementType === 'THEY_PAID_ME' ? 'PAYABLE' : 'RECEIVABLE';
    const subType =
      settlementType === 'THEY_PAID_ME' ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID';

    const tx: Transaction = {
      id: generateId(),
      person_id: selectedPersonId,
      amount: enteredAmount,
      type: transactionType,
      subType,
      description: description.trim() || 'Settlement payment',
      category: category.trim() || 'Settlement',
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      note:
        note.trim() ||
        (Math.abs(previewNetBalance) < 0.01
          ? 'Full settlement cleared'
          : 'Partial settlement payment'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSaveSettlement(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <HandCoins className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Settle Payment</h2>
              <p className="text-xs text-slate-500">Record full or partial Udhaar settlement</p>
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Person *
            </label>
            <select
              value={selectedPersonId}
              onChange={(e) => handlePersonChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {people.map((p) => {
                const bal = calculatePersonBalance(p, transactions);
                const balText =
                  bal.status === 'THEY_OWE_ME'
                    ? `(Owes you ${currencySymbol} ${bal.netBalance.toLocaleString()})`
                    : bal.status === 'I_OWE_THEM'
                    ? `(You owe ${currencySymbol} ${Math.abs(bal.netBalance).toLocaleString()})`
                    : `(Settled · ${currencySymbol} 0)`;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {balText}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Current Balance Display */}
          {currentPerson && balanceInfo && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Current Ledger Balance</span>
                <span
                  className={`text-base font-extrabold font-mono tabular-nums ${
                    balanceInfo.status === 'THEY_OWE_ME'
                      ? 'text-emerald-700'
                      : balanceInfo.status === 'I_OWE_THEM'
                      ? 'text-rose-700'
                      : 'text-slate-700'
                  }`}
                >
                  {formatCurrency(balanceInfo.netBalance, currencySymbol, { includeSign: true })}
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  balanceInfo.status === 'THEY_OWE_ME'
                    ? 'bg-emerald-100 text-emerald-800'
                    : balanceInfo.status === 'I_OWE_THEM'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {balanceInfo.status === 'THEY_OWE_ME' && `${currentPerson.name} owes you`}
                {balanceInfo.status === 'I_OWE_THEM' && `You owe ${currentPerson.name}`}
                {balanceInfo.status === 'SETTLED' && 'Settled'}
              </span>
            </div>
          )}

          {/* 2. Settlement Direction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Direction *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettlementType('THEY_PAID_ME')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  settlementType === 'THEY_PAID_ME'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>They Paid Me</span>
                </div>
                <span
                  className={`text-[10px] ${
                    settlementType === 'THEY_PAID_ME' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  Cash received / Debt cleared
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettlementType('I_PAID_THEM')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  settlementType === 'I_PAID_THEM'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>I Paid Them</span>
                </div>
                <span
                  className={`text-[10px] ${
                    settlementType === 'I_PAID_THEM' ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  Cash paid / You cleared debt
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 px-0.5">
              {settlementType === 'THEY_PAID_ME'
                ? `✓ Money received from ${currentPerson?.name || 'them'} clears their balance. It will NEVER be added to what you owe.`
                : `✓ Money paid by you to ${currentPerson?.name || 'them'} clears what you owe them.`}
            </p>
          </div>

          {/* 3. Settlement Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Settlement Amount ({currencySymbol}) *
              </label>
              {currentPerson && balanceInfo && Math.abs(balanceInfo.netBalance) > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(Math.abs(balanceInfo.netBalance).toString())}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Full {currencySymbol} {Math.abs(balanceInfo.netBalance).toLocaleString()}</span>
                </button>
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
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus
              />
            </div>

            {/* Quick Helper Chips */}
            {currentPerson && balanceInfo && Math.abs(balanceInfo.netBalance) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(Math.abs(balanceInfo.netBalance).toString())}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                >
                  Clear Full Balance (100%)
                </button>
                {Math.abs(balanceInfo.netBalance) >= 200 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(Math.round(Math.abs(balanceInfo.netBalance) / 2).toString())
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Half (50%)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Live Balance Projection Box */}
          {enteredAmount > 0 && currentPerson && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span>Balance after this payment:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Math.abs(previewNetBalance) < 0.001 ? (
                    <span className="text-emerald-700 font-extrabold">
                      {currencySymbol} 0 (Completely Settled!)
                    </span>
                  ) : previewNetBalance > 0 ? (
                    <span className="text-emerald-700">
                      +{currencySymbol} {previewNetBalance.toLocaleString()} (They still owe you)
                    </span>
                  ) : (
                    <span className="text-rose-700">
                      −{currencySymbol} {Math.abs(previewNetBalance).toLocaleString()} (You still owe them)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* 5. Description & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Mode / Note (optional)
              </label>
              <input
                type="text"
                placeholder="Cash, Bank, JazzCash..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Settlement Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

