import React, { useState } from 'react';
import {
  Home,
  ReceiptText,
  Plus,
  PieChart,
  MoreHorizontal,
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
} from 'lucide-react';
import { ViewTab, UserProfile, CurrencyCode } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';

interface NavigationProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenAddModal: () => void;
  profile: UserProfile;
  selectedMonth: string;
  onToggleTheme: () => void;
  isDark: boolean;
  onSelectCurrency: (currency: CurrencyCode) => void;
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
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Format month for header
  const [year, month] = selectedMonth.split('-');
  const monthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const moreItems: { tab: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { tab: 'credit_debit', label: 'Credit & Debit', icon: ArrowLeftRight },
    { tab: 'loans', label: 'Loans & Repayments', icon: Landmark },
    { tab: 'calendar', label: 'Financial Calendar', icon: CalendarIcon },
    { tab: 'reports', label: 'Reports & Export', icon: FileBarChart2 },
    { tab: 'categories', label: 'Categories', icon: FolderTree },
    { tab: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Application Header */}
      <header
        id="app-header"
        className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-tight">
              ₨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  Smart Expense Tracker
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {formattedMonth}
                </span>
                <span className="hidden md:inline-flex text-[11px] text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
                  By <strong className="font-semibold text-slate-700 dark:text-slate-300 ml-1">A.K.A Tech</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
                <span>Welcome back, {profile.name}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px]">
                  WhatsApp:{' '}
                  <a
                    href="https://wa.me/923149891182"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    +923149891182
                  </a>
                </span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              id="nav-desktop-home"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-desktop-txs"
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Transactions
            </button>
            <button
              id="nav-desktop-budget"
              onClick={() => setActiveTab('budget')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'budget'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Budget
            </button>
            <button
              id="nav-desktop-savings"
              onClick={() => setActiveTab('savings')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'savings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Savings
            </button>
            <button
              id="nav-desktop-credit"
              onClick={() => setActiveTab('credit_debit')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'credit_debit'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Credit & Debit
            </button>
            <button
              id="nav-desktop-loans"
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'loans'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Loans
            </button>
            <button
              id="nav-desktop-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Calendar
            </button>
            <button
              id="nav-desktop-reports"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Reports
            </button>
            <button
              id="nav-desktop-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Controls: Currency selector + Quick Add + Theme toggle */}
          <div className="flex items-center gap-2">
            <select
              id="header-currency-selector"
              value={profile.defaultCurrency}
              onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Dark/Light Mode"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            <button
              id="header-add-transaction-btn"
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (PRD: Home, Transactions, Add (+), Budget, More) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          id="tab-mobile-home"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          id="tab-mobile-transactions"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            activeTab === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">History</span>
        </button>

        {/* Center Prominent Add Button */}
        <button
          id="tab-mobile-add-btn"
          onClick={onOpenAddModal}
          className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-90 transition-transform"
          aria-label="Add Transaction"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          id="tab-mobile-budget"
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            activeTab === 'budget'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Budget</span>
        </button>

        <button
          id="tab-mobile-more"
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-lg transition-colors ${
            moreItems.some((m) => m.tab === activeTab)
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* Mobile "More" Drawer / Modal */}
      {showMoreMenu && (
        <div
          id="mobile-more-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            id="mobile-more-panel"
            className="w-full max-w-xs bg-white dark:bg-slate-900 h-full p-5 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-base text-slate-900 dark:text-white">All Modules</span>
                <button
                  id="close-more-panel-btn"
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      id={`more-menu-${item.tab}`}
                      onClick={() => {
                        setActiveTab(item.tab);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center leading-relaxed">
              Developed by <span className="font-semibold text-slate-700 dark:text-slate-300">A.K.A Tech</span>
              <br />
              A company by <span className="font-semibold text-slate-700 dark:text-slate-300">Arshad Khan Aastik</span>
              <br />
              Whatsapp:{' '}
              <a
                href="https://wa.me/923149891182"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
              >
                +923149891182
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
