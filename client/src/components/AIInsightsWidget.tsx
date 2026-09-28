import type { AIInsights } from '../types';
import { Sparkles } from 'lucide-react';

interface AIInsightsWidgetProps {
  t: any;
  aiData: AIInsights | null;
  loadingAI: boolean;
  fetchAIInsights: () => void;
  error?: string;
}

export default function AIInsightsWidget({ t, aiData, loadingAI, fetchAIInsights, error }: AIInsightsWidgetProps) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-teal-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900">{t.aiWidgetTitle}</h2>
        </div>
        <button
          type="button"
          onClick={fetchAIInsights}
          disabled={loadingAI}
          className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {loadingAI ? t.loading : t.generateAI}
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      {aiData && (
        <div className="space-y-3 pt-2 border-t border-dark-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-teal-700">{aiData.health_score}/100</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {aiData.status}
            </span>
          </div>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-700">
            {aiData.recommendations.map((rec, idx) => (
              <li key={idx} className="leading-relaxed">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}