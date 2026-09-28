import { currencies } from '../constants';

interface HeaderProps {
  t: any;
  lang: 'es' | 'en';
  setLang: (lang: 'es' | 'en') => void;
  selectedCurrencyCode: string;
  handleCurrencyChange: (code: string) => void;
  customSymbolInput: string;
  handleCustomSymbolChange: (symbol: string) => void;
  handleCustomSymbolCommit: () => void;
  profileLabel: string;
  logoutLabel: string;
  onProfile: () => void;
  onLogout: () => void;
}

export default function Header({
  t,
  lang,
  setLang,
  selectedCurrencyCode,
  handleCurrencyChange,
  customSymbolInput,
  handleCustomSymbolChange,
  handleCustomSymbolCommit,
  profileLabel,
  logoutLabel,
  onProfile,
  onLogout,
}: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
        <p className="text-xs text-slate-500">{t.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Selector de Idioma */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            onClick={() => setLang('es')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              lang === 'es' ? 'bg-teal-700 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setLang('en')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
              lang === 'en' ? 'bg-teal-700 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            EN
          </button>
        </div>

        {/* Selector de Moneda */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
          <span className="text-slate-500">{t.currencyLabel}</span>
          <select
            value={selectedCurrencyCode}
            onChange={e => handleCurrencyChange(e.target.value)}
            className="cursor-pointer bg-transparent font-semibold text-slate-800 focus:outline-none"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code} className="bg-white text-slate-900">
                {c.name}
              </option>
            ))}
          </select>

          {selectedCurrencyCode === 'CUSTOM' && (
            <input
              type="text"
              placeholder={t.customSymbol}
              value={customSymbolInput}
              onChange={e => handleCustomSymbolChange(e.target.value)}
              onBlur={handleCustomSymbolCommit}
              className="ml-1 w-16 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
          )}
        </div>

        <span className="rounded-full border border-teal-700/20 bg-teal-700/10 px-3 py-1 text-xs font-semibold text-teal-800">
          {t.badge}
        </span>
        <button type="button" onClick={onProfile} className="text-sm text-slate-600 transition-colors hover:text-slate-950">{profileLabel}</button>
        <button type="button" onClick={onLogout} className="text-sm text-slate-500 transition-colors hover:text-rose-700">{logoutLabel}</button>
      </div>
    </div>
  );
}