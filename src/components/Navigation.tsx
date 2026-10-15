import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  PieChart,
  PiggyBank,
  ArrowLeftRight,
  Landmark,
  Calendar as CalendarIcon,
  FileBarChart2,
  FolderTree,
  Settings,
  Sun,
  Moon,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ViewTab, UserProfile, CurrencyCode } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';

interface NavigationProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  profile?: UserProfile;
  selectedMonth: string;
  onToggleTheme: () => void;
  isDark: boolean;
  onSelectCurrency: (currency: CurrencyCode) => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  profile,
  selectedMonth,
  onToggleTheme,
  isDark,
  onSelectCurrency,
  userEmail,
  onLogout,
}) => {
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);

  // Format month for header safely
  const safeMonth =
    selectedMonth && typeof selectedMonth === 'string' && selectedMonth.includes('-')
      ? selectedMonth
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = safeMonth.split('-');
  const monthDate = new Date(parseInt(year, 10) || new Date().getFullYear(), (parseInt(month, 10) || 1) - 1, 1);
  const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const displayName = profile?.name || (userEmail ? userEmail.split('@')[0] : 'User');

  // Core high-frequency navigation tabs
  const primaryTabs: { tab: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { tab: 'transactions', label: 'Transactions', icon: ReceiptText },
    { tab: 'budget', label: 'Budgets', icon: PieChart },
    { tab: 'reports', label: 'Analytics', icon: FileBarChart2 },
  ];

  // Secondary tools organized in a clean flyout/modal
  const secondaryTools: { tab: ViewTab; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'savings', label: 'Savings Goals', desc: 'Vault deposits & targets', icon: PiggyBank },
    { tab: 'credit_debit', label: 'Credit & Debit', desc: 'Borrowers & lenders balance', icon: ArrowLeftRight },
    { tab: 'loans', label: 'Loans & EMIs', desc: 'Repayments & interest schedule', icon: Landmark },
    { tab: 'calendar', label: 'Financial Calendar', desc: 'Daily timeline of cashflow', icon: CalendarIcon },
    { tab: 'categories', label: 'Categories', desc: 'Manage budget categories', icon: FolderTree },
    { tab: 'settings', label: 'Settings & Cloud', desc: 'Backblaze B2, export & sync', icon: Settings },
  ];

  const isSecondaryActive = secondaryTools.some((t) => t.tab === activeTab);

  return (
    <>
      {/* Top Application Header */}
      <header
        id="app-header"
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Logo & Executive Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md font-black text-lg border-t border-emerald-300">
              ₨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Smart Expense
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {formattedMonth}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Precision Personal Wealth & Expense Manager
              </p>
            </div>
          </div>

          {/* Desktop Streamlined Navigation Controls */}
          <nav className="hidden md:flex items-center p-1 rounded-xl track-recessed">
            {primaryTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={`nav-desktop-${item.tab}`}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'nav-tab-3d active'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Tools Dropdown trigger */}
            <div className="relative">
              <button
                id="nav-desktop-tools-btn"
                onClick={() => setShowToolsDrawer(!showToolsDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSecondaryActive
                    ? 'nav-tab-3d active'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>More Tools</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showToolsDrawer ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </nav>

          {/* Right Action Controls: Currency + Theme + Tactile Quick Add */}
          <div className="flex items-center gap-2">
            <select
              id="header-currency-selector"
              value={profile?.defaultCurrency || profile?.currency || 'PKR'}
              onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
              className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner"
              title="Change Display Currency"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>

            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="btn-3d btn-3d-secondary w-9 h-9 p-0"
              title="Toggle Dark/Light Mode"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Tactile 3D Add Transaction Primary Button */}
            <button
              id="header-add-transaction-btn"
              onClick={onOpenAddModal}
              className="btn-3d btn-3d-emerald px-4 py-2 text-xs gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Entry</span>
            </button>

            {onLogout && (
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="btn-3d btn-3d-secondary w-9 h-9 p-0 text-slate-400 hover:text-rose-500"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Secondary Tools Drawer / Modal */}
      {showToolsDrawer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Financial Tool Suite</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accounts, loans, targets, and cloud synchronization
                </p>
              </div>
              <button
                onClick={() => setShowToolsDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {secondaryTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTab === tool.tab;
                return (
                  <button
                    key={tool.tab}
                    onClick={() => {
                      setActiveTab(tool.tab);
                      setShowToolsDrawer(false);
                    }}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all text-left ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{tool.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{tool.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Ergonomic 3D Bottom Floating Dock (Android Optimized) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-inset-bottom">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px]">Ledger</span>
        </button>

        {/* Floating Tactile 3D Action Center Button */}
        <button
          onClick={onOpenAddModal}
          className="btn-3d btn-3d-emerald w-12 h-12 -mt-5 rounded-2xl shadow-xl flex items-center justify-center text-white"
          title="Add New Transaction"
          aria-label="Add New Transaction"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'budget'
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Budgets</span>
        </button>

        <button
          onClick={() => setShowToolsDrawer(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            isSecondaryActive
              ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Tools</span>
        </button>
      </div>
    </>
  );
};
