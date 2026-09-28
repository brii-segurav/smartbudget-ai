import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Transaction } from '../types';

interface FinanceChartsProps {
  t: any;
  transactions: Transaction[];
  currencySymbol: string;
  lang: 'es' | 'en';
}

const CHART_COLORS = ['#087e78', '#f28b62', '#5277a8', '#d2a842', '#8a6eaf', '#56a081'];

export default function FinanceCharts({ t, transactions, currencySymbol, lang }: FinanceChartsProps) {
  const { monthlyData, categoryData } = useMemo(() => {
    const today = new Date();
    const firstMonthIndex = today.getFullYear() * 12 + today.getMonth() - 5;
    const months = Array.from({ length: 6 }, (_, index) => {
      const absoluteMonth = firstMonthIndex + index;
      const year = Math.floor(absoluteMonth / 12);
      const month = absoluteMonth % 12;
      const date = new Date(year, month, 1, 12);
      return {
        key: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString(lang, { month: 'short' }),
        income: 0,
        expenses: 0,
      };
    });
    const monthByKey = new Map(months.map((month) => [month.key, month]));
    const expenses = new Map<string, number>();

    transactions.forEach((transaction) => {
      if (!transaction.date || !/^\d{4}-\d{2}/.test(transaction.date)) return;
      const month = monthByKey.get(transaction.date.slice(0, 7));
      const amount = Number(transaction.amount) || 0;
      if (month) {
        if (transaction.type === 'income') month.income += amount;
        else month.expenses += amount;
      }
      if (transaction.type === 'expense') {
        expenses.set(transaction.category, (expenses.get(transaction.category) ?? 0) + amount);
      }
    });

    return {
      monthlyData: months,
      categoryData: [...expenses.entries()]
        .map(([name, value]) => ({ name: t.categories[name] ?? name, value }))
        .sort((first, second) => second.value - first.value),
    };
  }, [lang, t.categories, transactions]);

  const formatCurrency = (value: number) => `${currencySymbol}${Number(value).toLocaleString(lang, { maximumFractionDigits: 0 })}`;
  const panelClass = 'min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-panel';

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4" aria-label={t.analysis}>
      <div className={panelClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t.analysis}</h2>
            <p className="mt-1 text-xs text-slate-500">{t.monthlyIncome} / {t.monthlyExpense}</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-teal-600" aria-hidden="true" />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={6}>
              <CartesianGrid stroke="#e8eeee" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#718184', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718184', fontSize: 10 }} tickFormatter={(value: number) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, borderColor: '#dce5e5', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name={t.monthlyIncome} fill="#087e78" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="expenses" name={t.monthlyExpense} fill="#f28b62" radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={panelClass}>
        <h2 className="text-base font-semibold text-slate-900">{t.expensesByCategory}</h2>
        {categoryData.length === 0 ? (
          <p className="flex h-64 items-center justify-center px-6 text-center text-sm text-slate-500">{t.noChartData}</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
                  {categoryData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, borderColor: '#dce5e5', fontSize: 12 }} />
                <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}