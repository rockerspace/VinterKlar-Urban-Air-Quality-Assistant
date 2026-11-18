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

export function calculateDirectImpact(
  baseline: ImpactBaselineInputs,
  activeIds: string[],
  householdSize: number,
  communityHouseholds: number,
): ImpactCalculationResult {
  const active = new Set(activeIds);

  // 1. Indoor PM2.5 physics: I_in = I_out * infiltrationRatio * (1 - filtration) + indoorCookingSpike
  const baseInfiltration = 0.62;
  const sealedFactor = active.has('weatherseal_windows') ? 0.82 : 1.0;
  const filtrationFactor = active.has('corsi_rosenthal') ? 0.48 : 1.0;

  // Gas cooking without induction/ventilation adds ~5.5 ug/m3 24h average indoor PM2.5/NO2-equivalent load
  const baseCookingLoad = (baseline.gasCookingMinutesPerDay / 60) * 6.8;
  const mitigatedCookingLoad = active.has('induction_swap')
    ? baseCookingLoad * 0.22
    : baseCookingLoad;

  const baselineIndoorPm25 = Number(
    (baseline.outdoorPm25UgM3 * baseInfiltration + baseCookingLoad).toFixed(1),
  );
  const mitigatedIndoorPm25 = Number(
    (
      baseline.outdoorPm25UgM3 * baseInfiltration * sealedFactor * filtrationFactor +
      mitigatedCookingLoad
    ).toFixed(1),
  );
  const indoorDropPct =
    baselineIndoorPm25 > 0
      ? Math.round(((baselineIndoorPm25 - mitigatedIndoorPm25) / baselineIndoorPm25) * 100)
      : 0;

  // 2. Daily Inhaled Dose (ug/day per person): 20h indoors (~11.5 m3), 4h outdoors/transit (~3.0 m3)
  const indoorAirVolM3 = 11.5;
  const outdoorAirVolM3 = 3.0;

  const baselineDailyInhaledUg = Number(
    (
      baselineIndoorPm25 * indoorAirVolM3 +
      baseline.outdoorPm25UgM3 * outdoorAirVolM3
    ).toFixed(0),
  );

  const outdoorTimingFactor = active.has('midday_window') ? 0.75 : 1.0;
  const maskFactor = active.has('n95_commute') ? 0.25 : 1.0; // Weighted across outdoor errands/transit
  const effectiveOutdoorPm25 = baseline.outdoorPm25UgM3 * outdoorTimingFactor * maskFactor;

  const mitigatedDailyInhaledUg = Number(
    (mitigatedIndoorPm25 * indoorAirVolM3 + effectiveOutdoorPm25 * outdoorAirVolM3).toFixed(0),
  );

  const inhaledDoseDropPct =
    baselineDailyInhaledUg > 0
      ? Math.round(
          ((baselineDailyInhaledUg - mitigatedDailyInhaledUg) / baselineDailyInhaledUg) * 100,
        )
      : 0;

  // Berkeley Earth equivalence: ~22 ug/m3 24h average exposure ~ 1 cigarette/day
  const timeWeightedBeforeUgM3 = baselineDailyInhaledUg / (indoorAirVolM3 + outdoorAirVolM3);
  const timeWeightedAfterUgM3 = mitigatedDailyInhaledUg / (indoorAirVolM3 + outdoorAirVolM3);
  const cigaretteEquivBefore = Number((timeWeightedBeforeUgM3 / 22).toFixed(2));
  const cigaretteEquivAfter = Number((timeWeightedAfterUgM3 / 22).toFixed(2));

  // 3. Direct Household Emissions Avoided per week
  // Transport (exhaust + winter cold-start + brake/tire wear ~ 0.038 g PM2.5/km, 0.45 g NOx/km, 0.22 kg CO2/km)
  const weeklyCarKm = baseline.dailyCarKm * 7;
  const avoidedCarKm = active.has('skip_cold_trips') ? weeklyCarKm * 0.5 : 0;
  const carPm25Avoided = avoidedCarKm * 0.038 + (active.has('idle_free') ? 3.4 : 0);
  const carNoxAvoided = avoidedCarKm * 0.45 + (active.has('idle_free') ? 11.5 : 0);
  const carCo2Avoided = avoidedCarKm * 0.22 + (active.has('idle_free') ? 4.6 : 0);

  // Wood burning + Space heating setback
  const woodPm25Avoided = active.has('stop_wood_burn')
    ? baseline.woodBurnHoursPerWeek * 18.5
    : 0;
  const woodNoxAvoided = active.has('stop_wood_burn')
    ? baseline.woodBurnHoursPerWeek * 2.4
    : 0;
  const heatingSetbackNox = active.has('stop_wood_burn')
    ? baseline.heatingHoursPerDay * 0.85
    : 0;
  const heatingSetbackCo2 = active.has('stop_wood_burn')
    ? baseline.heatingHoursPerDay * 1.45 + baseline.woodBurnHoursPerWeek * 1.8
    : 0;

  // Cooking fuel shift
  const cookingPm25Avoided = active.has('induction_swap')
    ? (baseline.gasCookingMinutesPerDay / 45) * 1.6
    : 0;
  const cookingNoxAvoided = active.has('induction_swap')
    ? (baseline.gasCookingMinutesPerDay / 45) * 14.0
    : 0;
  const cookingCo2Avoided = active.has('induction_swap')
    ? (baseline.gasCookingMinutesPerDay / 45) * 4.2
    : 0;

  const weeklyPm25AvoidedGrams = Number(
    (carPm25Avoided + woodPm25Avoided + cookingPm25Avoided).toFixed(1),
  );
  const weeklyNoxAvoidedGrams = Number(
    (carNoxAvoided + woodNoxAvoided + heatingSetbackNox + cookingNoxAvoided).toFixed(1),
  );
  const weeklyCo2AvoidedKg = Number(
    (carCo2Avoided + heatingSetbackCo2 + cookingCo2Avoided).toFixed(1),
  );

  // 90-day winter smog season (~13 weeks)
  const weeksInWinter = 13;
  const seasonalPm25AvoidedKg = Number(((weeklyPm25AvoidedGrams * weeksInWinter) / 1000).toFixed(2));
  const seasonalNoxAvoidedKg = Number(((weeklyNoxAvoidedGrams * weeksInWinter) / 1000).toFixed(2));
  const seasonalCo2AvoidedKg = Number((weeklyCo2AvoidedKg * weeksInWinter).toFixed(0));

  const communitySeasonalPm25AvoidedKg = Number(
    (seasonalPm25AvoidedKg * communityHouseholds).toFixed(1),
  );
  const communitySeasonalCo2AvoidedTonnes = Number(
    ((seasonalCo2AvoidedKg * communityHouseholds) / 1000).toFixed(1),
  );
  // 10 km winter cold-start car trip emits ~0.38 g PM2.5
  const equivalentCarTripsRemoved = Math.round(
    (communitySeasonalPm25AvoidedKg * 1000) / 0.38,
  );

  // Source attribution for visual breakdown
  const totalPotentialPm25 =
    weeklyCarKm * 0.038 +
    3.4 +
    baseline.woodBurnHoursPerWeek * 18.5 +
    (baseline.gasCookingMinutesPerDay / 45) * 1.6;

  const safeDiv = totalPotentialPm25 > 0 ? totalPotentialPm25 : 1;

  const sourceBreakdown = [
    {
      label: 'Residential Wood & Hearth',
      baselineSharePct: Math.round(((baseline.woodBurnHoursPerWeek * 18.5) / safeDiv) * 100),
      avoidedGramsPm25: Number(woodPm25Avoided.toFixed(1)),
    },
    {
      label: 'Cold-Start Commute & Idling',
      baselineSharePct: Math.round(((weeklyCarKm * 0.038 + 3.4) / safeDiv) * 100),
      avoidedGramsPm25: Number(carPm25Avoided.toFixed(1)),
    },
    {
      label: 'Indoor Gas & Cooking Aerosols',
      baselineSharePct: Math.max(
        1,
        100 -
          Math.round(((baseline.woodBurnHoursPerWeek * 18.5) / safeDiv) * 100) -
          Math.round(((weeklyCarKm * 0.038 + 3.4) / safeDiv) * 100),
      ),
      avoidedGramsPm25: Number(cookingPm25Avoided.toFixed(1)),
    },
  ];

  // Keep householdSize acknowledged for total family exposure context if needed downstream
  void householdSize;

  return {
    baselineIndoorPm25,
    mitigatedIndoorPm25,
    indoorDropPct,
    baselineDailyInhaledUg,
    mitigatedDailyInhaledUg,
    inhaledDoseDropPct,
    cigaretteEquivBefore,
    cigaretteEquivAfter,
    weeklyPm25AvoidedGrams,
    weeklyNoxAvoidedGrams,
    weeklyCo2AvoidedKg,
    seasonalPm25AvoidedKg,
    seasonalNoxAvoidedKg,
    seasonalCo2AvoidedKg,
    communitySeasonalPm25AvoidedKg,
    communitySeasonalCo2AvoidedTonnes,
    equivalentCarTripsRemoved,
    sourceBreakdown,
  };
}
