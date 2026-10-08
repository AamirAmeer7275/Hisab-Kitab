import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertTriangle } from 'lucide-react';
import { Person } from '../types';
import { generateId, getRandomAvatarColor } from '../utils/storage';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPeople: Person[];
  editingPerson?: Person | null;
  onSavePerson: (person: Person) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  existingPeople,
  editingPerson,
  onSavePerson,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setDuplicateWarning(false);
      if (editingPerson) {
        setName(editingPerson.name);
        setPhone(editingPerson.phone || '');
        setNotes(editingPerson.notes || '');
      } else {
        setName('');
        setPhone('');
        setNotes('');
      }
    }
  }, [isOpen, editingPerson]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent, forceAllowDuplicate = false) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter a person name');
      return;
    }

    // Check duplicate name
    if (!editingPerson && !forceAllowDuplicate) {
      const isDuplicate = existingPeople.some(
        (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        setDuplicateWarning(true);
        return;
      }
    }

    const person: Person = {
      id: editingPerson ? editingPerson.id : generateId(),
      name: trimmedName,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      avatarColor: editingPerson ? editingPerson.avatarColor : getRandomAvatarColor(),
      created_at: editingPerson ? editingPerson.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSavePerson(person);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {editingPerson ? 'Edit Person Details' : 'Add New Person'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingPerson ? 'Update contact info' : 'Create an account to start tracking transactions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Dialog */}
        {duplicateWarning ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Duplicate Name Detected</p>
                <p>
                  A person named <span className="font-bold underline">"{name.trim()}"</span> already
                  exists in your Hisab-Kitab ledger.
                </p>
                <p className="text-amber-800">
                  Do you want to create another person with the exact same name?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Change Name
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Yes, Create Anyway
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sufyan, Munawar, Shan..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number (optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. +92 300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Notes / Relationship (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Friend from university, Flatmate, Colleague..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{editingPerson ? 'Save Changes' : 'Save Person'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
