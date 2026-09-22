import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Wallet,
  Landmark,
  ArrowLeftRight,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Plus,
  Receipt,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  MonthlyFinancialSummary,
  Transaction,
  Category,
  CurrencyCode,
  SmartInsight,
  UserProfile,
  ViewTab,
} from '../types';
import { formatMoney } from '../constants/currencies';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  summary: MonthlyFinancialSummary;
  previousSummary: MonthlyFinancialSummary | null;
  selectedMonth: string;
  onChangeMonth: (offset: number) => void;
  currency: CurrencyCode;
  insights: SmartInsight[];
  recentTransactions: Transaction[];
  categories: Category[];
  profile: UserProfile;
  onOpenAddModal: (prefillType?: any) => void;
  onSelectTransaction: (tx: Transaction) => void;
  setActiveTab: (tab: ViewTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  previousSummary,
  selectedMonth,
  onChangeMonth,
  currency,
  insights,
  recentTransactions,
  categories,
  profile,
  onOpenAddModal,
  onSelectTransaction,
  setActiveTab,
}) => {
  const [showComparison, setShowComparison] = useState(false);

  // Parse display month name
  const [year, month] = selectedMonth.split('-');
  const monthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Category donut data
  const pieData = summary.categorySummaries
    .filter((c) => c.spent > 0)
    .map((c) => ({
      name: c.categoryName,
      value: c.spent,
      color: c.color,
    }));

  // Month-to-month comparison differences
  const expenseDiff = previousSummary
    ? summary.totalExpenses - previousSummary.totalExpenses
    : 0;
  const incomeDiff = previousSummary
    ? summary.totalIncome - previousSummary.totalIncome
    : 0;

  return (
    <div id="dashboard-view" className="space-y-6 pb-12">
      {/* Dashboard Top Header & Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Financial Dashboard</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {currency}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time balance, budgets, and automated spending analytics
          </p>
        </div>

        {/* Month selector controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            id="prev-month-btn"
            onClick={() => onChangeMonth(-1)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
            {formattedMonth}
          </span>
          <button
            id="next-month-btn"
            onClick={() => onChangeMonth(1)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Buttons Bar (PRD Section 42) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          id="quick-action-expense"
          onClick={() => onOpenAddModal('expense')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
        <button
          id="quick-action-income"
          onClick={() => onOpenAddModal('income')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Income</span>
        </button>
        <button
          id="quick-action-savings"
          onClick={() => setActiveTab('savings')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 transition-all"
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Savings Goals</span>
        </button>
        <button
          id="quick-action-credit"
          onClick={() => setActiveTab('credit_debit')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 active:scale-95 transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Credit & Debit</span>
        </button>
        <button
          id="quick-action-loan"
          onClick={() => setActiveTab('loans')}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/60 active:scale-95 transition-all"
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Loans</span>
        </button>
      </div>

      {/* Summary Cards Grid (PRD Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Income Card */}
        <div
          id="card-total-income"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Income</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {formatMoney(summary.totalIncome, currency)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Inflows this month
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          id="card-total-expenses"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Expenses</span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {formatMoney(summary.totalExpenses, currency)}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
              Outflows this month
            </span>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div
          id="card-remaining-budget"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining Budget</span>
            <div className={`p-1.5 rounded-lg ${summary.isExceeded ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400'}`}>
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-lg font-bold truncate ${summary.isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {formatMoney(summary.remainingBudget, currency)}
            </div>
            <span className={`text-[10px] font-medium ${summary.isExceeded ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>
              {summary.budgetLimit > 0 ? `${100 - summary.budgetUsedPercentage}% left` : 'No budget set'}
            </span>
          </div>
        </div>

        {/* Savings Card */}
        <div
          id="card-savings"
          onClick={() => setActiveTab('savings')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Savings</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {formatMoney(summary.netSavings, currency)}
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
              Saved this month
            </span>
          </div>
        </div>

        {/* Credit Card (Owed by user) */}
        <div
          id="card-credit"
          onClick={() => setActiveTab('credit_debit')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Credit (We Owe)</span>
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 truncate">
              {formatMoney(summary.totalCredit, currency)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Payables balance
            </span>
          </div>
        </div>

        {/* Debit Card (Owed to user) */}
        <div
          id="card-debit"
          onClick={() => setActiveTab('credit_debit')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Debit (To Receive)</span>
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400 truncate">
              {formatMoney(summary.totalDebit, currency)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Receivables balance
            </span>
          </div>
        </div>

        {/* Outstanding Loans Card */}
        <div
          id="card-loans"
          onClick={() => setActiveTab('loans')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-purple-300 dark:hover:border-purple-800 transition-colors col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loans Balance</span>
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate">
              {formatMoney(summary.outstandingLoans, currency)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Active principal
            </span>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar & Warning Banner (PRD Section 7) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Budget Utilization
              </h2>
              {summary.isExceeded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Exceeded!
                </span>
              )}
              {summary.isWarn90 && !summary.isExceeded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Critical (90%+)
                </span>
              )}
              {summary.isWarn75 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400">
                  75% Consumed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatMoney(summary.totalExpenses, currency)} spent of {formatMoney(summary.budgetLimit, currency)} total limit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {summary.budgetUsedPercentage}% Used
            </span>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Manage Budget →
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              summary.isExceeded
                ? 'bg-rose-500'
                : summary.budgetUsedPercentage >= 90
                ? 'bg-amber-500'
                : summary.budgetUsedPercentage >= 75
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, summary.budgetUsedPercentage)}%` }}
          />
        </div>
      </div>

      {/* Smart Financial Insights (PRD Section 27) */}
      {insights.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Smart Financial Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {insight.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts (PRD Section 18) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Income vs Expenses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily cash movements in {formattedMonth}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">Income</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">Expense</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {summary.dailySpending.some((d) => d.expense > 0 || d.income > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.dailySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v > 999 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip
                    formatter={(val: any) => formatMoney(Number(val) || 0, currency)}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>No financial activity recorded for {formattedMonth}.</p>
                <button
                  onClick={() => onOpenAddModal('expense')}
                  className="mt-2 text-emerald-600 font-semibold hover:underline"
                >
                  + Add First Transaction
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Category Donut Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Category Spending Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of your monthly expenses
            </p>
          </div>

          <div className="h-52 w-full my-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatMoney(Number(val) || 0, currency)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">
                No expense data available for this month.
              </div>
            )}
          </div>

          {/* Top 3 categories mini-legend */}
          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            {summary.categorySummaries.slice(0, 3).map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate">{cat.categoryName}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatMoney(cat.spent, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month-over-Month Comparison Card (PRD Section 46) */}
      {previousSummary && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Month-over-Month Performance
              </h2>
            </div>
            <button
              id="toggle-comparison-btn"
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {showComparison ? 'Hide Comparison' : 'View Comparison'}
            </button>
          </div>

          {showComparison && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500">Expenses Comparison</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {formatMoney(summary.totalExpenses, currency)}
                  </span>
                  <span className={`text-xs font-semibold ${expenseDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {expenseDiff > 0 ? `+${formatMoney(expenseDiff, currency)}` : `${formatMoney(expenseDiff, currency)}`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  vs {formatMoney(previousSummary.totalExpenses, currency)} prev month
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500">Income Comparison</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {formatMoney(summary.totalIncome, currency)}
                  </span>
                  <span className={`text-xs font-semibold ${incomeDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {incomeDiff >= 0 ? `+${formatMoney(incomeDiff, currency)}` : `${formatMoney(incomeDiff, currency)}`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  vs {formatMoney(previousSummary.totalIncome, currency)} prev month
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-500">Net Month Surplus</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {formatMoney(summary.totalIncome - summary.totalExpenses, currency)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Income minus expenses for this period
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions Preview Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest financial activity recorded
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View All History →
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.slice(0, 5).map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense' || tx.type === 'loan_repayment';
              return (
                <div
                  key={tx.id}
                  id={`recent-tx-${tx.id}`}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat?.color || '#64748b'}20` }}
                    >
                      <CategoryIcon
                        iconName={cat?.icon || 'HelpCircle'}
                        className="w-5 h-5"
                        color={cat?.color || '#64748b'}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="truncate max-w-[180px] sm:max-w-xs">{tx.description}</span>
                        {tx.receiptUrl && (
                          <span title="Has receipt attachment">
                            <Receipt className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{cat?.name || 'General'}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                    </span>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {tx.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            <p>No transactions yet for this period.</p>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="mt-2 text-emerald-600 font-semibold hover:underline"
            >
              + Start tracking your first expense
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Bottom Branding Badge */}
      <div
        id="dashboard-branding-credit"
        className="mt-4 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors shadow-xs"
      >
        <span>
          Developed by{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            A.K.A Tech
          </strong>
          , A company by{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">
            Arshad Khan Aastik
          </strong>
        </span>
        <span className="mx-1.5 text-slate-400">•</span>
        <span>
          Whatsapp:{' '}
          <a
            href="https://wa.me/923149891182"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            +923149891182
          </a>
        </span>
      </div>
    </div>
  );
};
