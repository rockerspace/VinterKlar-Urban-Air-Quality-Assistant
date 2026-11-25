import { describe, it, expect } from 'vitest';
import {
  CALCULATOR_INTERVENTIONS,
  CITY_PRESETS,
  DEFAULT_HOUSEHOLD_PROFILE,
  INITIAL_PLAYBOOK,
  calculateDirectImpact,
} from '../data/cleanAirData';
import type { ImpactBaselineInputs } from '../types';

const SAMPLE_BASELINE: ImpactBaselineInputs = {
  outdoorPm25UgM3: 60,
  dailyCarKm: 30,
  heatingHoursPerDay: 12,
  woodBurnHoursPerWeek: 4,
  gasCookingMinutesPerDay: 45,
};

describe('cleanAirData presets and baseline structures', () => {
  it('defines a complete default household profile', () => {
    expect(DEFAULT_HOUSEHOLD_PROFILE.city).toBeTruthy();
    expect(DEFAULT_HOUSEHOLD_PROFILE.householdSize).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_HOUSEHOLD_PROFILE.sensitiveMembers.length).toBeGreaterThan(0);
  });

  it('provides valid winter-smog city presets with positive AQI and PM2.5', () => {
    expect(CITY_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const preset of CITY_PRESETS) {
      expect(preset.city.length).toBeGreaterThan(2);
      expect(preset.brief.estimatedAqi).toBeGreaterThan(0);
      expect(preset.brief.pm25UgM3).toBeGreaterThan(0);
      expect(preset.brief.localTriggers.length).toBeGreaterThan(0);
    }
  });

  it('provides structured initial playbook recommendations across all 3 categories', () => {
    expect(INITIAL_PLAYBOOK.recommendations.length).toBeGreaterThanOrEqual(6);
    const categories = new Set(INITIAL_PLAYBOOK.recommendations.map((r) => r.category));
    expect(categories.has('daily_routine')).toBe(true);
    expect(categories.has('indoor_hack')).toBe(true);
    expect(categories.has('sustainable_swap')).toBe(true);
  });

  it('defines 8 unique calculator interventions', () => {
    const ids = new Set(CALCULATOR_INTERVENTIONS.map((i) => i.id));
    expect(CALCULATOR_INTERVENTIONS.length).toBe(8);
    expect(ids.size).toBe(8);
  });
});

describe('calculateDirectImpact physics engine', () => {
  it('returns zero exposure reduction and zero emissions avoided when no interventions are active', () => {
    const result = calculateDirectImpact(SAMPLE_BASELINE, [], 4, 50);

    expect(result.indoorDropPct).toBe(0);
    expect(result.inhaledDoseDropPct).toBe(0);
    expect(result.mitigatedIndoorPm25).toBe(result.baselineIndoorPm25);
    expect(result.mitigatedDailyInhaledUg).toBe(result.baselineDailyInhaledUg);
    expect(result.weeklyPm25AvoidedGrams).toBe(0);
    expect(result.weeklyNoxAvoidedGrams).toBe(0);
    expect(result.weeklyCo2AvoidedKg).toBe(0);
    expect(result.communitySeasonalPm25AvoidedKg).toBe(0);
  });

  it('reduces indoor PM2.5 significantly when Corsi-Rosenthal MERV-13 filtration is enabled', () => {
    const noFilter = calculateDirectImpact(SAMPLE_BASELINE, [], 4, 1);
    const withCube = calculateDirectImpact(SAMPLE_BASELINE, ['corsi_rosenthal'], 4, 1);

    expect(withCube.mitigatedIndoorPm25).toBeLessThan(noFilter.baselineIndoorPm25);
    expect(withCube.indoorDropPct).toBeGreaterThan(40);
    expect(withCube.mitigatedDailyInhaledUg).toBeLessThan(noFilter.baselineDailyInhaledUg);
    expect(withCube.cigaretteEquivAfter).toBeLessThan(withCube.cigaretteEquivBefore);
  });

  it('reduces outdoor-to-indoor infiltration when weathersealing and induction swaps are active', () => {
    const sealed = calculateDirectImpact(
      SAMPLE_BASELINE,
      ['weatherseal_windows', 'induction_swap'],
      4,
      1,
    );

    expect(sealed.mitigatedIndoorPm25).toBeLessThan(sealed.baselineIndoorPm25);
    expect(sealed.weeklyNoxAvoidedGrams).toBeGreaterThan(10);
  });

  it('quantifies direct household PM2.5, NOx, and CO2e avoided for wood, driving, and cooking swaps', () => {
    const result = calculateDirectImpact(
      SAMPLE_BASELINE,
      ['stop_wood_burn', 'skip_cold_trips', 'idle_free', 'induction_swap'],
      4,
      1,
    );

    expect(result.weeklyPm25AvoidedGrams).toBeGreaterThan(75);
    expect(result.weeklyNoxAvoidedGrams).toBeGreaterThan(50);
    expect(result.weeklyCo2AvoidedKg).toBeGreaterThan(40);
    expect(result.seasonalPm25AvoidedKg).toBeCloseTo((result.weeklyPm25AvoidedGrams * 13) / 1000, 1);
  });

  it('attributes baseline shares cleanly across wood, commute, and cooking sources', () => {
    const result = calculateDirectImpact(
      SAMPLE_BASELINE,
      ['stop_wood_burn', 'skip_cold_trips', 'induction_swap'],
      4,
      1,
    );
    expect(result.sourceBreakdown.length).toBe(3);
    const totalShare = result.sourceBreakdown.reduce((acc, s) => acc + s.baselineSharePct, 0);
    expect(totalShare).toBe(100);
  });

  it('scales seasonal community impact linearly with household count', () => {
    const active = ['corsi_rosenthal', 'stop_wood_burn', 'skip_cold_trips'];
    const single = calculateDirectImpact(SAMPLE_BASELINE, active, 4, 1);
    const block = calculateDirectImpact(SAMPLE_BASELINE, active, 4, 50);

    expect(block.communitySeasonalPm25AvoidedKg).toBeCloseTo(
      single.seasonalPm25AvoidedKg * 50,
      0,
    );
    expect(block.equivalentCarTripsRemoved).toBeGreaterThan(
      single.equivalentCarTripsRemoved * 40,
    );
  });

  it('handles zero-pollution and zero-activity edge cases without NaN or negative values', () => {
    const zeroBaseline: ImpactBaselineInputs = {
      outdoorPm25UgM3: 0,
      dailyCarKm: 0,
      heatingHoursPerDay: 0,
      woodBurnHoursPerWeek: 0,
      gasCookingMinutesPerDay: 0,
    };
    const allIds = CALCULATOR_INTERVENTIONS.map((i) => i.id);
    const result = calculateDirectImpact(zeroBaseline, allIds, 1, 10);

    expect(result.baselineIndoorPm25).toBe(0);
    expect(result.mitigatedIndoorPm25).toBe(0);
    expect(result.indoorDropPct).toBe(0);
    expect(result.inhaledDoseDropPct).toBe(0);
    expect(result.familyDailyInhaledUg).toBe(0);
    expect(result.familyDailyAvoidedUg).toBe(0);
    expect(Number.isNaN(result.weeklyPm25AvoidedGrams)).toBe(false);
  });

  it('scales total household daily inhaled and avoided dose proportionally with householdSize', () => {
    const singlePerson = calculateDirectImpact(SAMPLE_BASELINE, ['corsi_rosenthal'], 1, 1);
    const familyOfFour = calculateDirectImpact(SAMPLE_BASELINE, ['corsi_rosenthal'], 4, 1);

    expect(familyOfFour.familyDailyInhaledUg).toBe(singlePerson.mitigatedDailyInhaledUg * 4);
    expect(familyOfFour.familyDailyAvoidedUg).toBe(
      (singlePerson.baselineDailyInhaledUg - singlePerson.mitigatedDailyInhaledUg) * 4,
    );
  });
});
