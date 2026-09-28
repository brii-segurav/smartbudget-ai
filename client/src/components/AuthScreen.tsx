import { useState } from 'react';
import type { FormEvent } from 'react';
import { currencies, translations } from '../constants';
import { API_BASE_URL } from '../api';
import type { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthenticated: (token: string, user: UserProfile) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset_token') ?? '');
  const [mode, setMode] = useState<AuthMode>(resetToken ? 'reset' : 'login');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [customSymbol, setCustomSymbol] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const t = translations[language];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'forgot') {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error(t.resetError);
        setMessage(t.resetLinkSent);
        return;
      }

      if (mode === 'reset') {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, password }),
        });
        if (!response.ok) throw new Error(t.resetError);
        window.history.replaceState({}, '', window.location.pathname);
        setMode('login');
        setPassword('');
        setMessage(t.passwordUpdated);
        return;
      }

      const body = mode === 'register'
        ? {
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            password,
            gender,
            language,
            currency_code: currencyCode,
            custom_symbol: currencyCode === 'CUSTOM' ? customSymbol : null,
          }
        : { email, password };
      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : t.authError);
      }
      onAuthenticated(data.access_token, data.user as UserProfile);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.authError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-mustard-500';
  const labelClass = 'block text-xs text-gray-400 space-y-1.5';

  return (
    <main className="min-h-screen bg-dark-900 text-gray-100 p-4 sm:p-8 flex items-center justify-center text-left">
      <section className="w-full max-w-xl border border-dark-700 bg-dark-800 p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-widest text-mustard-500 mb-2">SmartBudget AI</p>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login' ? t.loginTitle : mode === 'register' ? t.registerTitle : mode === 'forgot' ? t.forgotPassword : t.resetPassword}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{t.subtitle}</p>
          </div>
          <select
            aria-label={t.language ?? 'Language'}
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
            className="bg-dark-900 border border-dark-700 rounded-lg px-2 py-1.5 text-xs text-gray-200"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={labelClass}>
                  {t.firstName}
                  <input className={inputClass} autoComplete="given-name" required maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                </label>
                <label className={labelClass}>
                  {t.lastName}
                  <input className={inputClass} autoComplete="family-name" required maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} />
                </label>
              </div>
              <label className={labelClass}>
                {t.phone}
                <input className={inputClass} type="tel" autoComplete="tel" minLength={7} maxLength={30} required value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={labelClass}>
                  {t.gender}
                  <select className={inputClass} value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                    <option value="neutral">{t.neutral}</option>
                  </select>
                </label>
                <label className={labelClass}>
                  {t.currencyLabel}
                  <select className={inputClass} value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}>
                    {currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name}</option>)}
                  </select>
                </label>
              </div>
              {currencyCode === 'CUSTOM' && (
                <label className={labelClass}>
                  {t.customSymbol}
                  <input className={inputClass} required maxLength={8} value={customSymbol} onChange={(event) => setCustomSymbol(event.target.value)} />
                </label>
              )}
            </>
          )}

          <label className={labelClass}>
            {t.email}
            <input className={inputClass} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          {mode !== 'forgot' && (
            <label className={labelClass}>
              {mode === 'reset' ? t.newPassword : t.password}
              <input className={inputClass} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          )}

          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-mustard-500 hover:bg-mustard-600 disabled:opacity-50 text-dark-900 font-bold py-3 rounded-lg transition-colors"
          >
            {submitting ? t.loading : mode === 'login' ? t.login : mode === 'register' ? t.register : mode === 'forgot' ? t.sendResetLink : t.resetPassword}
          </button>
        </form>

        {mode === 'login' && (
          <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="mt-4 w-full text-sm text-gray-400 hover:text-mustard-500 transition-colors">
            {t.forgotPassword}
          </button>
        )}
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}
          className="mt-4 w-full text-sm text-gray-300 hover:text-mustard-500 transition-colors"
        >
          {mode === 'login' ? t.switchToRegister : t.switchToLogin}
        </button>
      </section>
    </main>
  );
}