import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Calendar,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { AppSettings, Person, Transaction } from '../types';
import { exportDataJSON, exportDataCSV, importDataJSON, resetToSampleData, clearAllData } from '../utils/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataReset: () => void;
  onShowToast: (message: string) => void;
}

const CURRENCIES = [
  { code: 'PKR', symbol: 'Rs.', label: 'PKR — Pakistani Rupee (Rs.)' },
  { code: 'USD', symbol: '$', label: 'USD — US Dollar ($)' },
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee (₹)' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound (£)' },
  { code: 'AED', symbol: 'AED', label: 'AED — UAE Dirham (AED)' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR — Saudi Riyal (SAR)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD — Canadian Dollar (C$)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
  onShowToast,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // PIN settings state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Import file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        onDataReset();
        onShowToast(res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Download JSON
  const handleExportJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisab-kitab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Full JSON backup downloaded successfully');
  };

  // Download CSV
  const handleExportCSV = () => {
    const csvStr = exportDataCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisab-kitab-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('CSV exported for Excel / Google Sheets');
  };

  // Save new PIN
  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    onUpdateSettings({
      ...settings,
      pinLockEnabled: true,
      pinCode: newPin,
    });
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    onShowToast('PIN lock activated successfully');
  };

  // Disable PIN
  const handleDisablePin = () => {
    onUpdateSettings({
      ...settings,
      pinLockEnabled: false,
      pinCode: undefined,
    });
    onShowToast('PIN lock disabled');
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">App Settings</h1>
        <p className="text-xs text-slate-500">Configure currency, backup, and security preferences</p>
      </div>

      {/* General Settings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Currency & Display</span>
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Default Currency
          </label>
          <select
            value={settings.currencyCode}
            onChange={(e) => {
              const selected = CURRENCIES.find((c) => c.code === e.target.value);
              if (selected) {
                onUpdateSettings({
                  ...settings,
                  currencyCode: selected.code,
                  currencySymbol: selected.symbol,
                });
                onShowToast(`Currency updated to ${selected.code} (${selected.symbol})`);
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Date Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => {
              onUpdateSettings({
                ...settings,
                dateFormat: e.target.value as any,
              });
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-08)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (08/10/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (10/08/2026)</option>
          </select>
        </div>
      </div>

      {/* Security & App Lock */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Security & App Lock</h3>
          </div>
          {settings.pinLockEnabled && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
              PIN Protected
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Protect your personal financial records from casual browsing by enabling a 4-digit PIN lock.
        </p>

        {settings.pinLockEnabled ? (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PIN Lock is currently active</span>
            </div>
            <button
              onClick={handleDisablePin}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Disable PIN
            </button>
          </div>
        ) : (
          <form onSubmit={handleSetPin} className="space-y-3 pt-1">
            {pinError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {pinError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter 4-digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Enable 4-Digit PIN Lock
            </button>
          </form>
        )}
      </div>

      {/* Backup & Restore */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-600" />
          <span>Backup & Data Export</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs block">Export JSON Backup</span>
              <span className="text-[11px] text-slate-500 block">Full database export</span>
            </div>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs block">Export CSV</span>
              <span className="text-[11px] text-slate-500 block">Excel & Sheets friendly</span>
            </div>
          </button>
        </div>

        {/* Restore Import */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Restore Backup File
          </label>
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Select .JSON Backup File to Restore</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone: Reset & Clear */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-600" />
          <span>Reset & Sample Data</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Sample Hisab-Kitab (Sufyan, Munawar, Shan...)</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h4 className="font-bold text-slate-900 text-sm">Load Sample Data?</h4>
            <p className="text-xs text-slate-600">
              This will load default people (Sufyan, Munawar, Shan, Khawar, Umair, Ahmad, Mobeen) and sample transactions for testing.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setShowResetConfirm(false);
                  onDataReset();
                  onShowToast('Sample ledger data loaded successfully');
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
              >
                Load Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h4 className="font-bold text-rose-700 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Clear All Data?
            </h4>
            <p className="text-xs text-slate-600">
              Are you sure? This will delete all people and transactions permanently from this device.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                  onDataReset();
                  onShowToast('All data cleared');
                }}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
