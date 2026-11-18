import { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Loader2 } from 'lucide-react';
import type {
  CommuteMode,
  CookingFuel,
  HeatingType,
  HouseholdProfile,
  PurifierSetup,
  SensitiveMember,
} from '../types';
import { CITY_PRESETS } from '../data/cleanAirData';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  onApplyProfile: (nextProfile: HouseholdProfile, presetId?: string) => Promise<void>;
  isLoading: boolean;
}

const SENSITIVE_OPTIONS: { id: SensitiveMember; label: string }[] = [
  { id: 'young_children', label: 'Young children' },
  { id: 'asthma_respiratory', label: 'Asthma or respiratory condition' },
  { id: 'older_adults', label: 'Older adults (65+)' },
  { id: 'pregnant', label: 'Pregnancy' },
];

export function ProfileModal({
  isOpen,
  onClose,
  profile,
  onApplyProfile,
  isLoading,
}: ProfileModalProps) {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(profile);
      setSelectedPresetId(undefined);
      setGeoError(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const toggleSensitive = (id: SensitiveMember) => {
    setDraft((prev) => ({
      ...prev,
      sensitiveMembers: prev.sensitiveMembers.includes(id)
        ? prev.sensitiveMembers.filter((m) => m !== id)
        : [...prev.sensitiveMembers, id],
    }));
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser geolocation is unavailable.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/resolve-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Could not resolve city from coordinates.');
          }
          setDraft((prev) => ({
            ...prev,
            city: data.city || prev.city,
            regionContext: data.regionContext || prev.regionContext,
          }));
          setSelectedPresetId(undefined);
        } catch (err) {
          setGeoError(err instanceof Error ? err.message : 'Unable to determine city.');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoError('Location permission denied. Enter your city manually below.');
        setGeoLoading(false);
      },
      { timeout: 8000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.city.trim()) return;
    await onApplyProfile(draft, selectedPresetId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#13221F]/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="bg-white border border-[#D8E2DF] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8E2DF]">
          <div>
            <h2 id="profile-modal-title" className="text-lg font-semibold text-[#13221F]">
              Location & Household Clean-Air Profile
            </h2>
            <p className="text-xs text-[#4A5C58] mt-0.5">
              VinterKlar queries live local winter smog advisories and tailors every recommendation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#4A5C58] hover:text-[#13221F] hover:bg-[#EDF2F0] transition-colors cursor-pointer"
            aria-label="Close location settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* City Input & Geolocation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="city-input" className="text-sm font-semibold text-[#13221F]">
                City or Urban Area
              </label>
              <button
                type="button"
                onClick={handleUseGeolocation}
                disabled={geoLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#175946] hover:text-[#124738] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {geoLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                Use current location
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#4A5C58] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="city-input"
                type="text"
                required
                value={draft.city}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, city: e.target.value }));
                  setSelectedPresetId(undefined);
                }}
                placeholder="e.g., Salt Lake City, UT or Kraków, Poland"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#175946]/25 focus:border-[#175946]"
              />
            </div>
            {geoError && <p className="text-xs text-[#B91C1C]">{geoError}</p>}

            {/* Quick Presets */}
            <div className="pt-1">
              <span className="block text-xs text-[#4A5C58] mb-2">
                Quick winter-smog city presets (or enter any city above):
              </span>
              <div className="flex flex-wrap gap-2">
                {CITY_PRESETS.map((preset) => {
                  const active = draft.city.toLowerCase() === preset.city.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => ({
                          ...prev,
                          city: preset.city,
                          regionContext: preset.regionContext,
                        }));
                        setSelectedPresetId(preset.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#175946] text-white border-[#175946]'
                          : 'bg-[#F7F9F8] text-[#13221F] border-[#D8E2DF] hover:bg-[#EDF2F0]'
                      }`}
                    >
                      {preset.city}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-[#D8E2DF] pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="heating-select" className="block text-xs font-semibold text-[#13221F] mb-1.5">
                Primary Home Heating
              </label>
              <select
                id="heating-select"
                value={draft.heatingType}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, heatingType: e.target.value as HeatingType }))
                }
                className="w-full px-3 py-2 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:border-[#175946]"
              >
                <option value="natural_gas">Natural gas furnace / boiler</option>
                <option value="wood_stove">Wood stove / fireplace / solid fuel</option>
                <option value="electric_heat_pump">Electric heat pump</option>
                <option value="district_heating">District heating</option>
              </select>
            </div>

            <div>
              <label htmlFor="commute-select" className="block text-xs font-semibold text-[#13221F] mb-1.5">
                Primary Daily Commute
              </label>
              <select
                id="commute-select"
                value={draft.commuteMode}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, commuteMode: e.target.value as CommuteMode }))
                }
                className="w-full px-3 py-2 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:border-[#175946]"
              >
                <option value="car_solo">Gas/diesel car (solo trips)</option>
                <option value="carpool">Family carpool</option>
                <option value="public_transit">Bus / light rail / metro</option>
                <option value="walk_bike">Walk or e-bike</option>
                <option value="remote">Mostly remote / home-based</option>
              </select>
            </div>

            <div>
              <label htmlFor="cooking-select" className="block text-xs font-semibold text-[#13221F] mb-1.5">
                Cooking Fuel
              </label>
              <select
                id="cooking-select"
                value={draft.cookingFuel}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, cookingFuel: e.target.value as CookingFuel }))
                }
                className="w-full px-3 py-2 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:border-[#175946]"
              >
                <option value="gas_stove">Gas range / open burner</option>
                <option value="electric_induction">Electric or induction</option>
              </select>
            </div>

            <div>
              <label htmlFor="purifier-select" className="block text-xs font-semibold text-[#13221F] mb-1.5">
                Current Indoor Filtration
              </label>
              <select
                id="purifier-select"
                value={draft.purifierSetup}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, purifierSetup: e.target.value as PurifierSetup }))
                }
                className="w-full px-3 py-2 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:border-[#175946]"
              >
                <option value="none">None currently running</option>
                <option value="hepa_portable">Portable HEPA purifier</option>
                <option value="diy_corsi_rosenthal">DIY Corsi-Rosenthal MERV-13 cube</option>
                <option value="central_merv13">Central HVAC MERV-13+</option>
              </select>
            </div>

            <div>
              <label htmlFor="size-input" className="block text-xs font-semibold text-[#13221F] mb-1.5">
                Household Size
              </label>
              <input
                id="size-input"
                type="number"
                min={1}
                max={12}
                value={draft.householdSize}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    householdSize: Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                  }))
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:border-[#175946]"
              />
            </div>

            <div>
              <label htmlFor="draft-select" className="block text-xs font-semibold text-[#13221F] mb-1.5">
                Building Envelope Seal
              </label>
              <select
                id="draft-select"
                value={draft.homeDraftiness}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    homeDraftiness: e.target.value as 'tight' | 'average' | 'drafty',
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg focus:outline-none focus:border-[#175946]"
              >
                <option value="tight">Well-sealed modern windows</option>
                <option value="average">Average urban apartment/home</option>
                <option value="drafty">Older windows / noticeable drafts</option>
              </select>
            </div>
          </div>

          <div className="border-t border-[#D8E2DF] pt-5">
            <span className="block text-xs font-semibold text-[#13221F] mb-2.5">
              Sensitive Household Members (adjusts exposure thresholds)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SENSITIVE_OPTIONS.map((opt) => {
                const checked = draft.sensitiveMembers.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#EDF2F0] border-[#175946] text-[#13221F]'
                        : 'bg-white border-[#D8E2DF] text-[#4A5C58] hover:bg-[#F7F9F8]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSensitive(opt.id)}
                      className="accent-[#175946] w-4 h-4 rounded"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D8E2DF]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#4A5C58] hover:text-[#13221F] rounded-lg hover:bg-[#EDF2F0] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !draft.city.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#175946] hover:bg-[#124738] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Analyzing Local Smog...' : 'Apply & Generate Local Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
