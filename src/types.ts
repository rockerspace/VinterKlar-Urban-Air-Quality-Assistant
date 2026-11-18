export type HeatingType =
  | 'natural_gas'
  | 'wood_stove'
  | 'electric_heat_pump'
  | 'district_heating';

export type CommuteMode =
  | 'car_solo'
  | 'carpool'
  | 'public_transit'
  | 'walk_bike'
  | 'remote';

export type CookingFuel = 'gas_stove' | 'electric_induction';

export type PurifierSetup =
  | 'none'
  | 'hepa_portable'
  | 'diy_corsi_rosenthal'
  | 'central_merv13';

export type SensitiveMember = 'young_children' | 'asthma_respiratory' | 'older_adults' | 'pregnant';

export interface HouseholdProfile {
  city: string;
  regionContext: string;
  householdSize: number;
  sensitiveMembers: SensitiveMember[];
  heatingType: HeatingType;
  commuteMode: CommuteMode;
  cookingFuel: CookingFuel;
  purifierSetup: PurifierSetup;
  homeDraftiness: 'tight' | 'average' | 'drafty';
}

export type SmogSeverity = 'Nominal' | 'Moderate' | 'Unhealthy' | 'Severe';

export interface GroundingCitation {
  title: string;
  url: string;
}

export interface LocalAirBrief {
  city: string;
  estimatedAqi: number;
  pm25UgM3: number;
  severityLevel: SmogSeverity;
  inversionWindow: string;
  bestVentilationWindow: string;
  primaryPollutants: string;
  advisorySummary: string;
  localTriggers: string[];
  citations: GroundingCitation[];
  fetchedAt: string;
  isLiveGrounded: boolean;
}

export type PlaybookCategory = 'daily_routine' | 'indoor_hack' | 'sustainable_swap';

export interface ActionRecommendation {
  id: string;
  category: PlaybookCategory;
  title: string;
  timingOrCadence: string;
  effortLevel: 'Zero Cost' | 'Low Cost' | 'Habit Shift' | 'Upgrade';
  summary: string;
  howToSteps: string[];
  directImpactExplanation: string;
  estimatedPm25ExposureDropPct: number;
  estimatedWeeklyPm25AvoidedGrams: number;
  estimatedWeeklyCo2AvoidedKg: number;
}

export interface TailoredPlaybook {
  city: string;
  generatedAt: string;
  headlineInsight: string;
  recommendations: ActionRecommendation[];
}

export interface ImpactBaselineInputs {
  outdoorPm25UgM3: number;
  dailyCarKm: number;
  heatingHoursPerDay: number;
  woodBurnHoursPerWeek: number;
  gasCookingMinutesPerDay: number;
}

export interface InterventionOption {
  id: string;
  category: PlaybookCategory;
  label: string;
  shortMechanism: string;
  directImpactNote: string;
}

export interface ImpactCalculationResult {
  baselineIndoorPm25: number;
  mitigatedIndoorPm25: number;
  indoorDropPct: number;
  baselineDailyInhaledUg: number;
  mitigatedDailyInhaledUg: number;
  inhaledDoseDropPct: number;
  cigaretteEquivBefore: number;
  cigaretteEquivAfter: number;
  weeklyPm25AvoidedGrams: number;
  weeklyNoxAvoidedGrams: number;
  weeklyCo2AvoidedKg: number;
  seasonalPm25AvoidedKg: number;
  seasonalNoxAvoidedKg: number;
  seasonalCo2AvoidedKg: number;
  communitySeasonalPm25AvoidedKg: number;
  communitySeasonalCo2AvoidedTonnes: number;
  equivalentCarTripsRemoved: number;
  sourceBreakdown: {
    label: string;
    baselineSharePct: number;
    avoidedGramsPm25: number;
  }[];
}

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
