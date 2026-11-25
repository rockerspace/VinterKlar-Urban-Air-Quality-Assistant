import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import type { HouseholdProfile, LocalAirBrief, SmogSeverity } from '../types';
import { isSafeHttpUrl } from '../utils/url';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  profile: HouseholdProfile;
  airBrief: LocalAirBrief;
  isFetchingBrief: boolean;
  briefError: string | null;
  onRefreshBrief: () => void;
  onOpenAdvisor: () => void;
  onOpenProfile: () => void;
}

export function SeverityIndicator({ level }: { level: SmogSeverity }) {
  if (level === 'Nominal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        Nominal Air
      </span>
    );
  }
  if (level === 'Moderate') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
        Moderate · Inversion Watch
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
      <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
      {level} Smog Advisory
    </span>
  );
}

export function HeroSection({
  profile,
  airBrief,
  isFetchingBrief,
  briefError,
  onRefreshBrief,
  onOpenAdvisor,
  onOpenProfile,
}: HeroSectionProps) {
  const safeCitations = airBrief.citations.filter((c) => isSafeHttpUrl(c.url));

  return (
    <section className="py-10 lg:py-12" aria-labelledby="hero-heading">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5C58] mb-3">
              <span className="font-semibold text-[#13221F]">{airBrief.city}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">PM2.5 {airBrief.pm25UgM3} µg/m³</span>
              <span aria-hidden="true">·</span>
              <SeverityIndicator level={airBrief.severityLevel} />
            </div>

            <h1
              id="hero-heading"
              className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-[#13221F] leading-[1.15] tracking-tight mb-4"
            >
              Navigate winter smog with clear, measurable daily choices.
            </h1>

            <p className="text-base text-[#4A5C58] leading-relaxed max-w-xl">
              Tailored low-emission routines, practical indoor air quality hacks, and sustainable
              alternatives for families and communities—showing the direct impact on what you
              breathe and emit.
            </p>
          </div>

          <div className="space-y-4">
            <div
              className="bg-white border border-[#D8E2DF] rounded-xl p-4"
              aria-live="polite"
              aria-busy={isFetchingBrief}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-[#13221F]">
                  Local Smog &amp; Inversion Brief
                </span>
                <span className="text-[11px] font-mono text-[#4A5C58]">
                  {airBrief.isLiveGrounded
                    ? `Live Grounded · ${airBrief.fetchedAt}`
                    : airBrief.fetchedAt}
                </span>
              </div>
              <p className="text-xs text-[#4A5C58] leading-relaxed">{airBrief.advisorySummary}</p>
            </div>

            {briefError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
              >
                {briefError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onRefreshBrief}
                disabled={isFetchingBrief}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetchingBrief ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {isFetchingBrief ? 'Checking Live Air Quality...' : 'Check Live Local Air'}
              </button>

              <button
                type="button"
                onClick={onOpenAdvisor}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#13221F] bg-white border border-[#D8E2DF] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#175946]" aria-hidden="true" />
                Ask Clean-Air Advisor
              </button>

              <button
                type="button"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[#4A5C58] hover:text-[#13221F] cursor-pointer whitespace-nowrap"
              >
                <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                Household Setup ({profile.householdSize})
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full min-h-[280px] rounded-xl overflow-hidden border border-[#D8E2DF] bg-[#EDF2F0]">
            <ResilientImage
              src="/src/assets/images/hero_nordic_winter_valley_1795005025292.jpg"
              alt="Crisp Nordic winter valley skyline showing morning thermal inversion haze"
              className="w-full h-full object-cover"
              fallbackLabel="Winter Inversion Valley Overview"
            />
          </div>
        </div>
      </div>

      {/* Full-Width 4-Column Atmospheric Strip Below Hero */}
      <div className="mt-8 bg-white border border-[#D8E2DF] rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D8E2DF]">
        <div className="p-5">
          <span className="block text-xs text-[#4A5C58]">Current Outdoor Level</span>
          <div className="mt-1 font-mono tabular-nums flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#13221F]">{airBrief.estimatedAqi}</span>
            <span className="text-xs text-[#4A5C58]">AQI · {airBrief.pm25UgM3} µg/m³</span>
          </div>
          <div className="mt-1">
            <SeverityIndicator level={airBrief.severityLevel} />
          </div>
        </div>

        <div className="p-5">
          <span className="block text-xs text-[#4A5C58]">Peak Inversion Cap</span>
          <p className="mt-1 font-mono tabular-nums text-sm font-semibold text-[#13221F]">
            {airBrief.inversionWindow}
          </p>
          <span className="block text-[11px] text-[#4A5C58] mt-1">
            Keep windows sealed &amp; filtration active
          </span>
        </div>

        <div className="p-5">
          <span className="block text-xs text-[#4A5C58]">Safest Outdoor / Airing Window</span>
          <p className="mt-1 font-mono tabular-nums text-sm font-semibold text-[#175946]">
            {airBrief.bestVentilationWindow}
          </p>
          <span className="block text-[11px] text-[#4A5C58] mt-1">
            Best time for short errands &amp; 10-min air flush
          </span>
        </div>

        <div className="p-5">
          <span className="block text-xs text-[#4A5C58]">Primary Local Drivers</span>
          <p className="mt-1 text-xs font-medium text-[#13221F] leading-relaxed">
            {airBrief.primaryPollutants}
          </p>
        </div>
      </div>

      {/* Grounding Citations when fetched live */}
      {safeCitations.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4A5C58]">
          <span className="font-medium text-[#13221F]">Grounded local sources:</span>
          {safeCitations.map((cite) => (
            <a
              key={cite.url}
              href={cite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#175946] hover:underline"
            >
              <span className="truncate max-w-[220px]">{cite.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
