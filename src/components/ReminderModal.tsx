import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Copy, Check, Phone, ExternalLink } from 'lucide-react';
import { Person, PersonBalance } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  balanceInfo: PersonBalance;
  currencySymbol: string;
  onUpdatePersonPhone?: (newPhone: string) => void;
  onShowToast: (msg: string) => void;
}

export function normalizePhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    // Pakistani format 03xxxxxxxxx -> 923xxxxxxxxx
    cleaned = '92' + cleaned.substring(1);
  }
  return cleaned;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  person,
  balanceInfo,
  currencySymbol,
  onUpdatePersonPhone,
  onShowToast,
}) => {
  const [phone, setPhone] = useState(person.phone || '');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone(person.phone || '');
      setCopied(false);

      const isTheyOwe = balanceInfo.status === 'THEY_OWE_ME';
      const isIOwe = balanceInfo.status === 'I_OWE_THEM';

      let defaultMsg = '';
      if (isTheyOwe) {
        defaultMsg = `Salam ${person.name}, hope you are doing well! As per our personal Hisab-Kitab ledger, your pending balance is ${formatCurrency(
          balanceInfo.netBalance,
          currencySymbol
        )}. Kindly settle when convenient. Thanks!`;
      } else if (isIOwe) {
        defaultMsg = `Salam ${person.name}, just checking our ledger: I owe you ${formatCurrency(
          Math.abs(balanceInfo.netBalance),
          currencySymbol
        )}. Please share your payment details (Bank/JazzCash/EasyPaisa) so I can clear it. Thanks!`;
      } else {
        defaultMsg = `Salam ${person.name}, our Hisab-Kitab ledger is completely settled (${formatCurrency(
          0,
          currencySymbol
        )}). Thanks!`;
      }

      setMessage(defaultMsg);
    }
  }, [isOpen, person, balanceInfo, currencySymbol]);

  if (!isOpen) return null;

  const cleanPhone = normalizePhoneForWhatsApp(phone);

  const handleSendWhatsApp = () => {
    if (phone.trim() && onUpdatePersonPhone && phone !== person.phone) {
      onUpdatePersonPhone(phone.trim());
    }

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;

    // Open WhatsApp
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Opening WhatsApp for ${person.name}...`);
    onClose();
  };

  const handleSendSMS = () => {
    const encodedMsg = encodeURIComponent(message);
    const smsUrl = cleanPhone ? `sms:${cleanPhone}?body=${encodedMsg}` : `sms:?body=${encodedMsg}`;

    const link = document.createElement('a');
    link.href = smsUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Opening SMS app for ${person.name}...`);
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    onShowToast('Reminder message copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Send Reminder</h2>
              <p className="text-xs text-slate-500">Send automatic message to {person.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipient Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="e.g. +92 300 1234567 or 03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            {!phone && (
              <span className="text-[11px] text-amber-600 mt-1 block">
                Enter phone number to send directly to their WhatsApp/SMS
              </span>
            )}
          </div>

          {/* Message Preview & Edit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Message Content
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Balance summary tag */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Pending Ledger Balance:</span>
            <span className="font-bold font-mono text-emerald-800">
              {formatCurrency(balanceInfo.netBalance, currencySymbol, { includeSign: true })}
            </span>
          </div>

          {/* Send Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
              <span>Send Automatically via WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendSMS}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Send via SMS</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Message'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
