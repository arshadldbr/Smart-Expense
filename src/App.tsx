import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from './services/storageService';
import {
  calculateMonthlySummary,
  generateSmartInsights,
} from './services/financialCalculations';
import {
  ViewTab,
  Transaction,
  MonthlyBudget,
  Category,
  SavingsGoal,
  CreditDebitRecord,
  Loan,
  UserProfile,
  CurrencyCode,
} from './types';

// Subcomponents
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetView } from './components/BudgetView';
import { SavingsView } from './components/SavingsView';
import { CreditDebitView } from './components/CreditDebitView';
import { LoansView } from './components/LoansView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface MainTrackerAppProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

function MainTrackerApp({ isDark, onToggleTheme }: MainTrackerAppProps) {
  const { user, logout } = useAuth();

  // Central application state backed by local storage
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storageService.getTransactions());
  const [budgets, setBudgets] = useState<Record<string, MonthlyBudget>>(() => storageService.getBudgets());
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => storageService.getSavingsGoals());
  const [creditDebitRecords, setCreditDebitRecords] = useState<CreditDebitRecord[]>(() => storageService.getCreditDebitRecords());
  const [loans, setLoans] = useState<Loan[]>(() => storageService.getLoans());

  // Reload user-scoped data whenever authenticated user changes
  useEffect(() => {
    if (user) {
      setProfile(storageService.getProfile());
      setCategories(storageService.getCategories());
      setTransactions(storageService.getTransactions());
      setBudgets(storageService.getBudgets());
      setSavingsGoals(storageService.getSavingsGoals());
      setCreditDebitRecords(storageService.getCreditDebitRecords());
      setLoans(storageService.getLoans());
    }
  }, [user]);

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  // Month navigation: default to newest transaction's month or current month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      const txs = storageService.getTransactions();
      if (Array.isArray(txs) && txs.length > 0 && txs[0] && txs[0].date) {
        return txs[0].date.substring(0, 7);
      }
    } catch {}
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal states
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const activeCurrency: CurrencyCode = profile?.currency || profile?.defaultCurrency || 'PKR';

  // Month switcher
  const handleMonthChange = (offset: number) => {
    try {
      const safeStr =
        selectedMonth && selectedMonth.includes('-')
          ? selectedMonth
          : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const [year, month] = safeStr.split('-').map(Number);
      const date = new Date(year, (month || 1) - 1 + offset, 1);
      const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(newMonthStr);
    } catch (e) {
      console.warn('Error changing month:', e);
    }
  };

  // Previous month string for MoM comparison
  const previousMonth = useMemo(() => {
    try {
      const safeStr =
        selectedMonth && selectedMonth.includes('-')
          ? selectedMonth
          : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const [year, month] = safeStr.split('-').map(Number);
      const date = new Date(year, (month || 1) - 2, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return '2026-08';
    }
  }, [selectedMonth]);

  // Current month's budget
  const currentBudget: MonthlyBudget = useMemo(() => {
    if (budgets && budgets[selectedMonth]) {
      return budgets[selectedMonth];
    }
    return {
      id: `budget_${selectedMonth || 'current'}`,
      month: selectedMonth || '2026-09',
      totalBudget: profile?.defaultMonthlyBudget || 100000,
      categoryBudgets: {
        cat_food: 20000,
        cat_transport: 10000,
        cat_bills: 15000,
        cat_shopping: 12000,
      },
      warningThresholds: {
        warn75: true,
        warn90: true,
        warn100: true,
      },
    };
  }, [budgets, selectedMonth, profile?.defaultMonthlyBudget]);

  const previousBudget: MonthlyBudget = useMemo(() => {
    if (budgets && budgets[previousMonth]) {
      return budgets[previousMonth];
    }
    return {
      id: `budget_${previousMonth || 'previous'}`,
      month: previousMonth || '2026-08',
      totalBudget: profile?.defaultMonthlyBudget || 100000,
      categoryBudgets: {},
      warningThresholds: {
        warn75: true,
        warn90: true,
        warn100: true,
      },
    };
  }, [budgets, previousMonth, profile?.defaultMonthlyBudget]);

  // Financial summaries
  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(
      transactions || [],
      currentBudget,
      categories || [],
      creditDebitRecords || [],
      loans || [],
      savingsGoals || [],
      selectedMonth || '2026-09'
    );
  }, [transactions, currentBudget, categories, creditDebitRecords, loans, savingsGoals, selectedMonth]);

  const previousSummary = useMemo(() => {
    return calculateMonthlySummary(
      transactions || [],
      previousBudget,
      categories || [],
      creditDebitRecords || [],
      loans || [],
      savingsGoals || [],
      previousMonth || '2026-08'
    );
  }, [transactions, previousBudget, categories, creditDebitRecords, loans, savingsGoals, previousMonth]);

  // Insights
  const insights = useMemo(() => {
    return generateSmartInsights(monthlySummary, previousSummary, savingsGoals || [], activeCurrency);
  }, [monthlySummary, previousSummary, savingsGoals, activeCurrency]);

  // Transaction handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    let updatedList: Transaction[];
    const now = new Date().toISOString();
    if (editingTransaction) {
      const updatedTx: Transaction = {
        ...editingTransaction,
        ...txData,
        updatedAt: now,
      };
      updatedList = transactions.map((t) => (t.id === editingTransaction.id ? updatedTx : t));
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [newTx, ...transactions];
    }

    setTransactions(updatedList);
    storageService.saveTransactions(updatedList);
    setIsAddTxModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const updatedList = transactions.filter((t) => t.id !== id);
    setTransactions(updatedList);
    storageService.saveTransactions(updatedList);
  };

  // Budget handler
  const handleUpdateBudget = (updates: Partial<MonthlyBudget>) => {
    const updated: MonthlyBudget = {
      ...currentBudget,
      ...updates,
    };
    const newBudgets: Record<string, MonthlyBudget> = {
      ...budgets,
      [selectedMonth]: updated,
    };
    setBudgets(newBudgets);
    storageService.saveBudgets(newBudgets);
  };

  // Savings Goal handlers
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'history' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `sg_${Date.now()}`,
      createdAt: new Date().toISOString(),
      history:
        goalData.currentAmount > 0
          ? [
              {
                id: `sgh_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: goalData.currentAmount,
                type: 'deposit',
                notes: 'Initial allocation',
              },
            ]
          : [],
    };
    const updated = [...savingsGoals, newGoal];
    setSavingsGoals(updated);
    storageService.saveSavingsGoals(updated);
  };

  const handleRecordSavingsActivity = (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    notes?: string
  ) => {
    const updated = savingsGoals.map((g) => {
      if (g.id !== goalId) return g;
      const newCurrent = type === 'deposit' ? g.currentAmount + amount : Math.max(0, g.currentAmount - amount);
      const newHistoryItem = {
        id: `sgh_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount,
        type,
        notes,
      };
      return {
        ...g,
        currentAmount: newCurrent,
        history: [newHistoryItem, ...(g.history || [])],
      };
    });
    setSavingsGoals(updated);
    storageService.saveSavingsGoals(updated);
  };

  const handleDeleteSavingsGoal = (goalId: string) => {
    const updated = savingsGoals.filter((g) => g.id !== goalId);
    setSavingsGoals(updated);
    storageService.saveSavingsGoals(updated);
  };

  // Credit / Debit handlers
  const handleAddCreditDebitRecord = (
    recData: Omit<CreditDebitRecord, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'createdAt'>
  ) => {
    const newRec: CreditDebitRecord = {
      ...recData,
      id: `cd_${Date.now()}`,
      paidAmount: 0,
      remainingAmount: recData.amount,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newRec, ...creditDebitRecords];
    setCreditDebitRecords(updated);
    storageService.saveCreditDebitRecords(updated);
  };

  const handleRecordCreditDebitPayment = (id: string, paymentAmount: number) => {
    const updated = creditDebitRecords.map((r) => {
      if (r.id !== id) return r;
      const newPaid = Math.min(r.amount, r.paidAmount + paymentAmount);
      const newRemaining = Math.max(0, r.amount - newPaid);
      const newStatus: CreditDebitRecord['status'] =
        newRemaining === 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : 'pending';
      return {
        ...r,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
      };
    });
    setCreditDebitRecords(updated);
    storageService.saveCreditDebitRecords(updated);
  };

  const handleDeleteCreditDebitRecord = (id: string) => {
    const updated = creditDebitRecords.filter((r) => r.id !== id);
    setCreditDebitRecords(updated);
    storageService.saveCreditDebitRecords(updated);
  };

  // Loan handlers
  const handleAddLoan = (
    loanData: Omit<Loan, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'repayments'>
  ) => {
    const newLoan: Loan = {
      ...loanData,
      id: `loan_${Date.now()}`,
      paidAmount: 0,
      remainingAmount: loanData.principalAmount,
      status: 'active',
      repayments: [],
    };
    const updated = [newLoan, ...loans];
    setLoans(updated);
    storageService.saveLoans(updated);
  };

  const handleRecordLoanRepayment = (loanId: string, amount: number, notes?: string) => {
    const updated = loans.map((l) => {
      if (l.id !== loanId) return l;
      const newPaid = Math.min(l.principalAmount, l.paidAmount + amount);
      const newRemaining = Math.max(0, l.principalAmount - newPaid);
      const newStatus = newRemaining === 0 ? ('paid' as const) : ('active' as const);
      const repaymentRecord = {
        id: `repay_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount,
        notes,
      };
      return {
        ...l,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        repayments: [repaymentRecord, ...(l.repayments || [])],
      };
    });
    setLoans(updated);
    storageService.saveLoans(updated);
  };

  const handleDeleteLoan = (loanId: string) => {
    const updated = loans.filter((l) => l.id !== loanId);
    setLoans(updated);
    storageService.saveLoans(updated);
  };

  // Category and Settings handlers
  const handleAddCategory = (catData: Omit<Category, 'id' | 'isDefault'>) => {
    const newCat: Category = {
      ...catData,
      id: `custom_cat_${Date.now()}`,
      isDefault: false,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    storageService.saveCategories(updated);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = categories.filter((c) => c.id !== categoryId);
    setCategories(updated);
    storageService.saveCategories(updated);
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    storageService.saveProfile(updated);
  };

  const handleExportAllData = () => {
    const jsonStr = storageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_expense_tracker_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportAllData = (jsonData: string): boolean => {
    const success = storageService.importAllData(jsonData);
    if (success) {
      setProfile(storageService.getProfile());
      setCategories(storageService.getCategories());
      setTransactions(storageService.getTransactions());
      setBudgets(storageService.getBudgets());
      setSavingsGoals(storageService.getSavingsGoals());
      setCreditDebitRecords(storageService.getCreditDebitRecords());
      setLoans(storageService.getLoans());
      return true;
    }
    return false;
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset all financial data back to the demo showcase set? Any custom entries will be restored to default.'
      )
    ) {
      storageService.resetToSampleData();
      setProfile(storageService.getProfile());
      setCategories(storageService.getCategories());
      setTransactions(storageService.getTransactions());
      setBudgets(storageService.getBudgets());
      setSavingsGoals(storageService.getSavingsGoals());
      setCreditDebitRecords(storageService.getCreditDebitRecords());
      setLoans(storageService.getLoans());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddTxModalOpen(true);
        }}
        profile={profile}
        selectedMonth={selectedMonth}
        onToggleTheme={onToggleTheme}
        isDark={isDark}
        onSelectCurrency={(cur) => handleUpdateProfile({ defaultCurrency: cur, currency: cur })}
        userEmail={user.email}
        onLogout={logout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pb-10">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={monthlySummary}
            previousSummary={previousSummary}
            selectedMonth={selectedMonth}
            onChangeMonth={handleMonthChange}
            currency={activeCurrency}
            insights={insights}
            recentTransactions={transactions.slice(0, 8)}
            categories={categories}
            profile={profile}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            onSelectTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddTxModalOpen(true);
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            categories={categories}
            currency={activeCurrency}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            budget={currentBudget}
            summary={monthlySummary}
            categories={categories}
            currency={activeCurrency}
            selectedMonth={selectedMonth}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsView
            savingsGoals={savingsGoals}
            currency={activeCurrency}
            onAddGoal={handleAddSavingsGoal}
            onRecordActivity={handleRecordSavingsActivity}
            onDeleteGoal={handleDeleteSavingsGoal}
          />
        )}

        {activeTab === 'credit_debit' && (
          <CreditDebitView
            records={creditDebitRecords}
            currency={activeCurrency}
            onAddRecord={handleAddCreditDebitRecord}
            onRecordPayment={handleRecordCreditDebitPayment}
            onDeleteRecord={handleDeleteCreditDebitRecord}
          />
        )}

        {activeTab === 'loans' && (
          <LoansView
            loans={loans}
            currency={activeCurrency}
            onAddLoan={handleAddLoan}
            onRecordRepayment={handleRecordLoanRepayment}
            onDeleteLoan={handleDeleteLoan}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            transactions={transactions}
            categories={categories}
            currency={activeCurrency}
            selectedMonth={selectedMonth}
            onChangeMonth={handleMonthChange}
            onSelectTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddTxModalOpen(true);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            categories={categories}
            budget={currentBudget}
            creditDebitRecords={creditDebitRecords}
            loans={loans}
            currency={activeCurrency}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            categories={categories}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            onUpdateProfile={handleUpdateProfile}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onExportAllData={handleExportAllData}
            onImportAllData={handleImportAllData}
            onResetData={handleResetData}
            authEmail={user.email}
            userId={user.uid}
            onLogout={logout}
          />
        )}
      </main>

      {/* Application Footer */}
      <footer
        id="app-branding-footer"
        className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md mt-auto py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6 transition-colors shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Smart Expense Tracker
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span>
              Developed by <strong className="font-semibold text-slate-900 dark:text-white">A.K.A Tech</strong>, A company by <strong className="font-semibold text-slate-900 dark:text-white">Arshad Khan Aastik</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Whatsapp:</span>
            <a
              href="https://wa.me/923149891182"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/70 transition-colors"
            >
              +923149891182
            </a>
          </div>
        </div>
      </footer>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => {
          setIsAddTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        currency={activeCurrency}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('smart-expense-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      try {
        localStorage.setItem('smart-expense-theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  if (loading) {
    return (
      <div className={isDark ? 'min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center' : 'min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center'}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return <MainTrackerApp isDark={isDark} onToggleTheme={toggleTheme} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
