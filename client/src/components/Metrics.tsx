import { ArrowDownLeft, ArrowUpRight, WalletCards } from 'lucide-react';

interface MetricsProps {
  t: any;
  currencySymbol: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function Metrics({ t, currencySymbol, totalIncome, totalExpense, balance }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div>
          <p className="text-xs uppercase text-slate-500">{t.totalBalance}</p>
          <p className={`mt-1 text-2xl font-semibold ${balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
            {currencySymbol}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-800"><WalletCards size={19} aria-hidden="true" /></span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div>
          <p className="text-xs uppercase text-slate-500">{t.incomes}</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">+{currencySymbol}{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ArrowDownLeft size={19} aria-hidden="true" /></span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div>
          <p className="text-xs uppercase text-slate-500">{t.expenses}</p>
          <p className="mt-1 text-2xl font-semibold text-orange-700">-{currencySymbol}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange-50 text-orange-700"><ArrowUpRight size={19} aria-hidden="true" /></span>
      </div>
    </div>
  );
}