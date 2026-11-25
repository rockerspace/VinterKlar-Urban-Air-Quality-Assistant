import { useState } from 'react';
import { RefreshCw, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { PlaybookCategory, TailoredPlaybook } from '../types';

interface PlaybookSectionProps {
  playbook: TailoredPlaybook;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  completedIds: string[];
  onToggleComplete: (id: string) => void;
}

const FILTER_TABS: { id: 'all' | PlaybookCategory; label: string }[] = [
  { id: 'all', label: 'All Guidance' },
  { id: 'daily_routine', label: 'Low-Emission Routines' },
  { id: 'indoor_hack', label: 'Indoor Air Hacks' },
  { id: 'sustainable_swap', label: 'Sustainable Swaps' },
];

const CATEGORY_TEXT: Record<PlaybookCategory, string> = {
  daily_routine: 'Low-Emission Daily Routine',
  indoor_hack: 'Indoor Air Quality Hack',
  sustainable_swap: 'Sustainable Alternative',
};

export function PlaybookSection({
  playbook,
  isLoading,
  error,
  onRegenerate,
  completedIds,
  onToggleComplete,
}: PlaybookSectionProps) {
  const [filter, setFilter] = useState<'all' | PlaybookCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedSet = new Set(completedIds);
  const filtered =
    filter === 'all'
      ? playbook.recommendations
      : playbook.recommendations.filter((r) => r.category === filter);

  return (
    <section id="playbook" className="py-14 border-t border-[#D8E2DF]" aria-labelledby="playbook-heading">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[#175946] tracking-wide mb-1.5">
            Tailored Family Playbook · {playbook.city}
          </p>
          <h2 id="playbook-heading" className="text-2xl sm:text-3xl font-bold text-[#13221F] tracking-tight">
            Practical routines, indoor hacks, and alternatives with clear impact
          </h2>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isLoading ? 'Tailoring Playbook...' : 'Refresh AI Playbook'}
        </button>
      </div>

      {/* Headline Insight Strip */}
      <div className="bg-[#EDF2F0] border border-[#D8E2DF] rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-semibold text-[#175946]">
            Highest-Leverage Priority for Your Household
          </span>
          <span className="text-xs text-[#4A5C58] font-mono tabular-nums">
            {completedIds.length} of {playbook.recommendations.length} habits adopted · {playbook.generatedAt}
          </span>
        </div>
        <p className="text-sm sm:text-base text-[#13221F] leading-relaxed">
          {playbook.headlineInsight}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-4 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#FECACA] rounded-md hover:bg-[#FEE2E2] cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div
        role="group"
        aria-label="Filter recommendations by category"
        className="flex flex-wrap items-center gap-1 p-1 bg-[#EDF2F0] rounded-lg w-fit mb-6"
      >
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-white text-[#13221F] shadow-sm'
                  : 'text-[#4A5C58] hover:text-[#13221F]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton or Recommendation Cards */}
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading tailored recommendations"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-[#D8E2DF] rounded-xl p-6 space-y-4 animate-pulse"
            >
              <div className="h-3 w-40 bg-[#EDF2F0] rounded" />
              <div className="h-5 w-4/5 bg-[#EDF2F0] rounded" />
              <div className="h-12 w-full bg-[#F7F9F8] rounded" />
              <div className="h-20 w-full bg-[#EDF2F0] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((rec) => {
            const isDone = completedSet.has(rec.id);
            const isExpanded = expandedId === rec.id;
            return (
              <article
                key={rec.id}
                className={`bg-white border rounded-xl p-6 flex flex-col justify-between transition-colors ${
                  isDone ? 'border-[#175946]/50 bg-[#F7F9F8]' : 'border-[#D8E2DF]'
                }`}
              >
                <div>
                  {/* Quiet Unboxed Metadata */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#4A5C58]">
                      <span className="font-medium text-[#175946]">
                        {CATEGORY_TEXT[rec.category]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.timingOrCadence}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.effortLevel}</span>
                    </div>

                    <button
                      type="button"
                      aria-pressed={isDone}
                      onClick={() => onToggleComplete(rec.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isDone
                          ? 'bg-[#175946] text-white border-[#175946]'
                          : 'bg-white text-[#4A5C58] border-[#D8E2DF] hover:text-[#13221F]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      {isDone ? 'Adopted' : 'Adopt Habit'}
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-[#13221F] leading-snug mb-2">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-[#4A5C58] leading-relaxed mb-4">{rec.summary}</p>

                  {/* Direct Impact Explanation Box */}
                  <div className="bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg p-3.5 mb-4">
                    <span className="block text-xs font-semibold text-[#13221F] mb-1">
                      Direct Impact of This Choice
                    </span>
                    <p className="text-xs text-[#4A5C58] leading-relaxed">
                      {rec.directImpactExplanation}
                    </p>
                  </div>
                </div>

                <div>
                  {/* Quantitative Footer + Expand Steps */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D8E2DF]">
                    <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[#13221F]">
                      {rec.estimatedPm25ExposureDropPct > 0 && (
                        <span className="text-[#175946] font-semibold">
                          -{rec.estimatedPm25ExposureDropPct}% exposure
                        </span>
                      )}
                      {rec.estimatedWeeklyPm25AvoidedGrams > 0 && (
                        <span>{rec.estimatedWeeklyPm25AvoidedGrams}g PM2.5/wk avoided</span>
                      )}
                      {rec.estimatedWeeklyCo2AvoidedKg > 0 && (
                        <span>{rec.estimatedWeeklyCo2AvoidedKg}kg CO2e/wk</span>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#175946] hover:text-[#124738] cursor-pointer whitespace-nowrap"
                    >
                      {isExpanded ? 'Hide Steps' : 'How-To Steps'}
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {isExpanded && rec.howToSteps.length > 0 && (
                    <ol className="mt-3 pt-3 border-t border-[#D8E2DF] space-y-1.5 text-xs text-[#4A5C58] list-decimal list-inside">
                      {rec.howToSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
