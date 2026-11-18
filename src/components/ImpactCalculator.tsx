import { useState } from 'react';
import { SlidersHorizontal, Info, RotateCcw, Check } from 'lucide-react';
import type {
  ImpactBaselineInputs,
  ImpactCalculationResult,
  PlaybookCategory,
} from '../types';
import { CALCULATOR_INTERVENTIONS } from '../data/cleanAirData';

interface ImpactCalculatorProps {
  baseline: ImpactBaselineInputs;
  onChangeBaseline: (next: ImpactBaselineInputs) => void;
  activeInterventions: string[];
  onToggleIntervention: (id: string) => void;
  onResetDefaults: () => void;
  impact: ImpactCalculationResult;
  cityName: string;
}

const CATEGORY_LABELS: Record<PlaybookCategory, string> = {
  indoor_hack: 'Indoor Air Quality',
  daily_routine: 'Daily Routine',
  sustainable_swap: 'Sustainable Swap',
};

export function ImpactCalculator({
  baseline,
  onChangeBaseline,
  activeInterventions,
  onToggleIntervention,
  onResetDefaults,
  impact,
  cityName,
}: ImpactCalculatorProps) {
  const [showMethodology, setShowMethodology] = useState(false);
  const activeSet = new Set(activeInterventions);

  const baselineBarWidth = 100;
  const mitigatedBarWidth =
    impact.baselineIndoorPm25 > 0
      ? Math.max(8, Math.round((impact.mitigatedIndoorPm25 / impact.baselineIndoorPm25) * 100))
      : 100;

  return (
    <section
      id="impact-calculator"
      className="py-14 border-t border-[#D8E2DF]"
      aria-labelledby="calculator-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#175946] tracking-wide mb-1.5">
            Direct Impact Calculator · {cityName}
          </p>
          <h2
            id="calculator-heading"
            className="text-2xl sm:text-3xl font-bold text-[#13221F] tracking-tight"
          >
            Measure how your daily choices lower exposure and neighborhood emissions
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowMethodology((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#13221F] bg-white border border-[#D8E2DF] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5 text-[#175946]" />
            {showMethodology ? 'Hide Physics Math' : 'Explain Calculation Math'}
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#4A5C58] hover:text-[#13221F] bg-white border border-[#D8E2DF] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      {showMethodology && (
        <div className="mb-8 bg-[#EDF2F0] border border-[#D8E2DF] rounded-xl p-5 text-sm text-[#13221F] grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <h3 className="font-semibold mb-1">1. Indoor PM2.5 Physics</h3>
            <p className="text-xs text-[#4A5C58] leading-relaxed">
              Indoor concentration tracks outdoor winter smog via an infiltration factor (I/O = 0.62
              baseline, 0.51 sealed), reduced by clean-air filtration efficiency (MERV-13 cube ~52%
              steady-state drop) plus indoor gas cooking particulate load.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">2. Inhaled Dose & Equivalency</h3>
            <p className="text-xs text-[#4A5C58] leading-relaxed">
              Combines 20 hours indoor breathing (11.5 m³) and 4 hours outdoor/commute air (3.0 m³).
              Uses the Berkeley Earth reference of ~22 µg/m³ 24-hour PM2.5 equal to 1 cigarette/day
              for intuitive risk clarity.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">3. Direct Tailpipe & Hearth Factors</h3>
            <p className="text-xs text-[#4A5C58] leading-relaxed">
              Winter cold-start driving emits ~0.038 g PM2.5/km and 0.45 g NOx/km; residential wood
              burning emits ~18.5 g PM2.5/hr. Skipping 1 hour of wood fire prevents more soot than
              avoiding 480 km of passenger car travel.
            </p>
          </div>
        </div>
      )}

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Sliders + Intervention Toggles */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-[#D8E2DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#175946]" />
                <h3 className="text-base font-semibold text-[#13221F]">
                  Household Baseline Conditions
                </h3>
              </div>
              <span className="text-xs text-[#4A5C58]">Adjust to match your week</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-pm25" className="font-medium text-[#13221F]">
                    Outdoor Winter PM2.5 Concentration
                  </label>
                  <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                    {baseline.outdoorPm25UgM3} µg/m³
                  </span>
                </div>
                <input
                  id="slider-pm25"
                  type="range"
                  min={10}
                  max={220}
                  step={2}
                  value={baseline.outdoorPm25UgM3}
                  onChange={(e) =>
                    onChangeBaseline({ ...baseline, outdoorPm25UgM3: Number(e.target.value) })
                  }
                  className="w-full nordic-slider"
                />
                <div className="flex justify-between text-[11px] text-[#4A5C58] mt-1 font-mono tabular-nums">
                  <span>10 (Clean)</span>
                  <span>55 (Unhealthy)</span>
                  <span>220 (Severe Smog)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-car" className="font-medium text-[#13221F]">
                    Daily Household Driving (Cold-Start Urban Trips)
                  </label>
                  <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                    {baseline.dailyCarKm} km/day
                  </span>
                </div>
                <input
                  id="slider-car"
                  type="range"
                  min={0}
                  max={80}
                  step={2}
                  value={baseline.dailyCarKm}
                  onChange={(e) =>
                    onChangeBaseline({ ...baseline, dailyCarKm: Number(e.target.value) })
                  }
                  className="w-full nordic-slider"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-wood" className="font-medium text-[#13221F]">
                    Wood Stove or Fireplace Usage
                  </label>
                  <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                    {baseline.woodBurnHoursPerWeek} hrs/week
                  </span>
                </div>
                <input
                  id="slider-wood"
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={baseline.woodBurnHoursPerWeek}
                  onChange={(e) =>
                    onChangeBaseline({ ...baseline, woodBurnHoursPerWeek: Number(e.target.value) })
                  }
                  className="w-full nordic-slider"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-cooking" className="font-medium text-[#13221F]">
                    Daily Unvented Gas Stove Cooking
                  </label>
                  <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                    {baseline.gasCookingMinutesPerDay} min/day
                  </span>
                </div>
                <input
                  id="slider-cooking"
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={baseline.gasCookingMinutesPerDay}
                  onChange={(e) =>
                    onChangeBaseline({
                      ...baseline,
                      gasCookingMinutesPerDay: Number(e.target.value),
                    })
                  }
                  className="w-full nordic-slider"
                />
              </div>
            </div>
          </div>

          {/* Toggleable Actions */}
          <div className="bg-white border border-[#D8E2DF] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#13221F]">
                Select Family Choices & Protections
              </h3>
              <span className="text-xs font-mono tabular-nums text-[#175946] font-medium">
                {activeInterventions.length} / {CALCULATOR_INTERVENTIONS.length} active
              </span>
            </div>
            <div className="divide-y divide-[#D8E2DF]">
              {CALCULATOR_INTERVENTIONS.map((item) => {
                const isChecked = activeSet.has(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-1 cursor-pointer group"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => onToggleIntervention(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#175946] border-[#175946] text-white'
                          : 'bg-white border-[#B9C9C4] group-hover:border-[#175946]'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                    </button>
                    <div
                      className="flex-1 min-w-0"
                      onClick={(e) => {
                        e.preventDefault();
                        onToggleIntervention(item.id);
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-[#13221F]">{item.label}</span>
                        <span className="text-xs text-[#4A5C58]">
                          · {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A5C58] mt-0.5">
                        {item.shortMechanism} — {item.directImpactNote}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Zone: Live Impact Readout & Direct Explanations */}
        <div className="lg:col-span-6 space-y-6">
          {/* Primary Exposure Comparison Card */}
          <div className="bg-white border border-[#D8E2DF] rounded-xl p-6">
            <div className="flex items-baseline justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-[#13221F]">
                  Personal & Family Exposure Impact
                </h3>
                <p className="text-xs text-[#4A5C58] mt-0.5">
                  24-hour indoor concentration and daily inhaled PM2.5 per household member
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono tabular-nums text-2xl font-bold text-[#175946]">
                  -{impact.inhaledDoseDropPct}%
                </span>
                <span className="block text-[11px] text-[#4A5C58]">Inhaled dose drop</span>
              </div>
            </div>

            {/* Visual Before / After Bar */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#4A5C58]">Unmitigated Indoor Air (Baseline)</span>
                  <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                    {impact.baselineIndoorPm25} µg/m³
                  </span>
                </div>
                <div className="w-full h-3 bg-[#EDF2F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B45309] rounded-full transition-transform duration-200 origin-left"
                    style={{ width: `${baselineBarWidth}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#13221F]">
                    With Your Active Clean-Air Choices
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-[#175946]">
                    {impact.mitigatedIndoorPm25} µg/m³ (-{impact.indoorDropPct}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#EDF2F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#175946] rounded-full transition-all duration-200"
                    style={{ width: `${mitigatedBarWidth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3-Column Tabular Readouts */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#D8E2DF]">
              <div>
                <span className="block text-xs text-[#4A5C58]">Daily Inhaled PM2.5</span>
                <div className="mt-1 font-mono tabular-nums">
                  <span className="text-lg font-bold text-[#13221F]">
                    {impact.mitigatedDailyInhaledUg}
                  </span>
                  <span className="text-xs text-[#4A5C58] ml-1">µg/day</span>
                </div>
                <span className="text-[11px] text-[#4A5C58] font-mono tabular-nums">
                  Down from {impact.baselineDailyInhaledUg} µg
                </span>
              </div>

              <div>
                <span className="block text-xs text-[#4A5C58]">Cigarette Equiv.</span>
                <div className="mt-1 font-mono tabular-nums">
                  <span className="text-lg font-bold text-[#13221F]">
                    {impact.cigaretteEquivAfter}
                  </span>
                  <span className="text-xs text-[#4A5C58] ml-1">/day</span>
                </div>
                <span className="text-[11px] text-[#4A5C58] font-mono tabular-nums">
                  Down from {impact.cigaretteEquivBefore}/day
                </span>
              </div>

              <div>
                <span className="block text-xs text-[#4A5C58]">WHO 24h Guideline</span>
                <div className="mt-1 font-mono tabular-nums">
                  <span className="text-lg font-bold text-[#13221F]">15.0</span>
                  <span className="text-xs text-[#4A5C58] ml-1">µg/m³</span>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    impact.mitigatedIndoorPm25 <= 15 ? 'text-[#15803D]' : 'text-[#B45309]'
                  }`}
                >
                  {impact.mitigatedIndoorPm25 <= 15
                    ? 'Within WHO safe zone'
                    : 'Above target — add HEPA'}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Emissions Avoided Card */}
          <div className="bg-white border border-[#D8E2DF] rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#13221F]">
                  Direct Neighborhood Emissions Avoided
                </h3>
                <p className="text-xs text-[#4A5C58] mt-0.5">
                  Pollutants prevented from entering your local winter inversion layer
                </p>
              </div>
              <span className="text-xs font-mono text-[#4A5C58]">90-day winter</span>
            </div>

            <div className="grid grid-cols-3 gap-4 pb-5 border-b border-[#D8E2DF]">
              <div>
                <span className="block text-xs text-[#4A5C58]">Fine PM2.5 Avoided</span>
                <div className="mt-1 font-mono tabular-nums">
                  <span className="text-xl font-bold text-[#175946]">
                    {impact.weeklyPm25AvoidedGrams}
                  </span>
                  <span className="text-xs text-[#4A5C58] ml-1">g/wk</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#4A5C58]">
                  {impact.seasonalPm25AvoidedKg} kg / winter
                </span>
              </div>

              <div>
                <span className="block text-xs text-[#4A5C58]">Smog NOx Avoided</span>
                <div className="mt-1 font-mono tabular-nums">
                  <span className="text-xl font-bold text-[#13221F]">
                    {impact.weeklyNoxAvoidedGrams}
                  </span>
                  <span className="text-xs text-[#4A5C58] ml-1">g/wk</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#4A5C58]">
                  {impact.seasonalNoxAvoidedKg} kg / winter
                </span>
              </div>

              <div>
                <span className="block text-xs text-[#4A5C58]">Carbon Footprint</span>
                <div className="mt-1 font-mono tabular-nums">
                  <span className="text-xl font-bold text-[#13221F]">
                    {impact.weeklyCo2AvoidedKg}
                  </span>
                  <span className="text-xs text-[#4A5C58] ml-1">kg/wk</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#4A5C58]">
                  {impact.seasonalCo2AvoidedKg} kg CO2e / winter
                </span>
              </div>
            </div>

            {/* Source Attribution */}
            <div className="pt-5 space-y-3">
              <h4 className="text-xs font-semibold text-[#13221F]">
                Where Your Avoided PM2.5 Emissions Come From
              </h4>
              {impact.sourceBreakdown.map((src) => (
                <div key={src.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#4A5C58]">
                      {src.label} ({src.baselineSharePct}% of local household baseline)
                    </span>
                    <span className="font-mono tabular-nums font-medium text-[#13221F]">
                      {src.avoidedGramsPm25} g/wk avoided
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#EDF2F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#175946] rounded-full transition-all duration-200"
                      style={{
                        width: `${
                          impact.weeklyPm25AvoidedGrams > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (src.avoidedGramsPm25 / impact.weeklyPm25AvoidedGrams) * 100,
                                ),
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Plain-English Impact Explanation */}
          <div className="bg-[#EDF2F0] border border-[#D8E2DF] rounded-xl p-5">
            <h4 className="text-sm font-semibold text-[#13221F] mb-1.5">
              Why These Numbers Matter for Your Household
            </h4>
            <p className="text-sm text-[#4A5C58] leading-relaxed">
              At <span className="font-mono text-[#13221F]">{baseline.outdoorPm25UgM3} µg/m³</span>{' '}
              outdoor smog, an unprotected home still reaches{' '}
              <span className="font-mono text-[#13221F]">{impact.baselineIndoorPm25} µg/m³</span>{' '}
              indoors. Your active choices drop indoor air to{' '}
              <span className="font-mono text-[#175946] font-semibold">
                {impact.mitigatedIndoorPm25} µg/m³
              </span>
              , sparing each family member{' '}
              <span className="font-mono text-[#13221F]">
                {impact.baselineDailyInhaledUg - impact.mitigatedDailyInhaledUg} µg
              </span>{' '}
              of lung-penetrating particulates daily while preventing{' '}
              <span className="font-mono text-[#13221F]">{impact.seasonalPm25AvoidedKg} kg</span> of
              direct winter PM2.5 emissions across the season.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
