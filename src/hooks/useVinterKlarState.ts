import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type {
  HouseholdProfile,
  ImpactBaselineInputs,
  LocalAirBrief,
  TailoredPlaybook,
} from '../types';
import {
  CITY_PRESETS,
  DEFAULT_HOUSEHOLD_PROFILE,
  INITIAL_PLAYBOOK,
  calculateDirectImpact,
} from '../data/cleanAirData';

export const STORAGE_KEY = 'vinterklar_state_v1';

export const DEFAULT_ACTIVE_INTERVENTIONS = [
  'corsi_rosenthal',
  'midday_window',
  'idle_free',
  'stop_wood_burn',
];

interface PersistedState {
  profile?: HouseholdProfile;
  airBrief?: LocalAirBrief;
  playbook?: TailoredPlaybook;
  baseline?: ImpactBaselineInputs;
  activeInterventions?: string[];
  completedHabitIds?: string[];
  communityHouseholds?: number;
}

function loadSavedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PersistedState) : null;
  } catch {
    return null;
  }
}

/**
 * Central state hook for VinterKlar household settings, persisted preferences,
 * deterministic impact calculation, and abort-safe server API calls.
 */
export function useVinterKlarState() {
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

  const [isFetchingBrief, setIsFetchingBrief] = useState(false);
  const [isFetchingPlaybook, setIsFetchingPlaybook] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [playbookError, setPlaybookError] = useState<string | null>(null);

  const briefAbortRef = useRef<AbortController | null>(null);
  const playbookAbortRef = useRef<AbortController | null>(null);

  // Hydrate saved settings on mount
  useEffect(() => {
    const saved = loadSavedState();
    if (!saved) return;
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
      // Ignore private-browsing or quota storage errors
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

  // Cancel any in-flight requests on unmount
  useEffect(() => {
    return () => {
      briefAbortRef.current?.abort();
      playbookAbortRef.current?.abort();
    };
  }, []);

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

  const fetchGroundedBrief = useCallback(
    async (targetProfile: HouseholdProfile): Promise<LocalAirBrief | null> => {
      briefAbortRef.current?.abort();
      const controller = new AbortController();
      briefAbortRef.current = controller;

      setIsFetchingBrief(true);
      setBriefError(null);
      try {
        const res = await fetch('/api/air-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            city: targetProfile.city,
            regionContext: targetProfile.regionContext,
          }),
        });
        const data = (await res.json()) as LocalAirBrief & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Unable to fetch local air brief.');
        }
        setAirBrief(data);
        setBaseline((prev) => ({
          ...prev,
          outdoorPm25UgM3: Math.max(10, Math.min(220, Math.round(data.pm25UgM3 || 45))),
        }));
        return data;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return null;
        }
        setBriefError(err instanceof Error ? err.message : 'Unable to fetch live air brief.');
        return null;
      } finally {
        if (briefAbortRef.current === controller) {
          setIsFetchingBrief(false);
        }
      }
    },
    [],
  );

  const fetchTailoredPlaybook = useCallback(
    async (targetProfile: HouseholdProfile, targetBrief: LocalAirBrief) => {
      playbookAbortRef.current?.abort();
      const controller = new AbortController();
      playbookAbortRef.current = controller;

      setIsFetchingPlaybook(true);
      setPlaybookError(null);
      try {
        const res = await fetch('/api/playbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            profile: targetProfile,
            airBrief: targetBrief,
          }),
        });
        const data = (await res.json()) as TailoredPlaybook & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Unable to generate tailored playbook.');
        }
        setPlaybook(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setPlaybookError(
          err instanceof Error ? err.message : 'Unable to generate tailored playbook.',
        );
      } finally {
        if (playbookAbortRef.current === controller) {
          setIsFetchingPlaybook(false);
        }
      }
    },
    [],
  );

  const handleApplyProfile = useCallback(
    async (nextProfile: HouseholdProfile, presetId?: string) => {
      setProfile(nextProfile);

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
    },
    [airBrief, fetchGroundedBrief, fetchTailoredPlaybook],
  );

  const handleToggleIntervention = useCallback((id: string) => {
    setActiveInterventions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const handleToggleHabitComplete = useCallback((id: string) => {
    setCompletedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const handleResetCalculator = useCallback(() => {
    setBaseline({
      ...initialPreset.defaultBaseline,
      outdoorPm25UgM3: Math.max(10, Math.min(220, Math.round(airBrief.pm25UgM3))),
    });
    setActiveInterventions(DEFAULT_ACTIVE_INTERVENTIONS);
  }, [airBrief.pm25UgM3, initialPreset.defaultBaseline]);

  return {
    profile,
    airBrief,
    playbook,
    baseline,
    setBaseline,
    activeInterventions,
    completedHabitIds,
    communityHouseholds,
    setCommunityHouseholds,
    impact,
    isFetchingBrief,
    isFetchingPlaybook,
    briefError,
    playbookError,
    fetchGroundedBrief,
    fetchTailoredPlaybook,
    handleApplyProfile,
    handleToggleIntervention,
    handleToggleHabitComplete,
    handleResetCalculator,
  };
}
