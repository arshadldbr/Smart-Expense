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
  Layers,
  ShieldCheck,
  Zap,
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
import { ReceiptModal } from './ReceiptModal';

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
  const [previewReceiptTx, setPreviewReceiptTx] = useState<Transaction | null>(null);

  // Safe fallback structures
  const safeSummary: MonthlyFinancialSummary = {
    month: summary?.month || selectedMonth,
    totalIncome: Number(summary?.totalIncome) || 0,
    totalExpenses: Number(summary?.totalExpenses) || 0,
    budgetLimit: Number(summary?.budgetLimit) || 0,
    remainingBudget: Number(summary?.remainingBudget) || 0,
    budgetUsedPercentage: Number(summary?.budgetUsedPercentage) || 0,
    netSavings: Number(summary?.netSavings) || 0,
    totalCredit: Number(summary?.totalCredit) || 0,
    totalDebit: Number(summary?.totalDebit) || 0,
    outstandingLoans: Number(summary?.outstandingLoans) || 0,
    isWarn75: Boolean(summary?.isWarn75),
    isWarn90: Boolean(summary?.isWarn90),
    isWarn100: Boolean(summary?.isWarn100),
    isExceeded: Boolean(summary?.isExceeded),
    categorySummaries: Array.isArray(summary?.categorySummaries) ? summary.categorySummaries : [],
    dailySpending: Array.isArray(summary?.dailySpending) ? summary.dailySpending : [],
  };

  const safeTransactions = Array.isArray(recentTransactions) ? recentTransactions : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeInsights = Array.isArray(insights) ? insights : [];

  // Parse formatted month string
  const safeMonth =
    selectedMonth && typeof selectedMonth === 'string' && selectedMonth.includes('-')
      ? selectedMonth
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = safeMonth.split('-');
  const monthDate = new Date(parseInt(year, 10) || new Date().getFullYear(), (parseInt(month, 10) || 1) - 1, 1);
  const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Pie chart spending breakdown
  const pieData = safeSummary.categorySummaries
    .filter((c) => c && c.spent > 0)
    .map((c) => ({
      name: c.categoryName || 'Other',
      value: Number(c.spent) || 0,
      color: c.color || '#94a3b8',
    }));

  // Top category summaries
  const safeCategorySummaries = [...safeSummary.categorySummaries].sort((a, b) => b.spent - a.spent);

  // Month-over-month calculation
  const expenseDiff = previousSummary ? safeSummary.totalExpenses - previousSummary.totalExpenses : 0;
  const incomeDiff = previousSummary ? safeSummary.totalIncome - previousSummary.totalIncome : 0;

  // Net Cash Flow calculation
  const netCashFlow = safeSummary.totalIncome - safeSummary.totalExpenses;
  const savingsRate = safeSummary.totalIncome > 0
    ? Math.max(0, Math.round((netCashFlow / safeSummary.totalIncome) * 100))
    : 0;

  return (
    <div id="dashboard-view" className="space-y-6 pb-24 md:pb-12 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Month Navigator & Period Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Executive Command Deck</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Ledger
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time balance, budgets, and automated spending analytics
          </p>
        </div>

        {/* 3D Month Selector Bar */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto track-recessed p-1">
          <button
            id="prev-month-btn"
            onClick={() => onChangeMonth(-1)}
            className="btn-3d btn-3d-secondary w-8 h-8 p-0"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-xs font-black text-slate-800 dark:text-slate-200 min-w-[140px] text-center">
            {formattedMonth}
          </span>
          <button
            id="next-month-btn"
            onClick={() => onChangeMonth(1)}
            className="btn-3d btn-3d-secondary w-8 h-8 p-0"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* EXECUTIVE 3D FINANCIAL COMMAND DECK (Replaces Star Centerpiece completely) */}
      <section
        id="executive-command-deck"
        className="executive-command-deck p-6 sm:p-8 text-white"
      >
        <div className="executive-glow-orb -top-24 -left-24 w-80 h-80 bg-emerald-500/15" />
        <div className="executive-glow-orb -bottom-24 -right-24 w-80 h-80 bg-teal-400/15" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Net Cash Flow & Savings Rate */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Net Monthly Cash Flow</span>
            </div>

            <div>
              <div className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">
                <span className={netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {netCashFlow >= 0 ? '+' : ''}{formatMoney(netCashFlow, currency)}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>Monthly Savings Rate:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-extrabold text-xs">
                  {savingsRate}%
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{formattedMonth}</span>
              </div>
            </div>

            {/* Income vs Outflow Mini-Bar */}
            <div className="pt-2 max-w-lg space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                <span>Inflows: {formatMoney(safeSummary.totalIncome, currency)}</span>
                <span>Outflows: {formatMoney(safeSummary.totalExpenses, currency)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900/80 overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700 shadow-sm"
                  style={{
                    width: `${
                      safeSummary.totalIncome + safeSummary.totalExpenses > 0
                        ? Math.min(100, Math.round((safeSummary.totalIncome / (safeSummary.totalIncome + safeSummary.totalExpenses)) * 100))
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Tactile 3D Fast-Action Launchpad */}
          <div className="lg:col-span-5 bg-slate-950/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Tactical Actions</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="hero-quick-expense-btn"
                onClick={() => onOpenAddModal('expense')}
                className="btn-3d btn-3d-rose py-2.5 px-3 text-xs gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Expense</span>
              </button>

              <button
                id="hero-quick-income-btn"
                onClick={() => onOpenAddModal('income')}
                className="btn-3d btn-3d-emerald py-2.5 px-3 text-xs gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Income</span>
              </button>

              <button
                id="hero-quick-savings-btn"
                onClick={() => setActiveTab('savings')}
                className="btn-3d btn-3d-indigo py-2.5 px-3 text-xs gap-1.5"
              >
                <PiggyBank className="w-4 h-4" />
                <span>Vault & Goals</span>
              </button>

              <button
                id="hero-quick-credit-btn"
                onClick={() => setActiveTab('credit_debit')}
                className="btn-3d btn-3d-amber py-2.5 px-3 text-xs gap-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Credit / Debit</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Primary Financial Metric Cards (3D Dimensional Panels) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Inflow Card */}
        <div
          id="card-total-income"
          className="panel-3d panel-3d-hover p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Inflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatMoney(safeSummary.totalIncome, currency)}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Active earnings recorded
            </p>
          </div>
        </div>

        {/* Total Outflow Card */}
        <div
          id="card-total-expenses"
          className="panel-3d panel-3d-hover p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Outflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatMoney(safeSummary.totalExpenses, currency)}
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
              Monthly expenditures
            </p>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div
          id="card-remaining-budget"
          className="panel-3d panel-3d-hover p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Remaining Budget
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              safeSummary.isExceeded
                ? 'bg-rose-500/10 text-rose-600'
                : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-black truncate ${
              safeSummary.isExceeded ? 'text-rose-600' : 'text-slate-900 dark:text-white'
            }`}>
              {formatMoney(safeSummary.remainingBudget, currency)}
            </div>
            <p className={`text-[11px] font-semibold mt-1 ${
              safeSummary.isExceeded ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {safeSummary.budgetLimit > 0
                ? `${Math.max(0, 100 - safeSummary.budgetUsedPercentage)}% remaining of cap`
                : 'No monthly limit set'}
            </p>
          </div>
        </div>

      </div>

      {/* Secondary Accounts & Liabilities Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Savings Vault Card */}
        <div
          id="card-savings"
          onClick={() => setActiveTab('savings')}
          className="panel-3d panel-3d-hover p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Savings Vault</span>
            </div>
            <span className="text-[10px] text-indigo-500 font-bold">View Goals →</span>
          </div>
          <div className="mt-2 text-lg font-black text-slate-900 dark:text-white truncate">
            {formatMoney(safeSummary.netSavings, currency)}
          </div>
        </div>

        {/* Credit Card (We Owe) */}
        <div
          id="card-credit"
          onClick={() => setActiveTab('credit_debit')}
          className="panel-3d panel-3d-hover p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Credit (We Owe)</span>
            </div>
            <span className="text-[10px] text-amber-500 font-bold">Ledger →</span>
          </div>
          <div className="mt-2 text-lg font-black text-amber-600 dark:text-amber-400 truncate">
            {formatMoney(safeSummary.totalCredit, currency)}
          </div>
        </div>

        {/* Outstanding Loans */}
        <div
          id="card-loans"
          onClick={() => setActiveTab('loans')}
          className="panel-3d panel-3d-hover p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Loans</span>
            </div>
            <span className="text-[10px] text-purple-500 font-bold">EMIs →</span>
          </div>
          <div className="mt-2 text-lg font-black text-purple-600 dark:text-purple-400 truncate">
            {formatMoney(safeSummary.outstandingLoans, currency)}
          </div>
        </div>

      </div>

      {/* Budget Utilization Monitor */}
      <div className="panel-3d p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Monthly Budget Gauge
              </h2>
              {safeSummary.isExceeded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Budget Exceeded
                </span>
              )}
              {safeSummary.isWarn90 && !safeSummary.isExceeded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Critical Threshold (90%+)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatMoney(safeSummary.totalExpenses, currency)} spent of {formatMoney(safeSummary.budgetLimit, currency)} planned limit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {safeSummary.budgetUsedPercentage}% Consumed
            </span>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Adjust Budgets →
            </button>
          </div>
        </div>

        {/* 3D Track Progress Bar */}
        <div className="w-full h-3 rounded-full track-recessed overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-sm ${
              safeSummary.isExceeded
                ? 'bg-rose-500'
                : safeSummary.budgetUsedPercentage >= 90
                ? 'bg-amber-500'
                : safeSummary.budgetUsedPercentage >= 75
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, safeSummary.budgetUsedPercentage)}%` }}
          />
        </div>
      </div>

      {/* Smart Financial Insights */}
      {safeInsights.length > 0 && (
        <div className="panel-3d p-6 space-y-3 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Automated Financial Intelligence
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {safeInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {insight.title}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Cash Flow Bar Chart */}
        <div className="lg:col-span-2 panel-3d p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Daily Inflow & Outflow Timeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cash movements in {formattedMonth}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                <span>Inflows</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
                <span>Outflows</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {safeSummary.dailySpending && safeSummary.dailySpending.some((d) => d.expense > 0 || d.income > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeSummary.dailySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v > 999 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip
                    formatter={(val: any) => formatMoney(Number(val) || 0, currency)}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
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
                  className="mt-2 text-emerald-600 font-bold hover:underline"
                >
                  + Record First Entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Category Donut Breakdown */}
        <div className="panel-3d p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
              Category Spending Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of current month expenses
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">
                No expense data available for this month.
              </div>
            )}
          </div>

          {/* Top categories legend */}
          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            {safeCategorySummaries.slice(0, 3).map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{cat.categoryName}</span>
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatMoney(cat.spent, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Month-over-Month Comparison */}
      {previousSummary && (
        <div className="panel-3d p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Month-over-Month Performance Differential
              </h2>
            </div>
            <button
              id="toggle-comparison-btn"
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {showComparison ? 'Hide Comparison' : 'View Comparison'}
            </button>
          </div>

          {showComparison && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Expenses Comparison</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatMoney(safeSummary.totalExpenses, currency)}
                  </span>
                  <span className={`text-xs font-bold ${expenseDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {expenseDiff > 0 ? `+${formatMoney(expenseDiff, currency)}` : `${formatMoney(expenseDiff, currency)}`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  vs {formatMoney(previousSummary?.totalExpenses || 0, currency)} prev month
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Income Comparison</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatMoney(safeSummary.totalIncome, currency)}
                  </span>
                  <span className={`text-xs font-bold ${incomeDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {incomeDiff >= 0 ? `+${formatMoney(incomeDiff, currency)}` : `${formatMoney(incomeDiff, currency)}`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  vs {formatMoney(previousSummary?.totalIncome || 0, currency)} prev month
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Net Surplus / Cashflow</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatMoney(netCashFlow, currency)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Current net surplus after all spending
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Ledger History with 3D Receipt Badge */}
      <div className="panel-3d p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Recent Transactions Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest financial activity recorded
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Full Ledger History →
          </button>
        </div>

        {safeTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {safeTransactions.slice(0, 5).map((tx) => {
              const cat = safeCategories.find((c) => c && c.id === tx.categoryId);
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
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewReceiptTx(tx);
                            }}
                            className="btn-3d btn-3d-secondary px-2 py-0.5 text-[10px] gap-1 text-emerald-600 dark:text-emerald-400"
                            title="Click to zoom receipt & download PNG"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
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
                      className={`text-xs font-extrabold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                    </span>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">
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
              className="mt-2 text-emerald-600 font-bold hover:underline"
            >
              + Record Your First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Bottom Executive Signature */}
      <div
        id="dashboard-branding-credit"
        className="mt-6 p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 shadow-xs"
      >
        <span>
          Precision Engineering by{' '}
          <strong className="font-bold text-slate-800 dark:text-slate-200">
            A.K.A Tech
          </strong>{' '}
          (Arshad Khan Aastik)
        </span>
        <span className="mx-2 text-slate-400">•</span>
        <span>
          WhatsApp Support:{' '}
          <a
            href="https://wa.me/923149891182"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            +923149891182
          </a>
        </span>
      </div>

      {/* High-Resolution Zoom, Pan & PNG Download Modal */}
      {previewReceiptTx && (
        <ReceiptModal
          isOpen={Boolean(previewReceiptTx)}
          onClose={() => setPreviewReceiptTx(null)}
          imageUrl={previewReceiptTx.receiptUrl || null}
          title={previewReceiptTx.description}
          merchant={previewReceiptTx.merchant}
          amount={formatMoney(previewReceiptTx.amount, currency)}
          date={previewReceiptTx.date}
        />
      )}
    </div>
  );
};
