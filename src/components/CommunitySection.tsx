import { useState } from 'react';
import { Copy, Check, Printer, Users, Download } from 'lucide-react';
import type { ImpactCalculationResult, LocalAirBrief } from '../types';

interface CommunitySectionProps {
  communityHouseholds: number;
  onChangeCommunityHouseholds: (count: number) => void;
  impact: ImpactCalculationResult;
  airBrief: LocalAirBrief;
  activeInterventionsCount: number;
}

const SCALE_OPTIONS = [
  { count: 1, label: '1 Household (Your Home)' },
  { count: 10, label: '10 Households (Block)' },
  { count: 50, label: '50 Households (School)' },
  { count: 250, label: '250 Households (District)' },
];

export function buildImpactSummaryText(
  airBrief: LocalAirBrief,
  impact: ImpactCalculationResult,
  activeInterventionsCount: number,
  communityHouseholds: number,
): string {
  return [
    `VinterKlar Clean-Air Action Plan — ${airBrief.city}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    `Local Advisory: AQI ${airBrief.estimatedAqi} (${airBrief.severityLevel}) · Peak Inversion: ${airBrief.inversionWindow}`,
    `Best Afternoon Ventilation Window: ${airBrief.bestVentilationWindow}`,
    ``,
    `--------------------------------------------------`,
    `OUR HOUSEHOLD COMMITMENT (${activeInterventionsCount} active interventions):`,
    `--------------------------------------------------`,
    `- Baseline Indoor PM2.5: ${impact.baselineIndoorPm25} ug/m3`,
    `- Mitigated Indoor PM2.5: ${impact.mitigatedIndoorPm25} ug/m3 (-${impact.indoorDropPct}% reduction)`,
    `- Daily Inhaled Dose: ${impact.mitigatedDailyInhaledUg} ug/day (down from ${impact.baselineDailyInhaledUg} ug)`,
    `- Weekly PM2.5 Avoided: ${impact.weeklyPm25AvoidedGrams} g`,
    `- Weekly Smog NOx Avoided: ${impact.weeklyNoxAvoidedGrams} g`,
    `- Weekly Carbon Avoided: ${impact.weeklyCo2AvoidedKg} kg CO2e`,
    ``,
    `--------------------------------------------------`,
    `COMMUNITY MULTIPLIER (${communityHouseholds} Households over 90 Winter Days):`,
    `--------------------------------------------------`,
    `- Total Fine PM2.5 Kept Out of Airshed: ${impact.communitySeasonalPm25AvoidedKg} kg`,
    `- Equivalent Cold-Start Winter Car Trips Removed: ${impact.equivalentCarTripsRemoved.toLocaleString()}`,
    `- Community Greenhouse Gas Avoided: ${impact.communitySeasonalCo2AvoidedTonnes} tonnes CO2e`,
    ``,
    `Generated with VinterKlar — Winter Smog & Urban Clean-Air Assistant`,
  ].join('\n');
}

export function CommunitySection({
  communityHouseholds,
  onChangeCommunityHouseholds,
  impact,
  airBrief,
  activeInterventionsCount,
}: CommunitySectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPledge = async () => {
    const summaryText = buildImpactSummaryText(
      airBrief,
      impact,
      activeInterventionsCount,
      communityHouseholds,
    );
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard permissions may be unavailable in restricted frames
    }
  };

  const handleDownloadSummary = () => {
    const summaryText = buildImpactSummaryText(
      airBrief,
      impact,
      activeInterventionsCount,
      communityHouseholds,
    );
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VinterKlar_Impact_Summary_${airBrief.city.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="community"
      className="py-14 border-t border-[#D8E2DF]"
      aria-labelledby="community-heading"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#175946] tracking-wide mb-1.5">
            Community Multiplier · {airBrief.city}
          </p>
          <h2
            id="community-heading"
            className="text-2xl sm:text-3xl font-bold text-[#13221F] tracking-tight"
          >
            Scale clean-air routines across your block, school, or neighborhood
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleCopyPledge}
            aria-live="polite"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#175946] hover:bg-[#124738] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied Action Summary' : 'Copy Community Pledge'}
          </button>
          <button
            type="button"
            onClick={handleDownloadSummary}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#13221F] bg-white border border-[#D8E2DF] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#175946]" aria-hidden="true" />
            Download Summary (.txt)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#13221F] bg-white border border-[#D8E2DF] hover:bg-[#EDF2F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-[#4A5C58]" aria-hidden="true" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Neighborhood Scale Selector */}
      <div className="bg-white border border-[#D8E2DF] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D8E2DF]">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-[#175946]" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-[#13221F]">
                Simulate Collective Neighborhood Adoption
              </h3>
              <p className="text-xs text-[#4A5C58]">
                Multiply your active calculator commitments across participating families for a
                90-day winter smog season.
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Neighborhood household scale"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#EDF2F0] rounded-lg shrink-0"
          >
            {SCALE_OPTIONS.map((opt) => {
              const active = communityHouseholds === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChangeCommunityHouseholds(opt.count)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#13221F] shadow-sm'
                      : 'text-[#4A5C58] hover:text-[#13221F]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div aria-live="polite" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div>
            <span className="block text-xs text-[#4A5C58]">
              Fine PM2.5 Kept Out of Local Airshed
            </span>
            <div className="mt-1.5 font-mono tabular-nums">
              <span className="text-3xl font-bold text-[#175946]">
                {impact.communitySeasonalPm25AvoidedKg}
              </span>
              <span className="text-sm text-[#4A5C58] ml-1.5">kg PM2.5</span>
            </div>
            <p className="text-xs text-[#4A5C58] mt-1">
              Across {communityHouseholds}{' '}
              {communityHouseholds === 1 ? 'household' : 'households'} over 13 winter weeks
            </p>
          </div>

          <div>
            <span className="block text-xs text-[#4A5C58]">
              Equivalent Cold-Start Car Trips Removed
            </span>
            <div className="mt-1.5 font-mono tabular-nums">
              <span className="text-3xl font-bold text-[#13221F]">
                {impact.equivalentCarTripsRemoved.toLocaleString()}
              </span>
              <span className="text-sm text-[#4A5C58] ml-1.5">trips</span>
            </div>
            <p className="text-xs text-[#4A5C58] mt-1">
              Based on 10 km urban cold-start winter driving emission equivalent
            </p>
          </div>

          <div>
            <span className="block text-xs text-[#4A5C58]">
              Community Greenhouse Gas Reduction
            </span>
            <div className="mt-1.5 font-mono tabular-nums">
              <span className="text-3xl font-bold text-[#13221F]">
                {impact.communitySeasonalCo2AvoidedTonnes}
              </span>
              <span className="text-sm text-[#4A5C58] ml-1.5">tonnes CO2e</span>
            </div>
            <p className="text-xs text-[#4A5C58] mt-1">
              Combined mobility, clean cooking, and thermal setback savings
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
