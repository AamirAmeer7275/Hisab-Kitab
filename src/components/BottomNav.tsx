import React from 'react';
import { Home, Users, BarChart3, Settings, Plus } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenAddTransaction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddTransaction,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
            activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          aria-label="Home Dashboard"
        >
          <Home className="w-5 h-5 stroke-[2]" />
          <span className="text-[11px] font-semibold mt-1">Home</span>
        </button>

        {/* Tab 2: People */}
        <button
          onClick={() => onChangeTab('people')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
            activeTab === 'people' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          aria-label="People List"
        >
          <Users className="w-5 h-5 stroke-[2]" />
          <span className="text-[11px] font-semibold mt-1">People</span>
        </button>

        {/* Center Floating (+) Quick Add Button */}
        <div className="flex-1 flex items-center justify-center -mt-6">
          <button
            onClick={onOpenAddTransaction}
            className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-slate-50 transition-all cursor-pointer"
            aria-label="Add Transaction"
            title="Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Reports */}
        <button
          onClick={() => onChangeTab('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
            activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          aria-label="Reports"
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className="text-[11px] font-semibold mt-1">Reports</span>
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
            activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 stroke-[2]" />
          <span className="text-[11px] font-semibold mt-1">Settings</span>
        </button>
      </div>
    </nav>
  );
};
