import React from 'react';
import { BookOpen, Shield, Lock, RefreshCw, Plus } from 'lucide-react';
import { AppSettings, OverallSummary } from '../types';

interface NavbarProps {
  settings: AppSettings;
  summary: OverallSummary;
  onOpenAddTransaction: () => void;
  onOpenAddPerson: () => void;
  onOpenSettleModal?: () => void;
  onLockApp?: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  summary,
  onOpenAddTransaction,
  onOpenAddPerson,
  onOpenSettleModal,
  onLockApp,
  activeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">Hisab-Kitab</span>
              <span className="hidden sm:inline text-xs font-medium text-slate-400">· Personal Ledger</span>
            </div>
          </div>
        </div>

        {/* Quick Status & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {settings.pinLockEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              title="Lock App"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Lock App"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {onOpenSettleModal && (
            <button
              onClick={onOpenSettleModal}
              title="Record a settlement payment"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>🤝 Settle</span>
            </button>
          )}

          <button
            onClick={onOpenAddPerson}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Person
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Add Entry</span>
            <span className="xs:hidden">Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};
