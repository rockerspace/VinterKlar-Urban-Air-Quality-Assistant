import type {
  HouseholdProfile,
  ImpactBaselineInputs,
  ImpactCalculationResult,
  InterventionOption,
  LocalAirBrief,
  TailoredPlaybook,
} from '../types';

export interface CityPreset {
  id: string;
  city: string;
  regionContext: string;
  brief: LocalAirBrief;
  defaultBaseline: ImpactBaselineInputs;
}

export const DEFAULT_HOUSEHOLD_PROFILE: HouseholdProfile = {
  city: 'Salt Lake City, UT',
  regionContext: 'Wasatch Front valley basin with cold-air thermal inversions',
  householdSize: 4,
  sensitiveMembers: ['young_children', 'asthma_respiratory'],
  heatingType: 'natural_gas',
  commuteMode: 'car_solo',
  cookingFuel: 'gas_stove',
  purifierSetup: 'none',
  homeDraftiness: 'average',
};

export const CITY_PRESETS: CityPreset[] = [
  {
    id: 'slc',
    city: 'Salt Lake City, UT',
    regionContext: 'Wasatch Front mountain valley subject to multi-day winter thermal inversions',
    brief: {
      city: 'Salt Lake City, UT',
      estimatedAqi: 138,
      pm25UgM3: 50.4,
      severityLevel: 'Unhealthy',
      inversionWindow: '06:00 – 11:30 & 17:30 – 22:00',
      bestVentilationWindow: '13:00 – 15:30 (afternoon valley mixing)',
      primaryPollutants: 'Secondary ammonium nitrate PM2.5, woodsmoke, cold-start NOx',
      advisorySummary:
        'A cold high-pressure cap traps vehicle and heating emissions against the Wasatch foothills overnight. Sensitive groups should move outdoor play to early afternoon and restrict solid-fuel burning.',
      localTriggers: [
        'Overnight valley cold pool trapping tailpipe NOx and secondary PM2.5',
        'Morning cold-start school drop-off queues spiking street-level particulates',
        'Evening recreational wood-burning adding fine smoke particles',
      ],
      citations: [],
      fetchedAt: 'Preset reference profile',
      isLiveGrounded: false,
    },
    defaultBaseline: {
      outdoorPm25UgM3: 50,
      dailyCarKm: 28,
      heatingHoursPerDay: 11,
      woodBurnHoursPerWeek: 4,
      gasCookingMinutesPerDay: 45,
    },
  },
  {
    id: 'delhi',
    city: 'New Delhi, India',
    regionContext: 'Indo-Gangetic winter boundary layer inversion with biomass & traffic haze',
    brief: {
      city: 'New Delhi, India',
      estimatedAqi: 284,
      pm25UgM3: 142.0,
      severityLevel: 'Severe',
      inversionWindow: '19:00 – 11:00 overnight boundary compression',
      bestVentilationWindow: '13:30 – 16:00 (brief solar mixing dip)',
      primaryPollutants: 'PM2.5, black carbon, road dust, NO2',
      advisorySummary:
        'Shallow winter mixing heights keep PM2.5 elevated through morning hours. Prioritize continuous indoor filtration, sealed door thresholds, and N95/KF94 respirators for outdoor transit.',
      localTriggers: [
        'Low wind speeds and cool night air compressing urban emissions below 200m',
        'Two-wheeler and diesel traffic congestion during morning commute peaks',
        'Unsealed window frames allowing rapid indoor-outdoor particulate infiltration',
      ],
      citations: [],
      fetchedAt: 'Preset reference profile',
      isLiveGrounded: false,
    },
    defaultBaseline: {
      outdoorPm25UgM3: 142,
      dailyCarKm: 22,
      heatingHoursPerDay: 5,
      woodBurnHoursPerWeek: 0,
      gasCookingMinutesPerDay: 65,
    },
  },
  {
    id: 'krakow',
    city: 'Kraków, Poland',
    regionContext: 'Vistula river basin with regional solid-fuel heating and winter fog',
    brief: {
      city: 'Kraków, Poland',
      estimatedAqi: 154,
      pm25UgM3: 61.5,
      severityLevel: 'Unhealthy',
      inversionWindow: '16:30 – 10:30 nocturnal river mist',
      bestVentilationWindow: '12:00 – 15:00 (midday wind shift)',
      primaryPollutants: 'PM2.5, benzo[a]pyrene, winter heating smoke, NOx',
      advisorySummary:
        'Humid river-basin mist combines with surrounding municipal solid-fuel heating smoke after dusk. Close trickle vents before 16:00 and run MERV-13/HEPA filtration in bedrooms.',
      localTriggers: [
        'Regional residential heating plumes drifting into the Vistula valley',
        'High relative humidity accelerating secondary particulate growth',
        'Evening pedestrian commutes during peak heating ignition hours',
      ],
      citations: [],
      fetchedAt: 'Preset reference profile',
      isLiveGrounded: false,
    },
    defaultBaseline: {
      outdoorPm25UgM3: 62,
      dailyCarKm: 18,
      heatingHoursPerDay: 14,
      woodBurnHoursPerWeek: 6,
      gasCookingMinutesPerDay: 40,
    },
  },
  {
    id: 'oslo',
    city: 'Oslo, Norway',
    regionContext: 'Fjord-rimmed basin with sub-zero woodstove emissions and studded-tire dust',
    brief: {
      city: 'Oslo, Norway',
      estimatedAqi: 92,
      pm25UgM3: 31.2,
      severityLevel: 'Moderate',
      inversionWindow: '07:00 – 10:00 & 17:00 – 21:00',
      bestVentilationWindow: '11:30 – 15:00 (fjord breeze clearing)',
      primaryPollutants: 'Residential woodsmoke PM2.5, road abrasion PM10, NO2',
      advisorySummary:
        'Cold fjord inversions concentrate evening woodstove smoke and winter road particulates along major corridors. Combine heat-pump base heating with electric transit swaps.',
      localTriggers: [
        'Sub-zero cold snaps increasing residential fireplace lighting',
        'Studded tire road wear resuspending fine mineral dust on dry frost days',
        'Diesel cold-starts in uphill neighborhood streets',
      ],
      citations: [],
      fetchedAt: 'Preset reference profile',
      isLiveGrounded: false,
    },
    defaultBaseline: {
      outdoorPm25UgM3: 31,
      dailyCarKm: 16,
      heatingHoursPerDay: 15,
      woodBurnHoursPerWeek: 7,
      gasCookingMinutesPerDay: 25,
    },
  },
];

export const INITIAL_PLAYBOOK: TailoredPlaybook = {
  city: 'Salt Lake City, UT',
  generatedAt: 'Baseline Reference Plan',
  headlineInsight:
    'In a valley winter inversion at ~50 µg/m³ PM2.5, sealing indoor infiltration and eliminating morning cold-start car trips cuts your family’s inhaled dose by over half while preventing 130+ grams of direct emissions each week.',
  recommendations: [
    {
      id: 'routine-midday-shift',
      category: 'daily_routine',
      title: 'Shift Outdoor Play & Errands to the 13:00–15:30 Mixing Window',
      timingOrCadence: 'Daily · 13:00 – 15:30',
      effortLevel: 'Zero Cost',
      summary:
        'Move stroller walks, youth sports warm-ups, and dog walks out of the 07:00–10:30 morning cap into early afternoon solar mixing.',
      howToSteps: [
        'Keep children indoors for morning recess or commute inside sealed transit when inversion haze peaks.',
        'Consolidate errands into a single warm-engine midday loop between 13:00 and 15:30.',
        'Check local PM2.5 hourly trends before opening windows for a rapid 10-minute air flush.',
      ],
      directImpactExplanation:
        'Valley inversions break briefly after solar noon, often cutting street-level PM2.5 by 25–35%. Avoiding cold-engine morning restarts also eliminates up to 70% of catalytic-converter warm-up NOx and soot.',
      estimatedPm25ExposureDropPct: 26,
      estimatedWeeklyPm25AvoidedGrams: 4.8,
      estimatedWeeklyCo2AvoidedKg: 6.4,
    },
    {
      id: 'routine-idle-free-school',
      category: 'daily_routine',
      title: 'Idle-Free School Drop-Off & Carpool Chain',
      timingOrCadence: 'Weekdays · 07:45 & 15:15',
      effortLevel: 'Habit Shift',
      summary:
        'Coordinate a two-family carpool or park 250 meters from the school gate instead of idling in the drop-off queue.',
      howToSteps: [
        'Turn off the ignition whenever stationary for more than 10 seconds—restarting uses less fuel than 15 seconds of winter idling.',
        'Pair with one neighboring family on alternating days to halve cold-start trips.',
        'Switch cabin HVAC to Recirculate while driving along arterial roads.',
      ],
      directImpactExplanation:
        'Vehicle idling in cold air creates concentrated exhaust plumes right at child breathing height. Halving solo school runs removes ~35 km/week of cold-start urban driving and cuts cabin PM2.5 ingress by up to 40%.',
      estimatedPm25ExposureDropPct: 14,
      estimatedWeeklyPm25AvoidedGrams: 6.2,
      estimatedWeeklyCo2AvoidedKg: 15.8,
    },
    {
      id: 'iaq-corsi-rosenthal',
      category: 'indoor_hack',
      title: 'Build a 4-Filter MERV-13 Corsi-Rosenthal Cube for Main Living Space',
      timingOrCadence: 'Continuous · Low Speed Overnight',
      effortLevel: 'Low Cost',
      summary:
        'Tape four 20×20 MERV-13 pleated furnace filters and a 20-inch box fan into a sealed cube delivering ~450–600 CFM clean air for ~$65.',
      howToSteps: [
        'Arrange four MERV-13 filters (arrows pointing inward) into a square box with duct tape.',
        'Use the cardboard box bottom as the base and tape a 20-inch UL-listed box fan face-up on top with a cardboard shroud covering the corners.',
        'Run on medium/low speed in the family room by day and outside bedrooms at night.',
      ],
      directImpactExplanation:
        'Achieving 4–5 air changes per hour with MERV-13 media traps 85–90% of 0.3–2.5 µm winter smog particles per pass, typically reducing indoor PM2.5 by 48–58% within 45 minutes.',
      estimatedPm25ExposureDropPct: 52,
      estimatedWeeklyPm25AvoidedGrams: 0,
      estimatedWeeklyCo2AvoidedKg: 0,
    },
    {
      id: 'iaq-weatherstrip-kitchen',
      category: 'indoor_hack',
      title: 'Seal Drafty Sashes & Pair Gas Cooking with Back-Burner Exhaust',
      timingOrCadence: 'One-Time Setup + Every Meal',
      effortLevel: 'Low Cost',
      summary:
        'Install V-strip foam weatherstripping on leaky exterior doors and always run a vented range hood over back burners when cooking.',
      howToSteps: [
        'Hold an incense stick or wet hand near window edges to locate cold smog drafts; apply adhesive EPDM foam tape.',
        'Cook on rear burners with the exhaust hood on high (or crack a leeward window slightly only during afternoon mixing).',
        'Wet-mop hard floors twice weekly instead of dry sweeping so settled soot is not resuspended.',
      ],
      directImpactExplanation:
        'Tightening home air leakage reduces outdoor-to-indoor PM2.5 infiltration from ~0.62 to ~0.48, while capturing gas stove NO2 and cooking aerosols prevents indoor PM2.5 spikes that often exceed 150 µg/m³.',
      estimatedPm25ExposureDropPct: 24,
      estimatedWeeklyPm25AvoidedGrams: 1.4,
      estimatedWeeklyCo2AvoidedKg: 2.1,
    },
    {
      id: 'swap-induction-kettle',
      category: 'sustainable_swap',
      title: 'Shift Daily Boiling & Simmering to a Portable Induction Burner + Kettle',
      timingOrCadence: 'Daily Cooking · Zero Indoor Combustion',
      effortLevel: 'Low Cost',
      summary:
        'Use a $60 single-zone countertop induction unit and electric kettle instead of open gas flames during severe inversion days.',
      howToSteps: [
        'Move morning coffee, oatmeal, pasta boiling, and soups onto a portable 1800W induction hotplate.',
        'Reserve the gas oven only when the vented hood can run continuously.',
        'Batch-cook stews once on weekends to reduce daily stove runtime by 60%.',
      ],
      directImpactExplanation:
        'Eliminating open-flame gas cooking cuts household indoor NO2 peaks by up to 75% (critical for children with asthma) and avoids ~14 g/week of direct combustion NOx.',
      estimatedPm25ExposureDropPct: 16,
      estimatedWeeklyPm25AvoidedGrams: 1.8,
      estimatedWeeklyCo2AvoidedKg: 4.5,
    },
    {
      id: 'swap-wood-to-electric',
      category: 'sustainable_swap',
      title: 'Replace Recreational Wood Fires with Zone-Targeted Electric Heat',
      timingOrCadence: 'Winter Evenings · Burn-Ban Compliant',
      effortLevel: 'Habit Shift',
      summary:
        'Keep fireplaces dormant on stagnant winter evenings and warm occupied rooms with a thermostatic oil-filled radiant or heat-pump zone.',
      howToSteps: [
        'Close the fireplace chimney damper tightly when not in use to stop cold smog downdrafts.',
        'Use an energy-efficient infrared/radiant heater only in the occupied evening room and lower central thermostat by 2°C overnight.',
        'If your household relies on wood heat, switch strictly to kiln-dried (<20% moisture) wood on clear-wind days only.',
      ],
      directImpactExplanation:
        'A single evening of residential wood burning emits 18–25 g of ultra-fine PM2.5—roughly equivalent to driving a modern passenger car 600+ km. Skipping 4 hours/week eliminates 74 g of local winter smoke.',
      estimatedPm25ExposureDropPct: 12,
      estimatedWeeklyPm25AvoidedGrams: 74.0,
      estimatedWeeklyCo2AvoidedKg: 18.5,
    },
  ],
};

export const CALCULATOR_INTERVENTIONS: InterventionOption[] = [
  {
    id: 'corsi_rosenthal',
    category: 'indoor_hack',
    label: 'Run DIY Corsi-Rosenthal MERV-13 Cube (or HEPA)',
    shortMechanism: '52% indoor PM2.5 reduction via 4.5 ACH filtration',
    directImpactNote: 'Continuously scrubs 0.3–2.5 µm soot and secondary nitrates indoors.',
  },
  {
    id: 'weatherseal_windows',
    category: 'indoor_hack',
    label: 'Seal Window & Door Drafts + Wet-Mop Dust',
    shortMechanism: 'Reduces outdoor-to-indoor I/O infiltration by 18%',
    directImpactNote: 'Prevents overnight inversion smog from creeping through sash gaps.',
  },
  {
    id: 'midday_window',
    category: 'daily_routine',
    label: 'Shift Outdoor Exercise & Errands to 13:00–15:30',
    shortMechanism: '25% lower outdoor PM2.5 during afternoon mixing',
    directImpactNote: 'Avoids peak morning/evening cold-pool concentrations.',
  },
  {
    id: 'n95_commute',
    category: 'daily_routine',
    label: 'Wear Fitted N95/KF94 Mask on High-Smog Transit Walks',
    shortMechanism: '85% filtration of inhaled particulates outdoors',
    directImpactNote: 'Blocks fine particles during street-level commute exposure.',
  },
  {
    id: 'skip_cold_trips',
    category: 'sustainable_swap',
    label: 'Replace 50% of Cold-Start Car Trips with Transit / E-Bike / Carpool',
    shortMechanism: 'Halves tailpipe PM2.5, brake dust & cold-start NOx',
    directImpactNote: 'Cold winter engines emit 3–4× more soot in the first 5 km.',
  },
  {
    id: 'idle_free',
    category: 'daily_routine',
    label: 'Strict Idle-Free Drop-Offs & Cabin Recirculate Mode',
    shortMechanism: 'Avoids 3.4 g PM2.5/wk + 40% lower in-cabin exhaust',
    directImpactNote: 'Protects children at school gates and cuts queued exhaust.',
  },
  {
    id: 'stop_wood_burn',
    category: 'sustainable_swap',
    label: 'Pause Wood-Burning & Use Electric Zone Heat Setback (-2°C)',
    shortMechanism: 'Eliminates 18.5 g PM2.5/hr woodsmoke + trims gas NOx',
    directImpactNote: 'Woodsmoke is the single largest modifiable neighborhood PM2.5 source.',
  },
  {
    id: 'induction_swap',
    category: 'sustainable_swap',
    label: 'Switch Daily Cooking to Induction + Vented Range Hood',
    shortMechanism: 'Cuts indoor combustion spikes 16% + avoids gas NOx',
    directImpactNote: 'Eliminates unvented flame NO2 and cooking aerosol accumulation.',
  },
];

/**
 * Published winter air-quality, inhalation, and household emission reference factors
 * used by the deterministic Direct Impact Calculator.
 */
export const IMPACT_MODEL_CONSTANTS = {
  /** Unsealed residential outdoor-to-indoor PM2.5 infiltration ratio */
  BASE_INFILTRATION_RATIO: 0.62,
  /** Infiltration multiplier when exterior doors/windows are weathersealed */
  WEATHERSEAL_MULTIPLIER: 0.82,
  /** Steady-state indoor PM2.5 multiplier with 4.5+ ACH MERV-13/HEPA filtration */
  FILTRATION_MULTIPLIER: 0.48,
  /** Daily 24h-equivalent indoor PM2.5/NO2 load per hour of unvented gas cooking (µg/m³) */
  GAS_COOKING_LOAD_PER_HOUR: 6.8,
  /** Remaining cooking particulate fraction when switching to induction + vented hood */
  INDUCTION_REMAINING_FRACTION: 0.22,
  /** Average indoor air breathed over 20 hours (m³/day per person) */
  INDOOR_AIR_VOLUME_M3: 11.5,
  /** Average outdoor/commute air breathed over 4 hours (m³/day per person) */
  OUTDOOR_AIR_VOLUME_M3: 3.0,
  /** Outdoor PM2.5 multiplier when shifting errands to the afternoon mixing trough */
  MIDDAY_WINDOW_MULTIPLIER: 0.75,
  /** Weighted outdoor exposure multiplier when wearing a fitted N95/KF94 mask in transit */
  N95_OUTDOOR_MULTIPLIER: 0.25,
  /** Berkeley Earth reference: ~22 µg/m³ 24h average PM2.5 ≈ 1 cigarette/day */
  CIGARETTE_EQUIV_UG_M3: 22,
  /** Cold-start winter passenger car emissions per km */
  CAR_PM25_G_PER_KM: 0.038,
  CAR_NOX_G_PER_KM: 0.45,
  CAR_CO2_KG_PER_KM: 0.22,
  /** Weekly emissions saved by eliminating school/errand idling */
  IDLE_FREE_PM25_G_PER_WEEK: 3.4,
  IDLE_FREE_NOX_G_PER_WEEK: 11.5,
  IDLE_FREE_CO2_KG_PER_WEEK: 4.6,
  /** Residential wood-burning emission factors per hour */
  WOOD_PM25_G_PER_HOUR: 18.5,
  WOOD_NOX_G_PER_HOUR: 2.4,
  WOOD_CO2_KG_PER_HOUR: 1.8,
  /** Central heating 2°C thermal setback savings per heating-hour/day */
  HEATING_SETBACK_NOX_PER_HR: 0.85,
  HEATING_SETBACK_CO2_PER_HR: 1.45,
  /** Weekly savings per 45 min/day of unvented gas stove cooking shifted to induction */
  COOKING_REF_MINUTES: 45,
  COOKING_PM25_G_PER_REF: 1.6,
  COOKING_NOX_G_PER_REF: 14.0,
  COOKING_CO2_KG_PER_REF: 4.2,
  /** 90-day winter inversion season length in weeks */
  WEEKS_IN_WINTER: 13,
  /** PM2.5 emitted by a single 10 km winter cold-start urban car trip (grams) */
  CAR_TRIP_10KM_PM25_G: 0.38,
} as const;

interface IndoorPm25Metrics {
  baselineIndoorPm25: number;
  mitigatedIndoorPm25: number;
  indoorDropPct: number;
}

/**
 * Models 24-hour indoor PM2.5 concentration from outdoor infiltration,
 * mechanical filtration, envelope sealing, and indoor gas cooking aerosols.
 */
export function calculateIndoorPm25(
  baseline: ImpactBaselineInputs,
  active: ReadonlySet<string>,
): IndoorPm25Metrics {
  const sealedFactor = active.has('weatherseal_windows')
    ? IMPACT_MODEL_CONSTANTS.WEATHERSEAL_MULTIPLIER
    : 1.0;
  const filtrationFactor = active.has('corsi_rosenthal')
    ? IMPACT_MODEL_CONSTANTS.FILTRATION_MULTIPLIER
    : 1.0;

  const baseCookingLoad =
    (baseline.gasCookingMinutesPerDay / 60) * IMPACT_MODEL_CONSTANTS.GAS_COOKING_LOAD_PER_HOUR;
  const mitigatedCookingLoad = active.has('induction_swap')
    ? baseCookingLoad * IMPACT_MODEL_CONSTANTS.INDUCTION_REMAINING_FRACTION
    : baseCookingLoad;

  const baselineIndoorPm25 = Number(
    (baseline.outdoorPm25UgM3 * IMPACT_MODEL_CONSTANTS.BASE_INFILTRATION_RATIO + baseCookingLoad).toFixed(1),
  );
  const mitigatedIndoorPm25 = Number(
    (
      baseline.outdoorPm25UgM3 *
        IMPACT_MODEL_CONSTANTS.BASE_INFILTRATION_RATIO *
        sealedFactor *
        filtrationFactor +
      mitigatedCookingLoad
    ).toFixed(1),
  );

  const indoorDropPct =
    baselineIndoorPm25 > 0
      ? Math.round(((baselineIndoorPm25 - mitigatedIndoorPm25) / baselineIndoorPm25) * 100)
      : 0;

  return { baselineIndoorPm25, mitigatedIndoorPm25, indoorDropPct };
}

interface InhaledDoseMetrics {
  baselineDailyInhaledUg: number;
  mitigatedDailyInhaledUg: number;
  familyDailyInhaledUg: number;
  familyDailyAvoidedUg: number;
  inhaledDoseDropPct: number;
  cigaretteEquivBefore: number;
  cigaretteEquivAfter: number;
}

/**
 * Computes per-person and total-household daily inhaled PM2.5 dose (µg/day)
 * and Berkeley Earth cigarette-equivalent exposure.
 */
export function calculateInhaledDose(
  outdoorPm25UgM3: number,
  indoor: IndoorPm25Metrics,
  active: ReadonlySet<string>,
  householdSize: number,
): InhaledDoseMetrics {
  const { INDOOR_AIR_VOLUME_M3, OUTDOOR_AIR_VOLUME_M3, CIGARETTE_EQUIV_UG_M3 } =
    IMPACT_MODEL_CONSTANTS;
  const totalVolume = INDOOR_AIR_VOLUME_M3 + OUTDOOR_AIR_VOLUME_M3;
  const safeMembers = Math.max(1, Math.round(householdSize || 1));

  const baselineDailyInhaledUg = Number(
    (
      indoor.baselineIndoorPm25 * INDOOR_AIR_VOLUME_M3 +
      outdoorPm25UgM3 * OUTDOOR_AIR_VOLUME_M3
    ).toFixed(0),
  );

  const outdoorTimingFactor = active.has('midday_window')
    ? IMPACT_MODEL_CONSTANTS.MIDDAY_WINDOW_MULTIPLIER
    : 1.0;
  const maskFactor = active.has('n95_commute')
    ? IMPACT_MODEL_CONSTANTS.N95_OUTDOOR_MULTIPLIER
    : 1.0;
  const effectiveOutdoorPm25 = outdoorPm25UgM3 * outdoorTimingFactor * maskFactor;

  const mitigatedDailyInhaledUg = Number(
    (
      indoor.mitigatedIndoorPm25 * INDOOR_AIR_VOLUME_M3 +
      effectiveOutdoorPm25 * OUTDOOR_AIR_VOLUME_M3
    ).toFixed(0),
  );

  const inhaledDoseDropPct =
    baselineDailyInhaledUg > 0
      ? Math.round(
          ((baselineDailyInhaledUg - mitigatedDailyInhaledUg) / baselineDailyInhaledUg) * 100,
        )
      : 0;

  const familyDailyInhaledUg = mitigatedDailyInhaledUg * safeMembers;
  const familyDailyAvoidedUg = Math.max(0, baselineDailyInhaledUg - mitigatedDailyInhaledUg) * safeMembers;

  const cigaretteEquivBefore = Number(
    (baselineDailyInhaledUg / totalVolume / CIGARETTE_EQUIV_UG_M3).toFixed(2),
  );
  const cigaretteEquivAfter = Number(
    (mitigatedDailyInhaledUg / totalVolume / CIGARETTE_EQUIV_UG_M3).toFixed(2),
  );

  return {
    baselineDailyInhaledUg,
    mitigatedDailyInhaledUg,
    familyDailyInhaledUg,
    familyDailyAvoidedUg,
    inhaledDoseDropPct,
    cigaretteEquivBefore,
    cigaretteEquivAfter,
  };
}

interface WeeklyEmissionMetrics {
  weeklyPm25AvoidedGrams: number;
  weeklyNoxAvoidedGrams: number;
  weeklyCo2AvoidedKg: number;
  sourceBreakdown: ImpactCalculationResult['sourceBreakdown'];
}

/**
 * Calculates weekly direct household PM2.5, NOx, and CO2e emissions avoided
 * across transport, wood/heating, and cooking sources with source attribution.
 */
export function calculateWeeklyEmissions(
  baseline: ImpactBaselineInputs,
  active: ReadonlySet<string>,
): WeeklyEmissionMetrics {
  const C = IMPACT_MODEL_CONSTANTS;
  const weeklyCarKm = baseline.dailyCarKm * 7;
  const avoidedCarKm = active.has('skip_cold_trips') ? weeklyCarKm * 0.5 : 0;

  const carPm25Avoided =
    avoidedCarKm * C.CAR_PM25_G_PER_KM + (active.has('idle_free') ? C.IDLE_FREE_PM25_G_PER_WEEK : 0);
  const carNoxAvoided =
    avoidedCarKm * C.CAR_NOX_G_PER_KM + (active.has('idle_free') ? C.IDLE_FREE_NOX_G_PER_WEEK : 0);
  const carCo2Avoided =
    avoidedCarKm * C.CAR_CO2_KG_PER_KM + (active.has('idle_free') ? C.IDLE_FREE_CO2_KG_PER_WEEK : 0);

  const woodPaused = active.has('stop_wood_burn');
  const woodPm25Avoided = woodPaused ? baseline.woodBurnHoursPerWeek * C.WOOD_PM25_G_PER_HOUR : 0;
  const woodNoxAvoided = woodPaused ? baseline.woodBurnHoursPerWeek * C.WOOD_NOX_G_PER_HOUR : 0;
  const heatingSetbackNox = woodPaused ? baseline.heatingHoursPerDay * C.HEATING_SETBACK_NOX_PER_HR : 0;
  const heatingSetbackCo2 = woodPaused
    ? baseline.heatingHoursPerDay * C.HEATING_SETBACK_CO2_PER_HR +
      baseline.woodBurnHoursPerWeek * C.WOOD_CO2_KG_PER_HOUR
    : 0;

  const cookingRatio = baseline.gasCookingMinutesPerDay / C.COOKING_REF_MINUTES;
  const inductionActive = active.has('induction_swap');
  const cookingPm25Avoided = inductionActive ? cookingRatio * C.COOKING_PM25_G_PER_REF : 0;
  const cookingNoxAvoided = inductionActive ? cookingRatio * C.COOKING_NOX_G_PER_REF : 0;
  const cookingCo2Avoided = inductionActive ? cookingRatio * C.COOKING_CO2_KG_PER_REF : 0;

  const weeklyPm25AvoidedGrams = Number(
    (carPm25Avoided + woodPm25Avoided + cookingPm25Avoided).toFixed(1),
  );
  const weeklyNoxAvoidedGrams = Number(
    (carNoxAvoided + woodNoxAvoided + heatingSetbackNox + cookingNoxAvoided).toFixed(1),
  );
  const weeklyCo2AvoidedKg = Number(
    (carCo2Avoided + heatingSetbackCo2 + cookingCo2Avoided).toFixed(1),
  );

  const woodPotential = baseline.woodBurnHoursPerWeek * C.WOOD_PM25_G_PER_HOUR;
  const carPotential = weeklyCarKm * C.CAR_PM25_G_PER_KM + C.IDLE_FREE_PM25_G_PER_WEEK;
  const cookingPotential = cookingRatio * C.COOKING_PM25_G_PER_REF;
  const safeDiv = Math.max(1, woodPotential + carPotential + cookingPotential);

  const woodShare = Math.round((woodPotential / safeDiv) * 100);
  const carShare = Math.round((carPotential / safeDiv) * 100);

  const sourceBreakdown = [
    {
      label: 'Residential Wood & Hearth',
      baselineSharePct: woodShare,
      avoidedGramsPm25: Number(woodPm25Avoided.toFixed(1)),
    },
    {
      label: 'Cold-Start Commute & Idling',
      baselineSharePct: carShare,
      avoidedGramsPm25: Number(carPm25Avoided.toFixed(1)),
    },
    {
      label: 'Indoor Gas & Cooking Aerosols',
      baselineSharePct: Math.max(1, 100 - woodShare - carShare),
      avoidedGramsPm25: Number(cookingPm25Avoided.toFixed(1)),
    },
  ];

  return {
    weeklyPm25AvoidedGrams,
    weeklyNoxAvoidedGrams,
    weeklyCo2AvoidedKg,
    sourceBreakdown,
  };
}

/**
 * Evaluates deterministic personal exposure reductions, household-wide inhaled dose,
 * direct weekly/seasonal emissions avoided, and neighborhood multiplier impact.
 */
export function calculateDirectImpact(
  baseline: ImpactBaselineInputs,
  activeIds: string[],
  householdSize: number,
  communityHouseholds: number,
): ImpactCalculationResult {
  const active = new Set(activeIds);
  const indoor = calculateIndoorPm25(baseline, active);
  const dose = calculateInhaledDose(baseline.outdoorPm25UgM3, indoor, active, householdSize);
  const emissions = calculateWeeklyEmissions(baseline, active);

  const { WEEKS_IN_WINTER, CAR_TRIP_10KM_PM25_G } = IMPACT_MODEL_CONSTANTS;
  const safeCommunityHouseholds = Math.max(1, Math.round(communityHouseholds || 1));

  const seasonalPm25AvoidedKg = Number(
    ((emissions.weeklyPm25AvoidedGrams * WEEKS_IN_WINTER) / 1000).toFixed(2),
  );
  const seasonalNoxAvoidedKg = Number(
    ((emissions.weeklyNoxAvoidedGrams * WEEKS_IN_WINTER) / 1000).toFixed(2),
  );
  const seasonalCo2AvoidedKg = Number((emissions.weeklyCo2AvoidedKg * WEEKS_IN_WINTER).toFixed(0));

  const communitySeasonalPm25AvoidedKg = Number(
    (seasonalPm25AvoidedKg * safeCommunityHouseholds).toFixed(1),
  );
  const communitySeasonalCo2AvoidedTonnes = Number(
    ((seasonalCo2AvoidedKg * safeCommunityHouseholds) / 1000).toFixed(1),
  );
  const equivalentCarTripsRemoved = Math.round(
    (communitySeasonalPm25AvoidedKg * 1000) / CAR_TRIP_10KM_PM25_G,
  );

  return {
    ...indoor,
    ...dose,
    ...emissions,
    seasonalPm25AvoidedKg,
    seasonalNoxAvoidedKg,
    seasonalCo2AvoidedKg,
    communitySeasonalPm25AvoidedKg,
    communitySeasonalCo2AvoidedTonnes,
    equivalentCarTripsRemoved,
  };
}
