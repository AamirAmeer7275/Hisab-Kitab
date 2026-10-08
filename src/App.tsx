/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Person, Transaction, AppSettings, TabType } from './types';
import {
  loadPeople,
  savePeople,
  loadTransactions,
  saveTransactions,
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { calculateOverallSummary, formatCurrency } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SummaryCards } from './components/SummaryCards';
import { PeopleList } from './components/PeopleList';
import { PersonLedgerView } from './components/PersonLedgerView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddPersonModal } from './components/AddPersonModal';
import { SettleModal } from './components/SettleModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { RecentTransactions } from './components/RecentTransactions';
import { MonthlySummary } from './components/MonthlySummary';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PinLockScreen } from './components/PinLockScreen';
import { Toast } from './components/Toast';
import { ReminderModal, normalizePhoneForWhatsApp } from './components/ReminderModal';
import { PersonBalance } from './types';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txTargetPersonId, setTxTargetPersonId] = useState<string | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleTargetPerson, setSettleTargetPerson] = useState<Person | null>(null);

  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [deletingPersonTarget, setDeletingPersonTarget] = useState<Person | null>(null);

  // Security Lock
  const [isPinLocked, setIsPinLocked] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Initial Load from persistent storage
  useEffect(() => {
    const loadedPeople = loadPeople();
    const loadedTx = loadTransactions();
    const loadedSettings = loadSettings();

    setPeople(loadedPeople);
    setTransactions(loadedTx);
    setSettings(loadedSettings);

    if (loadedSettings.pinLockEnabled && loadedSettings.pinCode) {
      setIsPinLocked(true);
    }

    setIsLoaded(true);
  }, []);

  // Compute Overall Summary automatically from current people and transactions
  const summary = useMemo(() => {
    return calculateOverallSummary(people, transactions);
  }, [people, transactions]);

  // Keep selectedPerson in sync if people array updates
  useEffect(() => {
    if (selectedPerson) {
      const updated = people.find((p) => p.id === selectedPerson.id);
      if (updated) {
        setSelectedPerson(updated);
      }
    }
  }, [people]);

  // Handler: Save or Update Transaction
  const handleSaveTransaction = (transaction: Transaction) => {
    const existingIndex = transactions.findIndex((t) => t.id === transaction.id);
    let updatedList: Transaction[];

    if (existingIndex >= 0) {
      updatedList = [...transactions];
      updatedList[existingIndex] = transaction;
      showToast('Transaction updated');
    } else {
      updatedList = [transaction, ...transactions];
      showToast('Transaction recorded');
    }

    // Also update target person's updated_at
    const updatedPeople = people.map((p) => {
      if (p.id === transaction.person_id) {
        return { ...p, updated_at: new Date().toISOString() };
      }
      return p;
    });

    setTransactions(updatedList);
    saveTransactions(updatedList);
    setPeople(updatedPeople);
    savePeople(updatedPeople);
    setEditingTransaction(null);
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = (transactionId: string) => {
    const updatedList = transactions.filter((t) => t.id !== transactionId);
    setTransactions(updatedList);
    saveTransactions(updatedList);
    showToast('Transaction deleted');
  };

  // Handler: Save or Update Person
  const handleSavePerson = (person: Person) => {
    const existingIndex = people.findIndex((p) => p.id === person.id);
    let updatedPeople: Person[];

    if (existingIndex >= 0) {
      updatedPeople = [...people];
      updatedPeople[existingIndex] = person;
      showToast(`${person.name}'s info updated`);
    } else {
      updatedPeople = [...people, person];
      showToast(`${person.name} added to ledger`);
    }

    setPeople(updatedPeople);
    savePeople(updatedPeople);
    setEditingPerson(null);
  };

  // Handler: Delete Person and their transactions
  const handleConfirmDeletePerson = () => {
    if (!deletingPersonTarget) return;

    const personId = deletingPersonTarget.id;
    const personName = deletingPersonTarget.name;

    const updatedPeople = people.filter((p) => p.id !== personId);
    const updatedTransactions = transactions.filter((t) => t.person_id !== personId);

    setPeople(updatedPeople);
    savePeople(updatedPeople);
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);

    if (selectedPerson && selectedPerson.id === personId) {
      setSelectedPerson(null);
    }
    setDeletingPersonTarget(null);
    showToast(`${personName}'s account deleted`);
  };

  // Handler: Settings change
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Handler: Storage reset or import
  const handleReloadData = () => {
    setPeople(loadPeople());
    setTransactions(loadTransactions());
    setSettings(loadSettings());
    setSelectedPerson(null);
  };

  // Quick action openers
  const openAddTransactionForPerson = (person: Person) => {
    setTxTargetPersonId(person.id);
    setEditingTransaction(null);
    setIsAddTxOpen(true);
  };

  const openSettleForPerson = (person: Person) => {
    setSettleTargetPerson(person);
    setIsSettleOpen(true);
  };

  const [quickReminderTarget, setQuickReminderTarget] = useState<{
    person: Person;
    balance: PersonBalance;
  } | null>(null);

  const handleQuickRemind = (person: Person, balance: PersonBalance) => {
    const isTheyOwe = balance.status === 'THEY_OWE_ME';
    const isIOwe = balance.status === 'I_OWE_THEM';

    let message = '';
    if (isTheyOwe) {
      message = `Salam ${person.name}, hope you are doing well! As per our personal Hisab-Kitab ledger, your pending balance is ${formatCurrency(
        balance.netBalance,
        settings.currencySymbol
      )}. Kindly settle when convenient. Thanks!`;
    } else if (isIOwe) {
      message = `Salam ${person.name}, just checking our ledger: I owe you ${formatCurrency(
        Math.abs(balance.netBalance),
        settings.currencySymbol
      )}. Please share your payment details (Bank/JazzCash/EasyPaisa) so I can clear it. Thanks!`;
    } else {
      message = `Salam ${person.name}, our Hisab-Kitab ledger is completely settled (${formatCurrency(
        0,
        settings.currencySymbol
      )}). Thanks!`;
    }

    if (person.phone) {
      const cleanPhone = normalizePhoneForWhatsApp(person.phone);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Automatically sending reminder to ${person.name} via WhatsApp...`);
    } else {
      // If phone number is not available, open ReminderModal to input phone and send
      setQuickReminderTarget({ person, balance });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 font-bold text-sm animate-pulse">Loading Hisab-Kitab...</div>
      </div>
    );
  }

  // If app is PIN locked
  if (isPinLocked && settings.pinCode) {
    return (
      <PinLockScreen
        correctPin={settings.pinCode}
        onUnlock={() => setIsPinLocked(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        summary={summary}
        activeTab={activeTab}
        onOpenAddTransaction={() => {
          setTxTargetPersonId(selectedPerson ? selectedPerson.id : undefined);
          setEditingTransaction(null);
          setIsAddTxOpen(true);
        }}
        onOpenSettleModal={() => {
          setSettleTargetPerson(selectedPerson || null);
          setIsSettleOpen(true);
        }}
        onOpenAddPerson={() => {
          setEditingPerson(null);
          setIsAddPersonOpen(true);
        }}
        onLockApp={
          settings.pinLockEnabled
            ? () => {
                setIsPinLocked(true);
              }
            : undefined
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4">
        {selectedPerson ? (
          /* Single Person Ledger Screen */
          <PersonLedgerView
            person={selectedPerson}
            transactions={transactions}
            currencySymbol={settings.currencySymbol}
            onBack={() => setSelectedPerson(null)}
            onAddTransaction={(p) => openAddTransactionForPerson(p)}
            onSettleBalance={(p) => openSettleForPerson(p)}
            onEditPerson={(p) => {
              setEditingPerson(p);
              setIsAddPersonOpen(true);
            }}
            onDeletePerson={(p) => setDeletingPersonTarget(p)}
            onSelectTransaction={(tx) => setViewingTransaction(tx)}
            onShowToast={showToast}
            onUpdatePersonPhone={(newPhone) => {
              if (selectedPerson) {
                const updated = {
                  ...selectedPerson,
                  phone: newPhone,
                  updated_at: new Date().toISOString(),
                };
                handleSavePerson(updated);
              }
            }}
          />
        ) : (
          /* Tab Navigation Views */
          <div className="space-y-5">
            {activeTab === 'home' && (
              <>
                {/* 1. Dashboard Summary Cards */}
                <SummaryCards
                  summary={summary}
                  currencySymbol={settings.currencySymbol}
                />

                {/* 2. People Quick Ledger Section */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                      Accounts & Balances
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {people.length} {people.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>

                  <PeopleList
                    people={people}
                    transactions={transactions}
                    currencySymbol={settings.currencySymbol}
                    onSelectPerson={(p) => setSelectedPerson(p)}
                    onOpenAddPerson={() => {
                      setEditingPerson(null);
                      setIsAddPersonOpen(true);
                    }}
                    onQuickAddTransaction={(p) => openAddTransactionForPerson(p)}
                    onQuickSettle={(p) => openSettleForPerson(p)}
                    onQuickRemind={handleQuickRemind}
                  />
                </div>

                {/* 3. Recent Transactions Feed */}
                <RecentTransactions
                  transactions={transactions}
                  people={people}
                  currencySymbol={settings.currencySymbol}
                  onSelectTransaction={(tx) => setViewingTransaction(tx)}
                  onViewAll={() => setActiveTab('people')}
                />

                {/* 4. Monthly Summary Section */}
                <MonthlySummary
                  transactions={transactions}
                  currencySymbol={settings.currencySymbol}
                />
              </>
            )}

            {activeTab === 'people' && (
              <div className="space-y-3 pb-16">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">People & Accounts</h1>
                  <p className="text-xs text-slate-500">Track and manage individual ledgers and balances</p>
                </div>

                <PeopleList
                  people={people}
                  transactions={transactions}
                  currencySymbol={settings.currencySymbol}
                  onSelectPerson={(p) => setSelectedPerson(p)}
                  onOpenAddPerson={() => {
                    setEditingPerson(null);
                    setIsAddPersonOpen(true);
                  }}
                  onQuickAddTransaction={(p) => openAddTransactionForPerson(p)}
                  onQuickSettle={(p) => openSettleForPerson(p)}
                  onQuickRemind={handleQuickRemind}
                />
              </div>
            )}

            {activeTab === 'reports' && (
              <ReportsView
                people={people}
                transactions={transactions}
                currencySymbol={settings.currencySymbol}
                onSelectPerson={(p) => setSelectedPerson(p)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onDataReset={handleReloadData}
                onShowToast={showToast}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setSelectedPerson(null);
          setActiveTab(tab);
        }}
        onOpenAddTransaction={() => {
          setTxTargetPersonId(selectedPerson ? selectedPerson.id : undefined);
          setEditingTransaction(null);
          setIsAddTxOpen(true);
        }}
      />

      {/* Modal: Add or Edit Transaction */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setEditingTransaction(null);
        }}
        people={people}
        transactions={transactions}
        defaultPersonId={txTargetPersonId}
        editingTransaction={editingTransaction}
        currencySymbol={settings.currencySymbol}
        onSave={handleSaveTransaction}
        onAddNewPersonModal={() => {
          setIsAddPersonOpen(true);
        }}
      />

      {/* Modal: Add or Edit Person */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => {
          setIsAddPersonOpen(false);
          setEditingPerson(null);
        }}
        existingPeople={people}
        editingPerson={editingPerson}
        onSavePerson={handleSavePerson}
      />

      {/* Modal: Settle Balance */}
      <SettleModal
        isOpen={isSettleOpen}
        onClose={() => {
          setIsSettleOpen(false);
          setSettleTargetPerson(null);
        }}
        people={people}
        initialPersonId={settleTargetPerson ? settleTargetPerson.id : undefined}
        transactions={transactions}
        currencySymbol={settings.currencySymbol}
        onSaveSettlement={handleSaveTransaction}
      />

      {/* Modal: View Transaction Details & Delete */}
      <TransactionDetailModal
        isOpen={!!viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        transaction={viewingTransaction}
        person={
          viewingTransaction
            ? people.find((p) => p.id === viewingTransaction.person_id) || null
            : null
        }
        currencySymbol={settings.currencySymbol}
        onEdit={(tx) => {
          setEditingTransaction(tx);
          setTxTargetPersonId(tx.person_id);
          setIsAddTxOpen(true);
        }}
        onDelete={handleDeleteTransaction}
      />

      {/* Confirmation Modal: Delete Person Target */}
      {deletingPersonTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Delete Account: {deletingPersonTarget.name}?</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <span className="font-bold">{deletingPersonTarget.name}</span>?
              All transactions associated with this person will also be permanently removed.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingPersonTarget(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletePerson}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Reminder via WhatsApp/SMS */}
      {quickReminderTarget && (
        <ReminderModal
          isOpen={!!quickReminderTarget}
          onClose={() => setQuickReminderTarget(null)}
          person={quickReminderTarget.person}
          balanceInfo={quickReminderTarget.balance}
          currencySymbol={settings.currencySymbol}
          onUpdatePersonPhone={(newPhone) => {
            const updated = {
              ...quickReminderTarget.person,
              phone: newPhone,
              updated_at: new Date().toISOString(),
            };
            handleSavePerson(updated);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
