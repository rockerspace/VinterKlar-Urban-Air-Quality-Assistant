import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import type {
  HouseholdProfile,
  ImpactBaselineInputs,
  LocalAirBrief,
  SmogSeverity,
  TailoredPlaybook,
} from './types';
import {
  CITY_PRESETS,
  DEFAULT_HOUSEHOLD_PROFILE,
  INITIAL_PLAYBOOK,
  calculateDirectImpact,
} from './data/cleanAirData';
import { ResilientImage } from './components/ResilientImage';
import { ProfileModal } from './components/ProfileModal';
import { ImpactCalculator } from './components/ImpactCalculator';
import { PlaybookSection } from './components/PlaybookSection';
import { IndoorLabSection } from './components/IndoorLabSection';
import { CommunitySection } from './components/CommunitySection';
import { AdvisorDrawer } from './components/AdvisorDrawer';

const STORAGE_KEY = 'vinterklar_state_v1';

const DEFAULT_ACTIVE_INTERVENTIONS = [
  'corsi_rosenthal',
  'midday_window',
  'idle_free',
  'stop_wood_burn',
];

function SeverityIndicator({ level }: { level: SmogSeverity }) {
  if (level === 'Nominal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Nominal Air
      </span>
    );
  }
  if (level === 'Moderate') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Moderate · Inversion Watch
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
      <ShieldAlert className="w-3.5 h-3.5" />
      {level} Smog Advisory
    </span>
  );
}

export default function App() {
  const initialPreset = CITY_PRESETS[0];

  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_HOUSEHOLD_PROFILE);
  const [airBrief, setAirBrief] = useState<LocalAirBrief>(initialPreset.brief);
  const [playbook, setPlaybook] = useState<TailoredPlaybook>(INITIAL_PLAYBOOK);
  const [baseline, setBaseline] = useState<ImpactBaselineInputs>(initialPreset.defaultBaseline);
  const [activeInterventions, setActiveInterventions] = useState<string[]>(
    DEFAULT_ACTIVE_INTERVENTIONS,
  );
  const [completedHabitIds, setCompletedHabitIds] = useState<string[]>([]);
  const [communityHouseholds, setCommunityHouseholds] = useState<number>(50);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isFetchingBrief, setIsFetchingBrief] = useState(false);
  const [isFetchingPlaybook, setIsFetchingPlaybook] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [playbookError, setPlaybookError] = useState<string | null>(null);

  // Hydrate saved user settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.profile) setProfile(saved.profile);
      if (saved.airBrief) setAirBrief(saved.airBrief);
      if (saved.playbook) setPlaybook(saved.playbook);
      if (saved.baseline) setBaseline(saved.baseline);
      if (Array.isArray(saved.activeInterventions)) {
        setActiveInterventions(saved.activeInterventions);
      }
      if (Array.isArray(saved.completedHabitIds)) {
        setCompletedHabitIds(saved.completedHabitIds);
      }
      if (typeof saved.communityHouseholds === 'number') {
        setCommunityHouseholds(saved.communityHouseholds);
      }
    } catch {
      // Ignore malformed storage
    }
  }, []);

  // Persist user settings automatically
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile,
          airBrief,
          playbook,
          baseline,
          activeInterventions,
          completedHabitIds,
          communityHouseholds,
        }),
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    profile,
    airBrief,
    playbook,
    baseline,
    activeInterventions,
    completedHabitIds,
    communityHouseholds,
  ]);

  const impact = useMemo(
    () =>
      calculateDirectImpact(
        baseline,
        activeInterventions,
        profile.householdSize,
        communityHouseholds,
      ),
    [baseline, activeInterventions, profile.householdSize, communityHouseholds],
  );

  const fetchGroundedBrief = async (
    targetProfile: HouseholdProfile,
  ): Promise<LocalAirBrief | null> => {
    setIsFetchingBrief(true);
    setBriefError(null);
    try {
      const res = await fetch('/api/air-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: targetProfile.city,
          regionContext: targetProfile.regionContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to fetch local air brief.');
      }
      setAirBrief(data);
      setBaseline((prev) => ({
        ...prev,
        outdoorPm25UgM3: Math.max(10, Math.min(220, Math.round(data.pm25UgM3 || 45))),
      }));
      return data as LocalAirBrief;
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'Unable to fetch live air brief.');
      return null;
    } finally {
      setIsFetchingBrief(false);
    }
  };

  const fetchTailoredPlaybook = async (
    targetProfile: HouseholdProfile,
    targetBrief: LocalAirBrief,
  ) => {
    setIsFetchingPlaybook(true);
    setPlaybookError(null);
    try {
      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: targetProfile,
          airBrief: targetBrief,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to generate tailored playbook.');
      }
      setPlaybook(data);
    } catch (err) {
      setPlaybookError(
        err instanceof Error ? err.message : 'Unable to generate tailored playbook.',
      );
    } finally {
      setIsFetchingPlaybook(false);
    }
  };

  const handleApplyProfile = async (nextProfile: HouseholdProfile, presetId?: string) => {
    setProfile(nextProfile);

    // Sync calculator baseline & preset brief immediately if a preset was selected, then enrich live
    let workingBrief = airBrief;
    if (presetId) {
      const matched = CITY_PRESETS.find((p) => p.id === presetId);
      if (matched) {
        setAirBrief(matched.brief);
        setBaseline(matched.defaultBaseline);
        workingBrief = matched.brief;
      }
    }

    const liveBrief = await fetchGroundedBrief(nextProfile);
    await fetchTailoredPlaybook(nextProfile, liveBrief || workingBrief);
  };

  const handleToggleIntervention = (id: string) => {
    setActiveInterventions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleToggleHabitComplete = (id: string) => {
    setCompletedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleResetCalculator = () => {
    setBaseline({
      ...initialPreset.defaultBaseline,
      outdoorPm25UgM3: Math.max(10, Math.min(220, Math.round(airBrief.pm25UgM3))),
    });
    setActiveInterventions(DEFAULT_ACTIVE_INTERVENTIONS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F8] text-[#13221F]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-[#D8E2DF] sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-[#13221F] whitespace-nowrap shrink-0"
          >
            VinterKlar
          </a>

          {/* Zone 2: 4 single-line text nav links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A5C58]"
          >
            <a
              href="#impact-calculator"
              className="hover:text-[#13221F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Impact Calculator
            </a>
            <a
              href="#playbook"
              className="hover:text-[#13221F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Daily Playbook
            </a>
            <a
              href="#indoor-air"
              className="hover:text-[#13221F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Indoor Air Lab
            </a>
            <a
              href="#community"
              className="hover:text-[#13221F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Community
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              Update Location
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 max-w-[1200px] w-full mx-auto px-6">
        {/* Hero Split */}
        <section className="py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5C58] mb-3">
                  <span className="font-semibold text-[#13221F]">{airBrief.city}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    PM2.5 {airBrief.pm25UgM3} µg/m³
                  </span>
                  <span aria-hidden="true">·</span>
                  <SeverityIndicator level={airBrief.severityLevel} />
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-[#13221F] leading-[1.15] tracking-tight mb-4">
                  Navigate winter smog with clear, measurable daily choices.
                </h1>

                <p className="text-base text-[#4A5C58] leading-relaxed max-w-xl">
                  Tailored low-emission routines, practical indoor air quality hacks, and sustainable
                  alternatives for families and communities—showing the direct impact on what you
                  breathe and emit.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-[#D8E2DF] rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#13221F]">
                      Local Smog & Inversion Brief
                    </span>
                    <span className="text-[11px] font-mono text-[#4A5C58]">
                      {airBrief.isLiveGrounded ? `Live Grounded · ${airBrief.fetchedAt}` : airBrief.fetchedAt}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5C58] leading-relaxed">
                    {airBrief.advisorySummary}
                  </p>
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
                    onClick={() => fetchGroundedBrief(profile)}
                    disabled={isFetchingBrief}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isFetchingBrief ? 'animate-spin' : ''}`}
                    />
                    {isFetchingBrief ? 'Checking Live Air Quality...' : 'Check Live Local Air'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAdvisorOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#13221F] bg-white border border-[#D8E2DF] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#175946]" />
                    Ask Clean-Air Advisor
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[#4A5C58] hover:text-[#13221F] cursor-pointer whitespace-nowrap"
                  >
                    <Sliders className="w-3.5 h-3.5" />
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
          {airBrief.citations.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4A5C58]">
              <span className="font-medium text-[#13221F]">Grounded local sources:</span>
              {airBrief.citations.map((cite) => (
                <a
                  key={cite.url}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#175946] hover:underline"
                >
                  <span className="truncate max-w-[220px]">{cite.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Flagship Module: Direct Impact Calculator */}
        <ImpactCalculator
          baseline={baseline}
          onChangeBaseline={setBaseline}
          activeInterventions={activeInterventions}
          onToggleIntervention={handleToggleIntervention}
          onResetDefaults={handleResetCalculator}
          impact={impact}
          cityName={airBrief.city}
        />

        {/* Tailored Daily Playbook */}
        <PlaybookSection
          playbook={playbook}
          isLoading={isFetchingPlaybook}
          error={playbookError}
          onRegenerate={() => fetchTailoredPlaybook(profile, airBrief)}
          completedIds={completedHabitIds}
          onToggleComplete={handleToggleHabitComplete}
        />

        {/* Indoor Air Lab & Sustainable Swaps */}
        <IndoorLabSection />

        {/* Community Action Multiplier */}
        <CommunitySection
          communityHouseholds={communityHouseholds}
          onChangeCommunityHouseholds={setCommunityHouseholds}
          impact={impact}
          airBrief={airBrief}
          activeInterventionsCount={activeInterventions.length}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#D8E2DF] bg-white py-8 mt-8">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#4A5C58]">
          <div>
            <span className="font-semibold text-[#13221F]">VinterKlar</span> · Winter Smog &amp;
            Urban Clean-Air Assistant for Families and Communities
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="hover:text-[#13221F] cursor-pointer"
            >
              Location Settings
            </button>
            <button
              type="button"
              onClick={() => setIsAdvisorOpen(true)}
              className="hover:text-[#13221F] cursor-pointer"
            >
              Ask Clean-Air Advisor
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Advisor Trigger (Compact, well under 15% mobile height) */}
      {!isAdvisorOpen && (
        <button
          type="button"
          onClick={() => setIsAdvisorOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] rounded-full shadow-md transition-colors cursor-pointer print:hidden"
        >
          <MessageSquare className="w-4 h-4" />
          Ask Advisor
        </button>
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onApplyProfile={handleApplyProfile}
        isLoading={isFetchingBrief || isFetchingPlaybook}
      />

      <AdvisorDrawer
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        profile={profile}
        airBrief={airBrief}
        impact={impact}
      />
    </div>
  );
}
