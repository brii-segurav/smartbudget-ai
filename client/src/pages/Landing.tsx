import { ArrowRight, Bot, ChartNoAxesCombined, Coins, Sparkles, Tags } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { translations } from '../constants';

export default function Landing() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];
  const features = [
    { Icon: Tags, title: t.autoCategoryNotice, detail: lang === 'es' ? 'Clasifica tus gastos mientras escribes y reduce el registro manual.' : 'Categorize expenses as you type and reduce manual entry.' },
    { Icon: ChartNoAxesCombined, title: t.aiWidgetTitle, detail: lang === 'es' ? 'Detecta tendencias y recibe recomendaciones basadas en tu actividad.' : 'Spot trends and get recommendations based on your activity.' },
    { Icon: Coins, title: lang === 'es' ? 'Moneda e idioma a tu medida' : 'Your currency and language', detail: lang === 'es' ? 'Personaliza tus preferencias para que tus finanzas se sientan tuyas.' : 'Personalize preferences so your finances feel like yours.' },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#080b22] text-white">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-white"><Coins size={19} aria-hidden="true" /></span>
          <span>SmartBudget <span className="text-indigo-300">AI</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 text-xs" aria-label={t.language}>
            <button type="button" onClick={() => setLang('es')} aria-pressed={lang === 'es'} className={`rounded px-2 py-1 ${lang === 'es' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'}`}>ES</button>
            <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={`rounded px-2 py-1 ${lang === 'en' ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:text-white'}`}>EN</button>
          </div>
          <Link to="/dashboard" className="hidden items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white sm:inline-flex">
            {t.login}<ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:min-h-[650px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:pb-24 lg:pt-8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(143,157,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(143,157,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
          <div className="max-w-xl animate-[fade-up_650ms_ease-out_both]">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <Sparkles size={13} aria-hidden="true" />{t.badge}
            </p>
            <h1 className="max-w-[12ch] text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-[58px]">SmartBudget AI</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              {lang === 'es' ? 'Tus finanzas, más claras. Registra menos, entiende más y decide con confianza.' : 'Your finances, made clearer. Track less, understand more, and make confident decisions.'}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/dashboard" className="group inline-flex min-h-12 items-center gap-3 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition-colors hover:bg-indigo-400">
                {lang === 'es' ? 'Probar SmartBudget' : 'Try SmartBudget'}
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <span className="text-xs text-slate-400">{lang === 'es' ? 'Empieza gratis · Configura tu perfil en minutos' : 'Start for free · Set up your profile in minutes'}</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{lang === 'es' ? 'Control privado por cuenta' : 'Private account data'}</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />ES / EN</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[640px] animate-[fade-up_850ms_ease-out_both] lg:ml-auto">
            <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#101633] shadow-2xl shadow-black/40">
              <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>
                <span className="text-[10px] text-slate-400">smartbudget.ai / {t.overview.toLowerCase()}</span>
                <div className="h-2 w-8 rounded-full bg-white/10" />
              </div>
              <div className="grid grid-cols-[54px_1fr] sm:grid-cols-[72px_1fr]">
                <aside className="flex flex-col items-center gap-5 border-r border-white/10 py-5 text-indigo-200/70">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500 text-white"><Coins size={16} aria-hidden="true" /></span>
                  <ChartNoAxesCombined size={16} aria-hidden="true" />
                  <Tags size={16} aria-hidden="true" />
                  <Bot size={16} aria-hidden="true" />
                </aside>
                <div className="min-w-0 space-y-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div><p className="text-[10px] text-slate-400">{lang === 'es' ? 'Resumen financiero' : 'Financial overview'}</p><p className="mt-1 text-lg font-semibold text-white sm:text-xl">$4,254.00</p></div>
                    <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">+8.2%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3"><p className="text-[10px] text-slate-400">{t.incomes}</p><p className="mt-1 text-sm font-semibold text-white">$5,800</p></div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3"><p className="text-[10px] text-slate-400">{t.expenses}</p><p className="mt-1 text-sm font-semibold text-white">$1,546</p></div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400"><span>{lang === 'es' ? 'Flujo mensual' : 'Monthly cash flow'}</span><span>6 {lang === 'es' ? 'meses' : 'months'}</span></div>
                    <div className="mt-4 flex h-28 items-end gap-2 border-b border-l border-white/10 px-2">
                      {[48, 62, 43, 78, 57, 88, 68, 96, 61, 82, 73, 100].map((height, index) => (
                        <span key={index} className="relative flex h-full flex-1 items-end gap-0.5"><i style={{ height: `${height}%` }} className="block w-1/2 rounded-t-sm bg-indigo-400/80" /><i style={{ height: `${Math.max(12, height * (index % 3 === 0 ? 0.46 : 0.62))}%` }} className="block w-1/2 rounded-t-sm bg-fuchsia-400/70" /></span>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-slate-500"><span>{lang === 'es' ? 'Abr' : 'Apr'}</span><span>Sep</span></div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-indigo-300/15 bg-indigo-400/[0.07] p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-400/15 text-indigo-200"><Sparkles size={15} aria-hidden="true" /></span>
                    <p className="text-[10px] leading-4 text-slate-300">{lang === 'es' ? 'Tus gastos de comida bajaron este mes. Mantén el límite que definiste.' : 'Food spending is down this month. Keep your current budget limit.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#0c102b] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase text-indigo-300">{lang === 'es' ? 'Finanzas personales, con menos fricción' : 'Personal finance, with less friction'}</p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{lang === 'es' ? 'Todo lo importante, en un solo lugar.' : 'Everything that matters, in one place.'}</h2>
            </div>
            <div className="mt-9 grid grid-cols-1 gap-3 md:grid-cols-3">
              {features.map(({ Icon, title, detail }) => (
                <article key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-indigo-300/30 hover:bg-white/[0.055]">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-400/10 text-indigo-200"><Icon size={19} aria-hidden="true" /></span>
                  <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-5 text-xs text-slate-500 sm:px-8">
        <span>© {new Date().getFullYear()} SmartBudget AI</span>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">{t.addTransaction}<ArrowRight size={14} aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}