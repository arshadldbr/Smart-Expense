import React, { useState } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Globe,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { UserProfile, Category, CurrencyCode } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  profile: UserProfile;
  categories: Category[];
  isDark: boolean;
  onToggleTheme: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onAddCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => boolean;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  categories,
  isDark,
  onToggleTheme,
  onUpdateProfile,
  onAddCategory,
  onDeleteCategory,
  onExportAllData,
  onImportAllData,
  onResetData,
}) => {
  const [userName, setUserName] = useState(profile.name);
  const [userEmail, setUserEmail] = useState(profile.email || '');
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency || profile.defaultCurrency || 'PKR');
  const [profileSaved, setProfileSaved] = useState(false);

  // New Category State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Import file ref
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: userName.trim(),
      email: userEmail.trim(),
      defaultCurrency: currency,
      currency,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: newCatIcon,
      subcategories: [],
    });

    setNewCatName('');
    setShowAddCat(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportAllData(content);
        if (success) {
          setImportStatus('Backup restored successfully!');
        } else {
          setImportStatus('Failed to restore backup. Invalid JSON file format.');
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-view" className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span>Profile & Application Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage identity credentials, currency preferences, categories, and system backups
        </p>
      </div>

      {/* User Profile Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>User Profile & Currency</span>
        </h2>

        {profileSaved && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" /> Profile settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                FULL NAME
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                DEFAULT CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                APPEARANCE THEME
              </label>
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100"
              >
                <span className="font-medium">{isDark ? 'Dark Theme (Active)' : 'Light Theme (Active)'}</span>
                {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="save-profile-btn"
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Save Profile Settings
          </button>
        </form>
      </div>

      {/* Category Manager */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>Category Management</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize income and expense categorization buckets
            </p>
          </div>

          <button
            id="add-cat-btn"
            onClick={() => setShowAddCat(!showAddCat)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>

        {/* Add Category Form */}
        {showAddCat && (
          <form onSubmit={handleCreateCategory} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  CATEGORY NAME
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Freelance, Crypto, Pet Care"
                  className="w-full py-1.5 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  TYPE
                </label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="w-full py-1.5 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  COLOR
                </label>
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCat(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Save Category
              </button>
            </div>
          </form>
        )}

        {/* Existing Categories List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pt-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.color}20` }}
                >
                  <CategoryIcon iconName={c.icon} className="w-3.5 h-3.5" color={c.color} />
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">
                  {c.name}
                </span>
              </div>

              {!c.isDefault && (
                <button
                  onClick={() => onDeleteCategory(c.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                  title="Delete custom category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Backup, Restore & Reset */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Data Management & Backups
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your financial data is stored securely in your browser&apos;s local storage. You can export complete snapshots or restore from a previous backup anytime.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            id="export-backup-btn"
            onClick={onExportAllData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Complete JSON Backup</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore from JSON Backup</span>
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>

          <button
            id="reset-demo-btn"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Demo Sample Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
