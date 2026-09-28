import React, { useState, useEffect, useCallback } from 'react';
import type { Transaction, BudgetStatus, AIInsights, UserProfile, UserProfileUpdate } from '../types';
import { translations, currencies } from '../constants';
import { API_BASE_URL, authorizationHeader } from '../api';
import { ArrowLeftRight, ChartNoAxesCombined, House, Plus, UserRound, WalletCards } from 'lucide-react';

import AuthScreen from '../components/AuthScreen';
import Header from '../components/Header';
import Metrics from '../components/Metrics';
import AIInsightsWidget from '../components/AIInsightsWidget';
import BudgetPanel from '../components/BudgetPanel';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import ProfileSettings from '../components/ProfileSettings';
import FinanceCharts from '../components/FinanceCharts';
import ChatbotWidget from '../components/ChatbotWidget';

type DashboardPage = 'overview' | 'analysis' | 'budgets' | 'transactions' | 'profile';

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activePage, setActivePage] = useState<DashboardPage>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [budgetError, setBudgetError] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('USD');
  const [customSymbolInput, setCustomSymbolInput] = useState('');
  const [aiData, setAiData] = useState<AIInsights | null>(null);
  const [aiError, setAiError] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [autoSuggested, setAutoSuggested] = useState(false);

  const t = translations[lang];

  const acceptSession = (accessToken: string, profile: UserProfile) => {
    localStorage.setItem('smartbudget-access-token', accessToken);
    setToken(accessToken);
    setUser(profile);
    setLang(profile.language);
    setSelectedCurrencyCode(profile.currency_code);
    setCustomSymbolInput(profile.custom_symbol ?? '');
    const currency = currencies.find((item) => item.code === profile.currency_code);
    setCurrencySymbol(profile.currency_code === 'CUSTOM' ? profile.custom_symbol ?? '' : currency?.symbol ?? '$');
    setSessionLoading(false);
  };

  const clearSession = () => {
    localStorage.removeItem('smartbudget-access-token');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setSessionLoading(false);
    setActivePage('overview');
  };

  const handleProfileSave = async (profile: UserProfileUpdate) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authorizationHeader(token) },
        body: JSON.stringify(profile),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      acceptSession(token, await response.json() as UserProfile);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/transactions`, { headers: authorizationHeader(token) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchBudgets = useCallback(async (month: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/budgets?month=${encodeURIComponent(month)}`, {
        headers: authorizationHeader(token),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBudgets(Array.isArray(data) ? data : []);
      setBudgetError('');
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setBudgets([]);
      setBudgetError(t.budgetLoadError);
    } finally {
      setLoadingBudgets(false);
    }
  }, [t.budgetLoadError, token]);

  const fetchAIInsights = async () => {
    if (!token) return;
    try {
      setLoadingAI(true);
      const response = await fetch(`${API_BASE_URL}/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authorizationHeader(token) },
        body: JSON.stringify({ lang }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : t.aiError);
      setAiData(data);
      setAiError('');
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiError(error instanceof Error ? error.message : t.aiError);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get('reset_token');
    if (resetToken) {
      localStorage.removeItem('smartbudget-access-token');
      setSessionLoading(false);
      return;
    }
    const storedToken = localStorage.getItem('smartbudget-access-token');
    if (!storedToken) {
      setSessionLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/auth/me`, { headers: authorizationHeader(storedToken) })
      .then((response) => {
        if (!response.ok) throw new Error('Session expired');
        return response.json() as Promise<UserProfile>;
      })
      .then((profile) => {
        setToken(storedToken);
        setUser(profile);
        setLang(profile.language);
        setSelectedCurrencyCode(profile.currency_code);
        setCustomSymbolInput(profile.custom_symbol ?? '');
        const currency = currencies.find((item) => item.code === profile.currency_code);
        setCurrencySymbol(profile.currency_code === 'CUSTOM' ? profile.custom_symbol ?? '' : currency?.symbol ?? '$');
      })
      .catch(() => localStorage.removeItem('smartbudget-access-token'))
      .finally(() => setSessionLoading(false));
  }, []);

  useEffect(() => {
    if (token) fetchTransactions();
  }, [token, fetchTransactions]);

  useEffect(() => {
    if (token) fetchBudgets(budgetMonth);
  }, [budgetMonth, fetchBudgets, token]);

  const handleDescriptionChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDescription(value);
    if (value.length > 3 && token) {
      try {
        const response = await fetch(`${API_BASE_URL}/autocategorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authorizationHeader(token) },
          body: JSON.stringify({ description: value }),
        });
        if (response.ok) {
          const data = await response.json();
          setCategory(data.suggested_category);
          setType(data.suggested_type);
          setAutoSuggested(true);
        }
      } catch (error) {
        console.error('Error autocategorizing:', error);
      }
    } else {
      setAutoSuggested(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description || !amount || !token) return;
    const newTransaction: Transaction = {
      description,
      amount: parseFloat(amount),
      category,
      type,
      date: txDate,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authorizationHeader(token) },
        body: JSON.stringify(newTransaction),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setDescription('');
      setAmount('');
      setCategory('General');
      setType('expense');
      setTxDate(new Date().toISOString().split('T')[0]);
      setAutoSuggested(false);
      void fetchTransactions();
      void fetchBudgets(budgetMonth);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: authorizationHeader(token),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      void fetchTransactions();
      void fetchBudgets(budgetMonth);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleCurrencySelectChange = (valueOrEvent: string | React.ChangeEvent<HTMLSelectElement>) => {
    const value = typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent.target.value;
    setSelectedCurrencyCode(value);
    if (value !== 'CUSTOM') {
      const currency = currencies.find((item) => item.code === value);
      if (currency) setCurrencySymbol(currency.symbol);
    }
    if (user) {
      void handleProfileSave({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        language: user.language,
        currency_code: value,
        custom_symbol: value === 'CUSTOM' ? customSymbolInput : null,
      });
    }
  };

  const handleCustomSymbolChange = (symbol: string) => {
    setCustomSymbolInput(symbol);
    setCurrencySymbol(symbol);
  };

  const handleCustomSymbolCommit = () => {
    if (!user || selectedCurrencyCode !== 'CUSTOM') return;
    void handleProfileSave({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      language: user.language,
      currency_code: 'CUSTOM',
      custom_symbol: customSymbolInput,
    });
  };

  const handleLanguageChange = (nextLanguage: 'es' | 'en') => {
    setLang(nextLanguage);
    if (!user) return;
    void handleProfileSave({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      language: nextLanguage,
      currency_code: selectedCurrencyCode,
      custom_symbol: selectedCurrencyCode === 'CUSTOM' ? customSymbolInput : null,
    });
  };

  const handleBudgetSave = async (budgetCategory: string, monthlyLimit: number) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authorizationHeader(token) },
        body: JSON.stringify({ category: budgetCategory, monthly_limit: monthlyLimit }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await fetchBudgets(budgetMonth);
      return true;
    } catch (error) {
      console.error('Error saving budget:', error);
      setBudgetError(t.budgetSaveError);
      return false;
    }
  };

  const handleBudgetDelete = async (budgetCategory: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/${encodeURIComponent(budgetCategory)}`, {
        method: 'DELETE',
        headers: authorizationHeader(token),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await fetchBudgets(budgetMonth);
    } catch (error) {
      console.error('Error deleting budget:', error);
      setBudgetError(t.budgetDeleteError);
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalIncome = safeTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const totalExpense = safeTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  if (sessionLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-dark-900 text-gray-300">{t.sessionLoading}</main>;
  }
  if (!token || !user) return <AuthScreen onAuthenticated={acceptSession} />;

  const welcomeLabel = user.gender === 'male' ? t.welcomeMale : user.gender === 'female' ? t.welcomeFemale : t.welcomeNeutral;
  const navItems: { id: DashboardPage; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: t.overview, Icon: House },
    { id: 'analysis', label: t.analysis, Icon: ChartNoAxesCombined },
    { id: 'budgets', label: t.budgetsNav, Icon: WalletCards },
    { id: 'transactions', label: t.transactionsNav, Icon: ArrowLeftRight },
    { id: 'profile', label: t.profileNav, Icon: UserRound },
  ];
  const budgetPanel = (
    <BudgetPanel t={t} budgets={budgets} loading={loadingBudgets} error={budgetError} month={budgetMonth} onMonthChange={setBudgetMonth} currencySymbol={currencySymbol} onSave={handleBudgetSave} onDelete={handleBudgetDelete} />
  );
  const transactionList = (
    <TransactionList t={t} transactions={safeTransactions} loading={loading} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterCategory={filterCategory} setFilterCategory={setFilterCategory} handleDelete={handleDelete} currencySymbol={currencySymbol} />
  );

  return (
    <div className="min-h-screen bg-dark-900 font-sans text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col bg-[#173d40] px-4 py-6 text-white lg:flex">
          <div className="flex items-center gap-3 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-teal-200"><WalletCards size={20} aria-hidden="true" /></span>
            <span className="text-sm font-semibold tracking-wide">SmartBudget<span className="text-teal-300"> AI</span></span>
          </div>
          <nav className="mt-9 space-y-1" aria-label={t.overview}>
            {navItems.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-current={activePage === id ? 'page' : undefined} onClick={() => setActivePage(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${activePage === id ? 'bg-white text-[#173d40] font-semibold shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} aria-hidden="true" />{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/15 pt-4">
            <p className="truncate px-2 text-xs text-white/70">{user.email}</p>
            <button type="button" onClick={clearSession} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white">{t.logout}</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <Header lang={lang} setLang={handleLanguageChange} selectedCurrencyCode={selectedCurrencyCode} handleCurrencyChange={handleCurrencySelectChange} customSymbolInput={customSymbolInput} handleCustomSymbolChange={handleCustomSymbolChange} handleCustomSymbolCommit={handleCustomSymbolCommit} profileLabel={t.profile} logoutLabel={t.logout} onProfile={() => setActivePage('profile')} onLogout={clearSession} t={t} />
          </header>

          <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{new Date().toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">{welcomeLabel}, {user.first_name}</h1>
              </div>
              {(activePage === 'overview' || activePage === 'transactions') && (
                <button type="button" onClick={() => setActivePage('transactions')} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800">
                  <Plus size={17} aria-hidden="true" />{t.addTransaction}
                </button>
              )}
            </div>

            {activePage === 'overview' && (
              <div className="space-y-5">
                <Metrics t={t} balance={balance} totalIncome={totalIncome} totalExpense={totalExpense} currencySymbol={currencySymbol} />
                <FinanceCharts t={t} transactions={safeTransactions} currencySymbol={currencySymbol} lang={lang} />
                <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">{budgetPanel}{transactionList}</div>
              </div>
            )}
            {activePage === 'analysis' && (
              <div className="space-y-5">
                <FinanceCharts t={t} transactions={safeTransactions} currencySymbol={currencySymbol} lang={lang} />
                <AIInsightsWidget t={t} aiData={aiData} loadingAI={loadingAI} fetchAIInsights={fetchAIInsights} error={aiError} />
              </div>
            )}
            {activePage === 'budgets' && budgetPanel}
            {activePage === 'transactions' && (
              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[340px_minmax(0,1fr)]">
                <TransactionForm t={t} description={description} handleDescriptionChange={handleDescriptionChange} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} type={type} setType={setType} txDate={txDate} setTxDate={setTxDate} handleSubmit={handleSubmit} autoSuggested={autoSuggested} currencySymbol={currencySymbol} />
                {transactionList}
              </div>
            )}
            {activePage === 'profile' && <ProfileSettings key={user.id} t={t} user={user} onSave={handleProfileSave} onClose={() => setActivePage('overview')} />}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden" aria-label={t.overview}>
            {navItems.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-current={activePage === id ? 'page' : undefined} onClick={() => setActivePage(id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] ${activePage === id ? 'text-teal-800' : 'text-slate-500'}`}>
                <Icon size={18} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      <ChatbotWidget token={token} lang={lang} t={t} />
    </div>
  );
}