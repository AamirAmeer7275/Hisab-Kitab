import React, { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Tag,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  HandCoins,
} from 'lucide-react';
import { Person, Transaction } from '../types';
import { formatCurrency, formatFullDate, getTransactionDisplayInfo } from '../utils/calculations';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  person: Person | null;
  currencySymbol: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  person,
  currencySymbol,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !transaction) return null;

  const isReceivable = transaction.type === 'RECEIVABLE';
  const personName = person ? person.name : 'Unknown';

  const handleDelete = () => {
    onDelete(transaction.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Transaction Details</h2>
            <p className="text-xs text-slate-500">Record #{transaction.id.substring(0, 8)}</p>
          </div>
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Step */}
        {showDeleteConfirm ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">Delete Transaction?</p>
                <p>
                  Are you sure you want to delete this transaction for{' '}
                  <span className="font-bold">{personName}</span> (
                  {formatCurrency(transaction.amount, currencySymbol)})?
                </p>
                <p className="text-rose-700">
                  This action cannot be undone. All account balances will automatically recalculate.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          /* Normal Details View */
          <div className="p-5 space-y-4">
            {/* Amount Banner */}
            {(() => {
              const displayInfo = getTransactionDisplayInfo(transaction, personName);
              return (
                <div
                  className={`p-4 rounded-xl text-center border ${
                    displayInfo.isSettlement
                      ? 'bg-blue-50/70 border-blue-200'
                      : displayInfo.isReceivable
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {displayInfo.isSettlement ? (
                      <HandCoins className="w-5 h-5 text-blue-700 stroke-[2.2]" />
                    ) : displayInfo.isReceivable ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                    )}
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        displayInfo.isSettlement
                          ? 'text-blue-700'
                          : displayInfo.isReceivable
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {displayInfo.directionLabel}
                    </span>
                  </div>

                  <div
                    className={`text-3xl font-extrabold font-mono tabular-nums ${
                      displayInfo.isSettlement
                        ? 'text-blue-800'
                        : displayInfo.isReceivable
                        ? 'text-emerald-800'
                        : 'text-rose-800'
                    }`}
                  >
                    {displayInfo.sign} {currencySymbol} {Number(transaction.amount).toLocaleString('en-US')}
                  </div>

                  <div className="text-xs font-bold text-slate-700 mt-1">
                    {transaction.description}
                  </div>
                </div>
              );
            })()}

            {/* Metadata breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category
                </span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  {transaction.category}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date
                </span>
                <span className="font-semibold text-slate-800">
                  {formatFullDate(transaction.date)}
                </span>
              </div>

              {transaction.time && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Time
                  </span>
                  <span className="font-semibold text-slate-800">{transaction.time}</span>
                </div>
              )}

              {transaction.note && (
                <div className="py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Notes
                  </span>
                  <p className="text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg">
                    {transaction.note}
                  </p>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Recorded: {new Date(transaction.created_at).toLocaleDateString()}</span>
                <span>Type: {transaction.type}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(transaction);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Transaction</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
