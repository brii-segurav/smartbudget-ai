import type { Transaction } from '../types';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
  t: any;
  transactions?: Transaction[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  handleDelete: (id?: number) => void;
  currencySymbol: string;
}

export default function TransactionList({
  t,
  transactions = [],
  loading,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  handleDelete,
  currencySymbol,
}: TransactionListProps) {
  // Garantiza que siempre sea un arreglo iterable
  const list = Array.isArray(transactions) ? transactions : [];

  const filtered = list.filter((tx) => {
    const matchesSearch = tx.description
      ? tx.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCategory =
      filterCategory === 'ALL' || tx.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="min-w-0 space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-base font-semibold text-slate-900">{t.historyTitle}</h2>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 sm:w-48"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-teal-700 sm:w-36"
          >
            <option value="ALL">{t.allCategories}</option>
            <option value="Comida">{t.catFood}</option>
            <option value="Servicios">{t.catServices}</option>
            <option value="Herramientas">{t.catTools}</option>
            <option value="Ingreso">{t.catIncome}</option>
            <option value="General">{t.catGeneral}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">{t.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          {t.noTransactions}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">{t.thDate}</th>
                <th className="py-3 px-4">{t.thDescription}</th>
                <th className="py-3 px-4">{t.thCategory}</th>
                <th className="py-3 px-4 text-right">{t.thAmount}</th>
                <th className="py-3 px-4 text-center rounded-r-lg">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {tx.date || '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{tx.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                      {tx.category}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                      tx.type === 'income' ? 'text-emerald-700' : 'text-orange-700'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {currencySymbol}
                    {Number(tx.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
                      className="rounded p-1 text-slate-400 transition-colors hover:text-rose-700"
                      title={t.delete}
                      aria-label={`${t.delete}: ${tx.description}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}