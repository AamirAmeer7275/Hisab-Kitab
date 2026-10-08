import React, { useState } from 'react';
import { Lock, BookOpen, Delete } from 'lucide-react';

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ correctPin, onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setError(false);

      if (next.length === 4) {
        if (next === correctPin) {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setError(true);
          setTimeout(() => {
            setEnteredPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        {/* App Logo */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <BookOpen className="w-8 h-8 text-white stroke-[2.5]" />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">Hisab-Kitab</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your 4-digit PIN to access your ledger</p>
        </div>

        {/* PIN Indicators */}
        <div className={`flex items-center gap-4 py-3 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                enteredPin.length > idx
                  ? error
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : 'bg-emerald-400 border-emerald-400 scale-110'
                  : 'border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-400 -mt-2">
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-xl font-bold font-mono flex items-center justify-center transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-xl font-bold font-mono flex items-center justify-center transition-all cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
