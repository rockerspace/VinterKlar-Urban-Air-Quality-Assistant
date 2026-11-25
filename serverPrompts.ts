import { Type } from '@google/genai';
import type {
  SanitizedAirBriefContext,
  SanitizedHouseholdContext,
  ValidatedCityInput,
} from './serverHelpers.ts';

export interface SanitizedImpactSummary {
  baselineIndoorPm25: number | null;
  mitigatedIndoorPm25: number | null;
  indoorDropPct: number;
  weeklyPm25AvoidedGrams: number;
}

export function buildAirBriefPrompt(input: ValidatedCityInput): string {
  return `Look up the latest current or typical winter air quality, PM2.5 levels, AQI, thermal inversion or winter smog advisories, and primary local pollution drivers for "${input.city}"${input.regionContext ? ` (${input.regionContext})` : ''}.

Respond ONLY with a valid JSON object inside \`\`\`json ... \`\`\` fences matching this exact schema:
{
  "city": "Normalized City, Region/Country",
  "estimatedAqi": number (0-500 integer reflecting current or winter smog episode conditions),
  "pm25UgM3": number (one decimal place in ug/m3),
  "severityLevel": "Nominal" | "Moderate" | "Unhealthy" | "Severe",
  "inversionWindow": "string describing typical peak smog/inversion hours e.g. 06:00 - 11:00 & 18:00 - 22:00",
  "bestVentilationWindow": "string describing safest afternoon airing/outdoor window",
  "primaryPollutants": "comma-separated primary local pollutants (e.g. PM2.5, woodsmoke, vehicle NOx)",
  "advisorySummary": "2 concise plain-English sentences explaining today's local smog situation and immediate family priority",
  "localTriggers": ["3 short specific local pollution triggers for this city"]
}`;
}

export function buildPlaybookPrompt(
  profile: SanitizedHouseholdContext,
  airBrief: SanitizedAirBriefContext,
): string {
  const sensitive =
    profile.sensitiveMembers.length > 0 ? profile.sensitiveMembers.join(', ') : 'general family';

  return `Create a tailored winter smog action playbook for this household:
- City: ${profile.city} (${profile.regionContext})
- Local Air Brief: AQI ${airBrief.estimatedAqi ?? 'N/A'}, PM2.5 ${airBrief.pm25UgM3 ?? 'N/A'} ug/m3 (${airBrief.severityLevel}), Inversion window: ${airBrief.inversionWindow}, Best outdoor/ventilation window: ${airBrief.bestVentilationWindow}, Primary pollutants: ${airBrief.primaryPollutants}
- Household size: ${profile.householdSize} people
- Sensitive members: ${sensitive}
- Heating type: ${profile.heatingType}
- Primary commute: ${profile.commuteMode}
- Cooking fuel: ${profile.cookingFuel}
- Indoor air purifier setup: ${profile.purifierSetup}
- Home envelope: ${profile.homeDraftiness}

Generate exactly 6 high-impact, realistic recommendations (2 with category "daily_routine", 2 with category "indoor_hack", 2 with category "sustainable_swap") tailored specifically to their city, heating, commute, cooking fuel, and purifier setup.
Every recommendation MUST clearly explain the direct physical/health/emissions impact of the choice in plain, accurate science.`;
}

export function buildAdvisorSystemInstruction(
  profile: SanitizedHouseholdContext,
  airBrief: SanitizedAirBriefContext,
  impact: SanitizedImpactSummary,
): string {
  const sensitive =
    profile.sensitiveMembers.length > 0 ? profile.sensitiveMembers.join(', ') : 'none specified';

  return `You are the VinterKlar Clean-Air Family & Community Advisor.
Current Context:
- Location: ${profile.city} (AQI ${airBrief.estimatedAqi ?? 'N/A'}, PM2.5 ${airBrief.pm25UgM3 ?? 'N/A'} µg/m³, Severity: ${airBrief.severityLevel})
- Inversion Window: ${airBrief.inversionWindow} | Best Ventilation Window: ${airBrief.bestVentilationWindow}
- Household: ${profile.householdSize} people, sensitive members: ${sensitive}
- Home Setup: heating=${profile.heatingType}, commute=${profile.commuteMode}, cooking=${profile.cookingFuel}, purifier=${profile.purifierSetup}, envelope=${profile.homeDraftiness}
- Active Impact Calculator Results: Indoor PM2.5 drops from ${impact.baselineIndoorPm25 ?? '?'} to ${impact.mitigatedIndoorPm25 ?? '?'} µg/m³ (-${impact.indoorDropPct}%), Weekly PM2.5 avoided: ${impact.weeklyPm25AvoidedGrams} g.

Guidelines:
- Give concise, practical, science-backed guidance tailored to this exact family and city.
- Always explain the direct impact of recommended actions (both personal exposure reduction and community emission reduction).
- Keep formatting clean with short paragraphs or concise bullet points.`;
}

export const RESOLVE_CITY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    city: { type: Type.STRING, description: 'City, State or Country' },
    regionContext: { type: Type.STRING, description: 'Brief winter topography context' },
  },
  required: ['city', 'regionContext'],
};

export const PLAYBOOK_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headlineInsight: {
      type: Type.STRING,
      description:
        'A crisp 1-2 sentence synthesis of the highest-leverage choice for this specific family.',
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: 'Must be one of: daily_routine, indoor_hack, sustainable_swap',
          },
          title: { type: Type.STRING },
          timingOrCadence: { type: Type.STRING },
          effortLevel: {
            type: Type.STRING,
            description: 'Must be one of: Zero Cost, Low Cost, Habit Shift, Upgrade',
          },
          summary: { type: Type.STRING },
          howToSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          directImpactExplanation: {
            type: Type.STRING,
            description: 'Clear explanation of how and why this lowers exposure or emissions directly.',
          },
          estimatedPm25ExposureDropPct: { type: Type.NUMBER },
          estimatedWeeklyPm25AvoidedGrams: { type: Type.NUMBER },
          estimatedWeeklyCo2AvoidedKg: { type: Type.NUMBER },
        },
        required: [
          'id',
          'category',
          'title',
          'timingOrCadence',
          'effortLevel',
          'summary',
          'howToSteps',
          'directImpactExplanation',
          'estimatedPm25ExposureDropPct',
          'estimatedWeeklyPm25AvoidedGrams',
          'estimatedWeeklyCo2AvoidedKg',
        ],
      },
    },
  },
  required: ['headlineInsight', 'recommendations'],
};
