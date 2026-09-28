import { useState } from 'react';
import type { FormEvent } from 'react';
import { currencies } from '../constants';
import type { UserProfile, UserProfileUpdate } from '../types';

interface ProfileSettingsProps {
  t: any;
  user: UserProfile;
  onSave: (profile: UserProfileUpdate) => Promise<boolean>;
  onClose: () => void;
}

export default function ProfileSettings({ t, user, onSave, onClose }: ProfileSettingsProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [gender, setGender] = useState<UserProfile['gender']>(user.gender);
  const [language, setLanguage] = useState<UserProfile['language']>(user.language);
  const [currencyCode, setCurrencyCode] = useState(user.currency_code);
  const [customSymbol, setCustomSymbol] = useState(user.custom_symbol ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const success = await onSave({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      gender,
      language,
      currency_code: currencyCode,
      custom_symbol: currencyCode === 'CUSTOM' ? customSymbol : null,
    });
    setSaving(false);
    if (success) setSaved(true);
    else setError(t.profileError);
  };

  const inputClass = 'w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-mustard-500';
  const labelClass = 'block text-xs text-gray-400 space-y-1.5';

  return (
    <section className="bg-dark-800 p-6 rounded-xl border border-dark-700 space-y-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{t.profile}</h2>
        <button type="button" onClick={onClose} aria-label={t.close ?? 'Close'} className="text-gray-400 hover:text-white text-2xl leading-none px-2">×</button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelClass}>{t.firstName}<input className={inputClass} autoComplete="given-name" required maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
        <label className={labelClass}>{t.lastName}<input className={inputClass} autoComplete="family-name" required maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
        <label className={`${labelClass} sm:col-span-2`}>{t.email}<input className={inputClass} type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className={labelClass}>{t.phone}<input className={inputClass} type="tel" autoComplete="tel" minLength={7} maxLength={30} required value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label className={labelClass}>{t.gender}<select className={inputClass} value={gender} onChange={(event) => setGender(event.target.value as UserProfile['gender'])}><option value="male">{t.male}</option><option value="female">{t.female}</option><option value="neutral">{t.neutral}</option></select></label>
        <label className={labelClass}>{t.language}<select className={inputClass} value={language} onChange={(event) => setLanguage(event.target.value as UserProfile['language'])}><option value="es">Español</option><option value="en">English</option></select></label>
        <label className={labelClass}>{t.currencyLabel}<select className={inputClass} value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}>{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name}</option>)}</select></label>
        {currencyCode === 'CUSTOM' && <label className={labelClass}>{t.customSymbol}<input className={inputClass} required maxLength={8} value={customSymbol} onChange={(event) => setCustomSymbol(event.target.value)} /></label>}
        {(error || saved) && <p role={error ? 'alert' : 'status'} className={`sm:col-span-2 text-sm ${error ? 'text-rose-400' : 'text-emerald-400'}`}>{error || t.profileSaved}</p>}
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" disabled={saving} className="bg-mustard-500 hover:bg-mustard-600 disabled:opacity-50 text-dark-900 font-bold px-4 py-2.5 rounded-lg transition-colors text-sm">{saving ? t.loading : t.saveProfile}</button>
        </div>
      </form>
    </section>
  );
}