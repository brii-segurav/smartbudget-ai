import type { FormEvent, ChangeEvent } from 'react';
import { Sparkles } from 'lucide-react';

interface TransactionFormProps {
  t: any;
  currencySymbol: string;
  description: string;
  amount: string;
  setAmount: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  type: 'income' | 'expense';
  setType: (val: 'income' | 'expense') => void;
  txDate: string;
  setTxDate: (val: string) => void;
  autoSuggested: boolean;
  handleDescriptionChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent) => void;
}

export default function TransactionForm({
  t,
  currencySymbol,
  description,
  amount,
  setAmount,
  category,
  setCategory,
  type,
  setType,
  txDate,
  setTxDate,
  autoSuggested,
  handleDescriptionChange,
  handleSubmit,
}: TransactionFormProps) {
  return (
    <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-slate-900">{t.newTransaction}</h2>
        {autoSuggested && (
          <span className="inline-flex items-center gap-1 rounded border border-teal-700/20 bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-800">
            <Sparkles size={12} aria-hidden="true" />{t.autoCategoryNotice}
          </span>
        )}
      </div>
      
      <div>
        <label className="mb-1 block text-xs text-slate-600">{t.description}</label>
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Ej. Uber Eats, Walmart, Salario..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-600">{t.amount} ({currencySymbol})</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-600">{t.dateLabel}</label>
        <input
          type="date"
          value={txDate}
          onChange={e => setTxDate(e.target.value)}
          className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-600">{t.category}</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
          >
            <option value="General">{t.categories.General}</option>
            <option value="Comida">{t.categories.Comida}</option>
            <option value="Servicios">{t.categories.Servicios}</option>
            <option value="Herramientas">{t.categories.Herramientas}</option>
            <option value="Ingreso">{t.categories.Ingreso}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-600">{t.type}</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'income' | 'expense')}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
          >
            <option value="expense">{t.expense}</option>
            <option value="income">{t.income}</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
      >
        {t.save}
      </button>
    </form>
  );
}