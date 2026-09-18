import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Trash2,
  Calendar,
  Clock,
  Check,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  PaymentMethod,
  Category,
  CurrencyCode,
} from '../types';
import { suggestCategory, learnCategorizationRule } from '../services/categorizationEngine';
import { CategoryIcon } from './CategoryIcon';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Transaction>) => void;
  categories: Category[];
  editingTransaction?: Transaction | null;
  currency: CurrencyCode;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Easypaisa',
  'JazzCash',
  'Bank',
  'Other',
];

const TRANSACTION_TYPES: { type: TransactionType; label: string; color: string }[] = [
  { type: 'expense', label: 'Expense', color: 'bg-rose-500' },
  { type: 'income', label: 'Income', color: 'bg-emerald-500' },
  { type: 'savings', label: 'Savings', color: 'bg-indigo-500' },
  { type: 'credit', label: 'Credit', color: 'bg-amber-500' },
  { type: 'debit', label: 'Debit', color: 'bg-cyan-500' },
  { type: 'loan_repayment', label: 'Loan Repay', color: 'bg-purple-500' },
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  categories,
  editingTransaction,
  currency,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategoryId, setSubcategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Smart suggestion state
  const [suggestedCat, setSuggestedCat] = useState<{
    categoryId: string;
    categoryName: string;
    subcategory?: string;
    confidence: 'high' | 'medium' | 'low';
    matchedKeyword?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setSubcategoryId(editingTransaction.subcategoryId || '');
      setDescription(editingTransaction.description);
      setMerchant(editingTransaction.merchant || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time);
      setNotes(editingTransaction.notes || '');
      setReceiptUrl(editingTransaction.receiptUrl || '');
    } else {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      setType('expense');
      setAmount('');
      const defaultExpCat = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultExpCat ? defaultExpCat.id : '');
      setSubcategoryId('');
      setDescription('');
      setMerchant('');
      setPaymentMethod('Cash');
      setDate(todayStr);
      setTime(`${hours}:${minutes}`);
      setNotes('');
      setReceiptUrl('');
    }
    setErrorMsg('');
    setSuggestedCat(null);
  }, [isOpen, editingTransaction, categories]);

  // Update categories available based on transaction type
  const availableCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'income';
    return c.type === 'expense';
  });

  // Selected category object
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  // Run Smart Categorization Engine on typing description/merchant
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (!text || text.length < 2) {
      setSuggestedCat(null);
      return;
    }
    const match = suggestCategory(text, merchant, categories);
    if (match && match.categoryId !== categoryId) {
      setSuggestedCat(match);
    } else {
      setSuggestedCat(null);
    }
  };

  const applySuggestedCategory = () => {
    if (suggestedCat) {
      setCategoryId(suggestedCat.categoryId);
      if (suggestedCat.subcategory) {
        setSubcategoryId(suggestedCat.subcategory);
      }
      setSuggestedCat(null);
    }
  };

  // Receipt image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Receipt image size exceeds 3MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a category.');
      return;
    }

    if (!date) {
      setErrorMsg('Please specify a date.');
      return;
    }

    // Learn rule if user typed a description
    if (description) {
      learnCategorizationRule(description, categoryId, subcategoryId || undefined);
    }

    const txPayload = {
      type,
      amount: Math.round(numAmount * 100) / 100,
      currency,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      description: description.trim() || selectedCategoryObj?.name || 'Transaction',
      merchant: merchant.trim() || undefined,
      paymentMethod,
      date,
      time: time || '12:00',
      notes: notes.trim() || undefined,
      receiptUrl: receiptUrl || undefined,
    };

    if (editingTransaction && onUpdate) {
      onUpdate(editingTransaction.id, txPayload);
    } else {
      onSave(txPayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  const currencySymbol = SUPPORTED_CURRENCIES[currency]?.symbol || '₨';

  return (
    <div
      id="add-transaction-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="add-transaction-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record financial activity with instant categorization
            </p>
          </div>
          <button
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Transaction Type Segmented Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              TRANSACTION TYPE
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {TRANSACTION_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  id={`type-btn-${t.type}`}
                  onClick={() => {
                    setType(t.type);
                    // auto pick suitable category
                    const suitable = categories.find((c) =>
                      t.type === 'income' ? c.type === 'income' : c.type === 'expense'
                    );
                    if (suitable) setCategoryId(suitable.id);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center transition-all ${
                    type === t.type
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Big Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              AMOUNT ({currency})
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-xl">
                {currencySymbol}
              </div>
              <input
                type="number"
                step="any"
                id="transaction-amount-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus={!editingTransaction}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-3.5 pl-12 pr-4 text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Description & Smart Categorization Suggestion */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              DESCRIPTION / WHAT WAS THIS FOR?
            </label>
            <input
              type="text"
              id="transaction-description-input"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g. Petrol for car, Vegetables restock, Electricity bill..."
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />

            {/* Smart Categorization Chip */}
            {suggestedCat && (
              <div
                id="smart-suggestion-chip"
                className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Suggested: <strong>{suggestedCat.categoryName}</strong>
                    {suggestedCat.subcategory ? ` (${suggestedCat.subcategory})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  id="accept-suggestion-btn"
                  onClick={applySuggestedCategory}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-95 transition-all text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              CATEGORY
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
              {availableCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`category-select-${cat.id}`}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setSubcategoryId('');
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-1 rounded-md ${
                        isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      <CategoryIcon
                        iconName={cat.icon}
                        className="w-3.5 h-3.5"
                        color={isSelected ? '#ffffff' : cat.color}
                      />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory (if available) */}
          {selectedCategoryObj && selectedCategoryObj.subcategories && selectedCategoryObj.subcategories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                SUBCATEGORY (OPTIONAL)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategoryObj.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategoryId(subcategoryId === sub ? '' : sub)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                      subcategoryId === sub
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date and Time Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                DATE
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="transaction-date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                TIME
              </label>
              <div className="relative">
                <input
                  type="time"
                  id="transaction-time-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 px-3 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method and Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                PAYMENT METHOD
              </label>
              <select
                id="transaction-payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                MERCHANT / PAYEE (OPTIONAL)
              </label>
              <input
                type="text"
                id="transaction-merchant-input"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Carrefour, Shell, Monal"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Receipt Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              RECEIPT / BILL ATTACHMENT (OPTIONAL)
            </label>
            {receiptUrl ? (
              <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={receiptUrl}
                  alt="Receipt"
                  className="h-28 w-auto object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  id="remove-receipt-btn"
                  onClick={() => setReceiptUrl('')}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition-colors"
                  title="Remove Receipt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  id="upload-receipt-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Attach Receipt Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              NOTES (OPTIONAL)
            </label>
            <input
              type="text"
              id="transaction-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or references..."
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="cancel-add-btn"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-transaction-btn"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95 transition-all"
            >
              {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
