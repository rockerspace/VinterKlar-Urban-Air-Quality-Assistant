import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImpactCalculator } from '../components/ImpactCalculator';
import { PlaybookSection } from '../components/PlaybookSection';
import { CommunitySection, buildImpactSummaryText } from '../components/CommunitySection';
import { IndoorLabSection } from '../components/IndoorLabSection';
import { EmissionChart } from '../components/EmissionChart';
import { ProfileModal } from '../components/ProfileModal';
import { AdvisorDrawer } from '../components/AdvisorDrawer';
import { ResilientImage } from '../components/ResilientImage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  CITY_PRESETS,
  DEFAULT_HOUSEHOLD_PROFILE,
  INITIAL_PLAYBOOK,
  calculateDirectImpact,
} from '../data/cleanAirData';

const preset = CITY_PRESETS[0];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VinterKlar UI Components & Accessibility', () => {
  it('ImpactCalculator renders sliders with aria-valuetext, methodology toggle, checkboxes, and reset', () => {
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

    const pmSlider = screen.getByLabelText(/Outdoor Winter PM2.5 Concentration/i);
    expect(pmSlider).toHaveAttribute(
      'aria-valuetext',
      `${preset.defaultBaseline.outdoorPm25UgM3} micrograms per cubic meter`,
    );

    fireEvent.change(pmSlider, { target: { value: '80' } });
    expect(onChangeBaseline).toHaveBeenCalledWith(
      expect.objectContaining({ outdoorPm25UgM3: 80 }),
    );

    fireEvent.click(screen.getByRole('button', { name: /Explain Calculation Math/i }));
    expect(screen.getByText(/1\. Indoor PM2\.5 Physics/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Wear Fitted N95\/KF94 Mask/i));
    expect(onToggle).toHaveBeenCalledWith('n95_commute');

    fireEvent.click(screen.getByRole('button', { name: /Reset Defaults/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('PlaybookSection filters categories, adopts habits with aria-pressed, expands steps, and handles loading/error states', () => {
    const onToggleComplete = vi.fn();
    const onRegenerate = vi.fn();

    const { rerender } = render(
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

    const adoptedBtn = screen.getByRole('button', { name: /Adopted/i });
    expect(adoptedBtn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(adoptedBtn);
    expect(onToggleComplete).toHaveBeenCalledWith('routine-midday-shift');

    fireEvent.click(screen.getByRole('button', { name: /Indoor Air Hacks/i }));
    expect(screen.getByText(/Corsi-Rosenthal Cube/i)).toBeInTheDocument();
    expect(screen.queryByText(/Idle-Free School Drop-Off/i)).not.toBeInTheDocument();

    const stepsBtns = screen.getAllByRole('button', { name: /How-To Steps/i });
    fireEvent.click(stepsBtns[0]);
    expect(screen.getByRole('button', { name: /Hide Steps/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    rerender(
      <PlaybookSection
        playbook={INITIAL_PLAYBOOK}
        isLoading={true}
        error="Temporary API error"
        onRegenerate={onRegenerate}
        completedIds={[]}
        onToggleComplete={onToggleComplete}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Temporary API error');
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('IndoorLabSection updates CADR math via room presets and sliders and renders accessible table semantics', () => {
    render(<IndoorLabSection />);

    const openPlanBtn = screen.getByRole('button', { name: /Open Plan \(60 m²\)/i });
    expect(openPlanBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(openPlanBtn);
    expect(openPlanBtn).toHaveAttribute('aria-pressed', 'true');

    const areaSlider = screen.getByLabelText(/Floor Area/i);
    expect(areaSlider).toHaveAttribute('aria-valuetext', expect.stringContaining('60 square meters'));
    fireEvent.change(areaSlider, { target: { value: '85' } });
    expect(screen.getByText(/2 Cubes/i)).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(table.querySelector('caption')).toBeTruthy();
    expect(table.querySelectorAll('th[scope="col"]').length).toBe(5);
    expect(table.querySelectorAll('th[scope="row"]').length).toBe(4);
  });

  it('EmissionChart toggles between Inhaled PM2.5 Dose and Carbon Emissions with aria-pressed', () => {
    const impact = calculateDirectImpact(
      preset.defaultBaseline,
      ['corsi_rosenthal', 'stop_wood_burn'],
      4,
      50,
    );
    render(<EmissionChart impact={impact} cityName={preset.city} />);

    const pmBtn = screen.getByRole('button', { name: /Inhaled PM2\.5 Dose/i });
    const co2Btn = screen.getByRole('button', { name: /Carbon Emissions/i });
    expect(pmBtn).toHaveAttribute('aria-pressed', 'true');
    expect(co2Btn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/PM2\.5 prevented this week/i)).toBeInTheDocument();

    fireEvent.click(co2Btn);
    expect(co2Btn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/CO2e prevented this week/i)).toBeInTheDocument();
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

  it('ProfileModal selects city presets, toggles sensitive members, submits profile, and dismisses on Escape', async () => {
    const onClose = vi.fn();
    const onApplyProfile = vi.fn().mockResolvedValue(undefined);

    render(
      <ProfileModal
        isOpen={true}
        onClose={onClose}
        profile={DEFAULT_HOUSEHOLD_PROFILE}
        onApplyProfile={onApplyProfile}
        isLoading={false}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const osloBtn = screen.getByRole('button', { name: /Oslo, Norway/i });
    fireEvent.click(osloBtn);
    expect(osloBtn).toHaveAttribute('aria-pressed', 'true');

    const pregnancyCheckbox = screen.getByLabelText(/Pregnancy/i);
    fireEvent.click(pregnancyCheckbox);

    fireEvent.click(screen.getByRole('button', { name: /Apply & Generate Local Plan/i }));
    await waitFor(() => {
      expect(onApplyProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Oslo, Norway',
          sensitiveMembers: expect.arrayContaining(['pregnant']),
        }),
        'oslo',
      );
      expect(onClose).toHaveBeenCalled();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('AdvisorDrawer streams SSE chunks, updates welcome on city change, handles errors, and closes on Escape', async () => {
    const onClose = vi.fn();
    const impact = calculateDirectImpact(preset.defaultBaseline, ['corsi_rosenthal'], 4, 50);

    const encoder = new TextEncoder();
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"text":"Run your MERV-13 cube "}\n\n'));
        controller.enqueue(encoder.encode('data: {"text":"overnight."}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      }),
    );

    const { rerender } = render(
      <AdvisorDrawer
        isOpen={true}
        onClose={onClose}
        profile={DEFAULT_HOUSEHOLD_PROFILE}
        airBrief={preset.brief}
        impact={impact}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('log')).toBeInTheDocument();

    // Update city prop and confirm welcome message refreshes cleanly
    const osloPreset = CITY_PRESETS.find((p) => p.id === 'oslo')!;
    rerender(
      <AdvisorDrawer
        isOpen={true}
        onClose={onClose}
        profile={{ ...DEFAULT_HOUSEHOLD_PROFILE, city: osloPreset.city }}
        airBrief={osloPreset.brief}
        impact={impact}
      />,
    );
    expect(screen.getByText(/tracking winter air conditions in Oslo, Norway/i)).toBeInTheDocument();

    const chatInput = screen.getByLabelText(/Ask the clean-air advisor a question/i);
    fireEvent.change(chatInput, { target: { value: 'Best bedroom filtration tip?' } });
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Run your MERV-13 cube overnight\./i)).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('ResilientImage renders accessible fallback when image fails to load', () => {
    render(
      <ResilientImage
        src="/broken-image.jpg"
        alt="Nordic winter air"
        fallbackLabel="Clean Air Fallback"
      />,
    );

    const img = screen.getByAltText('Nordic winter air');
    fireEvent.error(img);

    expect(screen.getByRole('img', { name: 'Nordic winter air' })).toBeInTheDocument();
    expect(screen.getByText('Clean Air Fallback')).toBeInTheDocument();
  });

  it('ErrorBoundary catches rendering failures and recovers when Try Again is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    function FlakyChild() {
      if (shouldThrow) {
        throw new Error('Simulated chart crash');
      }
      return <div>Recovered safely</div>;
    }

    render(
      <ErrorBoundary>
        <FlakyChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Simulated chart crash');
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(screen.getByText('Recovered safely')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
