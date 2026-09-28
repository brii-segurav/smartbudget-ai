import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { BudgetStatus } from '../types';

interface BudgetPanelProps {
  t: any;
  budgets: BudgetStatus[];
  loading: boolean;
  error: string;
  month: string;
  onMonthChange: (month: string) => void;
  currencySymbol: string;
  onSave: (category: string, monthlyLimit: number) => Promise<boolean>;
  onDelete: (category: string) => Promise<void>;
}

export default function BudgetPanel({
  t,
  budgets,
  loading,
  error,
  month,
  onMonthChange,
  currencySymbol,
  onSave,
  onDelete,
}: BudgetPanelProps) {
  const [category, setCategory] = useState('Comida');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const limit = Number(monthlyLimit);
    if (!Number.isFinite(limit) || limit <= 0) return;

    setSaving(true);
    const saved = await onSave(category, limit);
    setSaving(false);
    if (saved) setMonthlyLimit('');
  };

  const handleDelete = async (budgetCategory: string) => {
    setDeletingCategory(budgetCategory);
    await onDelete(budgetCategory);
    setDeletingCategory('');
  };

  return (
    <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-base font-semibold text-slate-900">{t.budgetsTitle}</h2>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          {t.month}
          <input
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block text-xs text-slate-600">
          <span className="block mb-1">{t.budgetCategory}</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
          >
            {Object.entries(t.categories)
              .filter(([key]) => key !== 'Ingreso')
              .map(([key, label]) => (
                <option key={key} value={key}>{label as string}</option>
              ))}
          </select>
        </label>
        <label className="block text-xs text-slate-600">
          <span className="block mb-1">{t.limitLabel} ({currencySymbol})</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={monthlyLimit}
            onChange={(event) => setMonthlyLimit(event.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? t.loading : t.saveBudget}
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-500">{t.loading}</p>
      ) : budgets.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">{t.noBudgets}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {budgets.map((budget) => {
            const percentage = Math.max(0, budget.percentage);
            const progressColor = percentage >= 100
              ? 'bg-rose-400'
              : percentage >= 80
                ? 'bg-amber-300'
                : 'bg-emerald-400';
            const statusColor = percentage >= 100
              ? 'text-rose-400'
              : percentage >= 80
                ? 'text-amber-300'
                : 'text-emerald-400';

            return (
                <div key={budget.category} className="grid grid-cols-1 items-center gap-3 py-4 sm:grid-cols-[minmax(100px,1fr)_2fr_auto]">
                <div className="font-medium text-slate-900">
                  {t.categories[budget.category] ?? budget.category}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap justify-between gap-x-3 text-xs">
                      <span className="text-slate-600">
                      {t.spent}: {currencySymbol}{budget.spent.toFixed(2)} / {currencySymbol}{budget.monthly_limit.toFixed(2)}
                    </span>
                    <span className={statusColor}>
                      {percentage >= 100
                        ? `${(percentage - 100).toFixed(0)}% ${t.overBudget}`
                        : `${currencySymbol}${Math.max(0, budget.monthly_limit - budget.spent).toFixed(2)} ${t.available}`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${t.budgetsTitle}: ${t.categories[budget.category] ?? budget.category}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(percentage, 100)}
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div className={`h-full ${progressColor}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                  </div>
                </div>
                <button
                  type="button"
                  title={t.deleteBudget}
                  aria-label={`${t.deleteBudget}: ${budget.category}`}
                  disabled={deletingCategory === budget.category}
                  onClick={() => void handleDelete(budget.category)}
                  className="justify-self-end rounded p-2 text-slate-400 transition-colors hover:text-rose-700 disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}