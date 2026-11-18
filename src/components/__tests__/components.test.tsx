import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImpactCalculator } from '../ImpactCalculator';
import { PlaybookSection } from '../PlaybookSection';
import { CommunitySection, buildImpactSummaryText } from '../CommunitySection';
import { AdvisorDrawer } from '../AdvisorDrawer';
import {
  CITY_PRESETS,
  DEFAULT_HOUSEHOLD_PROFILE,
  INITIAL_PLAYBOOK,
  calculateDirectImpact,
} from '../../data/cleanAirData';

const preset = CITY_PRESETS[0];

describe('VinterKlar UI Components', () => {
  it('ImpactCalculator renders sliders, methodology toggle, and intervention checkboxes', () => {
    const onToggle = vi.fn();
    const onChangeBaseline = vi.fn();
    const onReset = vi.fn();
    const impact = calculateDirectImpact(
      preset.defaultBaseline,
      ['corsi_rosenthal', 'stop_wood_burn'],
      4,
      50,
    );

    render(
      <ImpactCalculator
        baseline={preset.defaultBaseline}
        onChangeBaseline={onChangeBaseline}
        activeInterventions={['corsi_rosenthal', 'stop_wood_burn']}
        onToggleIntervention={onToggle}
        onResetDefaults={onReset}
        impact={impact}
        cityName={preset.city}
      />,
    );

    expect(screen.getByText(/Direct Impact Calculator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Outdoor Winter PM2.5 Concentration/i)).toBeInTheDocument();

    // Expand methodology breakdown
    const mathBtn = screen.getByRole('button', { name: /Explain Calculation Math/i });
    fireEvent.click(mathBtn);
    expect(screen.getByText(/1\. Indoor PM2\.5 Physics/i)).toBeInTheDocument();

    // Toggle a checkbox intervention
    const checkbox = screen.getByLabelText(/Wear Fitted N95\/KF94 Mask/i);
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith('n95_commute');
  });

  it('PlaybookSection filters categories, expands how-to steps, and adopts habits', () => {
    const onToggleComplete = vi.fn();
    const onRegenerate = vi.fn();

    render(
      <PlaybookSection
        playbook={INITIAL_PLAYBOOK}
        isLoading={false}
        error={null}
        onRegenerate={onRegenerate}
        completedIds={['routine-midday-shift']}
        onToggleComplete={onToggleComplete}
      />,
    );

    expect(screen.getByText(/1 of 6 habits adopted/i)).toBeInTheDocument();

    // Filter to Indoor Air Hacks
    fireEvent.click(screen.getByRole('button', { name: /Indoor Air Hacks/i }));
    expect(screen.getByText(/Corsi-Rosenthal Cube/i)).toBeInTheDocument();
    expect(screen.queryByText(/Idle-Free School Drop-Off/i)).not.toBeInTheDocument();

    // Expand How-To Steps
    const stepsBtns = screen.getAllByRole('button', { name: /How-To Steps/i });
    fireEvent.click(stepsBtns[0]);
    expect(screen.getByRole('button', { name: /Hide Steps/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('CommunitySection scales household counts and builds downloadable summary text', () => {
    const onChangeScale = vi.fn();
    const impact = calculateDirectImpact(
      preset.defaultBaseline,
      ['corsi_rosenthal', 'stop_wood_burn'],
      4,
      50,
    );

    render(
      <CommunitySection
        communityHouseholds={50}
        onChangeCommunityHouseholds={onChangeScale}
        impact={impact}
        airBrief={preset.brief}
        activeInterventionsCount={2}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /250 Households/i }));
    expect(onChangeScale).toHaveBeenCalledWith(250);

    const summary = buildImpactSummaryText(preset.brief, impact, 2, 50);
    expect(summary).toContain('VinterKlar Clean-Air Action Plan');
    expect(summary).toContain('50 Households over 90 Winter Days');
    expect(screen.getByRole('button', { name: /Download Summary/i })).toBeInTheDocument();
  });

  it('AdvisorDrawer displays context-aware welcome and closes on Escape key', () => {
    const onClose = vi.fn();
    const impact = calculateDirectImpact(preset.defaultBaseline, ['corsi_rosenthal'], 4, 50);

    render(
      <AdvisorDrawer
        isOpen={true}
        onClose={onClose}
        profile={DEFAULT_HOUSEHOLD_PROFILE}
        airBrief={preset.brief}
        impact={impact}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Clean-Air Family Advisor/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
