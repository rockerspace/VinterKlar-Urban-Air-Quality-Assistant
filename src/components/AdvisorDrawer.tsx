import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import type {
  AdvisorMessage,
  HouseholdProfile,
  ImpactCalculationResult,
  LocalAirBrief,
} from '../types';

interface AdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  airBrief: LocalAirBrief;
  impact: ImpactCalculationResult;
}

export function AdvisorDrawer({
  isOpen,
  onClose,
  profile,
  airBrief,
  impact,
}: AdvisorDrawerProps) {
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm tracking winter air conditions in ${profile.city} (currently ~${airBrief.pm25UgM3} µg/m³ PM2.5, ${airBrief.severityLevel}). Ask me about school commute timing, low-cost window sealing, purifier sizing, or the direct impact of any household swap.`,
      timestamp: 'Ready',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickPrompts = [
    `Is it safe for kids to walk or play outside at 8 AM in ${profile.city} today?`,
    'How can I build a quiet bedroom clean-air zone for under $70?',
    'How much PM2.5 does skipping one evening fireplace fire actually save?',
    'What should we check before opening windows for fresh air?',
  ];

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const userMsg: AdvisorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantId = `assistant-${Date.now()}`;
    const placeholderAssistant: AdvisorMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages([...nextHistory, placeholderAssistant]);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          profile,
          airBrief,
          impactSummary: {
            baselineIndoorPm25: impact.baselineIndoorPm25,
            mitigatedIndoorPm25: impact.mitigatedIndoorPm25,
            indoorDropPct: impact.indoorDropPct,
            weeklyPm25AvoidedGrams: impact.weeklyPm25AvoidedGrams,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Advisor request failed.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response is unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const clean = line.trim();
          if (!clean.startsWith('data: ')) continue;
          const payload = clean.slice(6);
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.text } : m,
                ),
              );
            }
          } catch (innerErr) {
            if (innerErr instanceof Error && innerErr.message !== 'Unexpected end of JSON input') {
              throw innerErr;
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reach the clean-air advisor.';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.length > 0));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#13221F]/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisor-drawer-title"
    >
      <div className="bg-white border-l border-[#D8E2DF] w-full max-w-lg h-full flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D8E2DF] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageSquare className="w-4 h-4 text-[#175946] shrink-0" />
            <div className="min-w-0">
              <h2 id="advisor-drawer-title" className="text-base font-semibold text-[#13221F] truncate">
                Clean-Air Family Advisor
              </h2>
              <p className="text-xs text-[#4A5C58] truncate">
                {profile.city} · {airBrief.pm25UgM3} µg/m³ PM2.5
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#4A5C58] hover:text-[#13221F] hover:bg-[#EDF2F0] transition-colors cursor-pointer"
            aria-label="Close advisor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F9F8]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#175946] text-white'
                    : 'bg-white border border-[#D8E2DF] text-[#13221F]'
                }`}
              >
                {msg.content || (isStreaming ? 'Thinking...' : '')}
              </div>
              <span className="text-[11px] text-[#4A5C58] mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {/* Quick Prompt Suggestions */}
          {messages.length <= 2 && !isStreaming && (
            <div className="pt-2 space-y-2">
              <span className="block text-xs font-medium text-[#4A5C58]">
                Suggested questions for your home:
              </span>
              <div className="flex flex-col gap-2">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="text-left px-3.5 py-2.5 text-xs font-medium text-[#13221F] bg-white border border-[#D8E2DF] hover:border-[#175946] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-4 bg-white border-t border-[#D8E2DF] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about commute windows, masks, filters..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#175946]/25 focus:border-[#175946]"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-[#175946] hover:bg-[#124738] disabled:opacity-50 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
