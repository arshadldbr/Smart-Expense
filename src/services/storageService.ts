import {
  Transaction,
  Category,
  MonthlyBudget,
  SavingsGoal,
  CreditDebitRecord,
  Loan,
  UserProfile,
} from '../types';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';
import {
  INITIAL_USER_PROFILE,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_CREDIT_DEBIT,
  INITIAL_LOANS,
  INITIAL_TRANSACTIONS,
} from './seedData';

const KEYS = {
  PROFILE: 'set_profile_v1',
  TRANSACTIONS: 'set_transactions_v1',
  CATEGORIES: 'set_categories_v1',
  BUDGETS: 'set_budgets_v1',
  SAVINGS: 'set_savings_v1',
  CREDIT_DEBIT: 'set_credit_debit_v1',
  LOANS: 'set_loans_v1',
};

class StorageService {
  // --- Profile ---
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  }

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }

  // --- Transactions ---
  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const list = this.getTransactions();
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newTx, ...list];
    this.saveTransactions(updated);
    return newTx;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const list = this.getTransactions();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updatedTx: Transaction = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updatedTx;
    this.saveTransactions(list);
    return updatedTx;
  }

  deleteTransaction(id: string): boolean {
    const list = this.getTransactions();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length !== list.length) {
      this.saveTransactions(filtered);
      return true;
    }
    return false;
  }

  // --- Categories ---
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  saveCategories(categories: Category[]): void {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  }

  addCategory(category: Omit<Category, 'id' | 'isDefault'>): Category {
    const list = this.getCategories();
    const newCat: Category = {
      ...category,
      id: `cat_custom_${Date.now()}`,
      isDefault: false,
    };
    const updated = [...list, newCat];
    this.saveCategories(updated);
    return newCat;
  }

  deleteCategory(categoryId: string, reassignToCategoryId?: string): boolean {
    const list = this.getCategories();
    const cat = list.find((c) => c.id === categoryId);
    if (!cat || cat.isDefault) return false;

    // If transactions use this category, reassign them
    if (reassignToCategoryId) {
      const transactions = this.getTransactions();
      const updatedTx = transactions.map((t) =>
        t.categoryId === categoryId ? { ...t, categoryId: reassignToCategoryId } : t
      );
      this.saveTransactions(updatedTx);
    }

    const filtered = list.filter((c) => c.id !== categoryId);
    this.saveCategories(filtered);
    return true;
  }

  // --- Budgets ---
  getBudgets(): Record<string, MonthlyBudget> {
    try {
      const data = localStorage.getItem(KEYS.BUDGETS);
      return data ? JSON.parse(data) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  }

  saveBudgets(budgets: Record<string, MonthlyBudget>): void {
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  }

  getBudgetForMonth(monthStr: string, defaultAmount: number = 100000): MonthlyBudget {
    const budgets = this.getBudgets();
    if (budgets[monthStr]) {
      return budgets[monthStr];
    }
    // Auto-create initial default budget for month if not existing
    const newBudget: MonthlyBudget = {
      id: `budget_${monthStr.replace('-', '_')}`,
      month: monthStr,
      totalBudget: defaultAmount,
      categoryBudgets: {},
      warningThresholds: { warn75: true, warn90: true, warn100: true },
    };
    budgets[monthStr] = newBudget;
    this.saveBudgets(budgets);
    return newBudget;
  }

  updateBudgetForMonth(monthStr: string, updates: Partial<MonthlyBudget>): MonthlyBudget {
    const budgets = this.getBudgets();
    const current = budgets[monthStr] || {
      id: `budget_${monthStr.replace('-', '_')}`,
      month: monthStr,
      totalBudget: 100000,
      categoryBudgets: {},
      warningThresholds: { warn75: true, warn90: true, warn100: true },
    };
    const updated: MonthlyBudget = {
      ...current,
      ...updates,
    };
    budgets[monthStr] = updated;
    this.saveBudgets(budgets);
    return updated;
  }

  // --- Savings Goals ---
  getSavingsGoals(): SavingsGoal[] {
    try {
      const data = localStorage.getItem(KEYS.SAVINGS);
      return data ? JSON.parse(data) : INITIAL_SAVINGS_GOALS;
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  }

  saveSavingsGoals(goals: SavingsGoal[]): void {
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(goals));
  }

  addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'history' | 'createdAt'>): SavingsGoal {
    const list = this.getSavingsGoals();
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      history: [
        {
          id: `sh_${Date.now()}`,
          amount: goal.currentAmount,
          type: 'deposit',
          date: new Date().toISOString().split('T')[0],
          notes: 'Initial balance',
        },
      ],
    };
    const updated = [...list, newGoal];
    this.saveSavingsGoals(updated);
    return newGoal;
  }

  recordSavingsActivity(
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    notes?: string
  ): SavingsGoal | null {
    const list = this.getSavingsGoals();
    const goal = list.find((g) => g.id === goalId);
    if (!goal) return null;

    const newCurrent =
      type === 'deposit'
        ? goal.currentAmount + amount
        : Math.max(0, goal.currentAmount - amount);

    const updatedGoal: SavingsGoal = {
      ...goal,
      currentAmount: newCurrent,
      history: [
        {
          id: `sh_${Date.now()}`,
          amount,
          type,
          date: new Date().toISOString().split('T')[0],
          notes,
        },
        ...goal.history,
      ],
    };

    const updatedList = list.map((g) => (g.id === goalId ? updatedGoal : g));
    this.saveSavingsGoals(updatedList);
    return updatedGoal;
  }

  deleteSavingsGoal(goalId: string): boolean {
    const list = this.getSavingsGoals();
    const filtered = list.filter((g) => g.id !== goalId);
    if (filtered.length !== list.length) {
      this.saveSavingsGoals(filtered);
      return true;
    }
    return false;
  }

  // --- Credit & Debit ---
  getCreditDebitRecords(): CreditDebitRecord[] {
    try {
      const data = localStorage.getItem(KEYS.CREDIT_DEBIT);
      return data ? JSON.parse(data) : INITIAL_CREDIT_DEBIT;
    } catch {
      return INITIAL_CREDIT_DEBIT;
    }
  }

  saveCreditDebitRecords(records: CreditDebitRecord[]): void {
    localStorage.setItem(KEYS.CREDIT_DEBIT, JSON.stringify(records));
  }

  addCreditDebitRecord(
    record: Omit<CreditDebitRecord, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'createdAt'>
  ): CreditDebitRecord {
    const list = this.getCreditDebitRecords();
    const newRecord: CreditDebitRecord = {
      ...record,
      id: `cd_${Date.now()}`,
      paidAmount: 0,
      remainingAmount: record.amount,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newRecord, ...list];
    this.saveCreditDebitRecords(updated);
    return newRecord;
  }

  recordCreditDebitPayment(id: string, paymentAmount: number): CreditDebitRecord | null {
    const list = this.getCreditDebitRecords();
    const rec = list.find((r) => r.id === id);
    if (!rec) return null;

    const newPaid = Math.min(rec.amount, rec.paidAmount + paymentAmount);
    const newRemaining = Math.max(0, rec.amount - newPaid);
    const isTodayPastDue = new Date(rec.dueDate) < new Date();

    let newStatus = rec.status;
    if (newRemaining === 0) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = isTodayPastDue ? 'overdue' : 'partially_paid';
    } else if (isTodayPastDue) {
      newStatus = 'overdue';
    }

    const updatedRec: CreditDebitRecord = {
      ...rec,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newStatus,
    };

    const updatedList = list.map((r) => (r.id === id ? updatedRec : r));
    this.saveCreditDebitRecords(updatedList);
    return updatedRec;
  }

  deleteCreditDebitRecord(id: string): boolean {
    const list = this.getCreditDebitRecords();
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      this.saveCreditDebitRecords(filtered);
      return true;
    }
    return false;
  }

  // --- Loans ---
  getLoans(): Loan[] {
    try {
      const data = localStorage.getItem(KEYS.LOANS);
      return data ? JSON.parse(data) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  }

  saveLoans(loans: Loan[]): void {
    localStorage.setItem(KEYS.LOANS, JSON.stringify(loans));
  }

  addLoan(loan: Omit<Loan, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'repayments'>): Loan {
    const list = this.getLoans();
    const newLoan: Loan = {
      ...loan,
      id: `loan_${Date.now()}`,
      paidAmount: 0,
      remainingAmount: loan.principalAmount,
      status: 'active',
      repayments: [],
    };
    const updated = [newLoan, ...list];
    this.saveLoans(updated);
    return newLoan;
  }

  recordLoanRepayment(loanId: string, amount: number, notes?: string): Loan | null {
    const list = this.getLoans();
    const loan = list.find((l) => l.id === loanId);
    if (!loan) return null;

    const newPaid = Math.min(loan.principalAmount, loan.paidAmount + amount);
    const newRemaining = Math.max(0, loan.principalAmount - newPaid);
    const newStatus = newRemaining === 0 ? 'paid' : 'active';

    const updatedLoan: Loan = {
      ...loan,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      status: newStatus,
      repayments: [
        {
          id: `lr_${Date.now()}`,
          amount,
          date: new Date().toISOString().split('T')[0],
          notes,
        },
        ...loan.repayments,
      ],
    };

    const updatedList = list.map((l) => (l.id === loanId ? updatedLoan : l));
    this.saveLoans(updatedList);
    return updatedLoan;
  }

  deleteLoan(loanId: string): boolean {
    const list = this.getLoans();
    const filtered = list.filter((l) => l.id !== loanId);
    if (filtered.length !== list.length) {
      this.saveLoans(filtered);
      return true;
    }
    return false;
  }

  // --- Backup / Restore / Reset ---
  exportAllData(): string {
    const payload = {
      profile: this.getProfile(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      savings: this.getSavingsGoals(),
      creditDebit: this.getCreditDebitRecords(),
      loans: this.getLoans(),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(payload, null, 2);
  }

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (Array.isArray(data.categories)) this.saveCategories(data.categories);
      if (data.budgets) this.saveBudgets(data.budgets);
      if (Array.isArray(data.savings)) this.saveSavingsGoals(data.savings);
      if (Array.isArray(data.creditDebit)) this.saveCreditDebitRecords(data.creditDebit);
      if (Array.isArray(data.loans)) this.saveLoans(data.loans);
      return true;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }

  exportFullBackup(): string {
    return this.exportAllData();
  }

  importFullBackup(jsonString: string): boolean {
    return this.importAllData(jsonString);
  }

  resetToSeedData(): void {
    this.resetToSampleData();
  }

  getTheme(): 'light' | 'dark' {
    const profile = this.getProfile();
    return profile.theme === 'dark' ? 'dark' : 'light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    const profile = this.getProfile();
    profile.theme = theme;
    this.saveProfile(profile);
  }

  resetToSampleData(): void {
    this.saveProfile(INITIAL_USER_PROFILE);
    this.saveTransactions(INITIAL_TRANSACTIONS);
    this.saveCategories(DEFAULT_CATEGORIES);
    this.saveBudgets(INITIAL_BUDGETS);
    this.saveSavingsGoals(INITIAL_SAVINGS_GOALS);
    this.saveCreditDebitRecords(INITIAL_CREDIT_DEBIT);
    this.saveLoans(INITIAL_LOANS);
  }

  clearAllData(): void {
    const blankProfile: UserProfile = {
      ...INITIAL_USER_PROFILE,
      onboarded: false,
    };
    this.saveProfile(blankProfile);
    this.saveTransactions([]);
    this.saveCategories(DEFAULT_CATEGORIES);
    this.saveBudgets({});
    this.saveSavingsGoals([]);
    this.saveCreditDebitRecords([]);
    this.saveLoans([]);
  }
}

export const storageService = new StorageService();
