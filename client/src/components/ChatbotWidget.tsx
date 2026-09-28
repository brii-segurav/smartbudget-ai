import { useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { API_BASE_URL, authorizationHeader } from '../api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotWidgetProps {
  token: string;
  lang: 'es' | 'en';
  t: any;
}

export default function ChatbotWidget({ token, lang, t }: ChatbotWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setMessage('');
    setError('');
    setLoading(true);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authorizationHeader(token) },
        body: JSON.stringify({ message: text, lang, history: messages.slice(-10) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : t.chatError);
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.chatError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[min(470px,68vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl" aria-label={t.assistant}>
          <header className="flex items-center justify-between bg-[#173d40] px-4 py-3 text-white">
            <div className="flex items-center gap-2"><Bot size={18} aria-hidden="true" /><h2 className="text-sm font-semibold">{t.assistant}</h2></div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"><X size={18} aria-hidden="true" /></button>
          </header>
          <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] leading-4 text-slate-500">{t.aiPrivacyNotice}</p>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 && <p className="max-w-[90%] rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{t.assistantGreeting}</p>}
            {messages.map((chatMessage, index) => (
              <p key={`${chatMessage.role}-${index}`} className={`max-w-[90%] whitespace-pre-wrap rounded-lg p-3 text-sm ${chatMessage.role === 'user' ? 'ml-auto bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {chatMessage.content}
              </p>
            ))}
            {loading && <p className="text-xs text-slate-500">{t.loading}</p>}
            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          </div>
          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-slate-200 p-3">
            <textarea rows={2} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t.askAssistant} className="min-h-10 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600" />
            <button type="submit" disabled={!message.trim() || loading} aria-label={t.sendMessage} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"><Send size={16} aria-hidden="true" /></button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen(!open)} aria-label={open ? t.close : t.assistant} className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg hover:bg-teal-800 focus-visible:outline-teal-500">
        {open ? <X size={20} aria-hidden="true" /> : <MessageCircle size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}