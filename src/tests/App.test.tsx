import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { STORAGE_KEY } from '../hooks/useVinterKlarState';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App end-to-end integration', () => {
  it('renders core VinterKlar sections, opens dialogs, and persists settings in localStorage', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/air-brief') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              city: 'Oslo, Norway',
              estimatedAqi: 84,
              pm25UgM3: 27.5,
              severityLevel: 'Moderate',
              inversionWindow: '07:00 – 10:00',
              bestVentilationWindow: '12:00 – 15:00',
              primaryPollutants: 'Woodsmoke, road dust',
              advisorySummary: 'Light morning fjord inversion clearing by midday.',
              localTriggers: ['Evening woodstoves'],
              citations: [{ title: 'NILU Air Quality', url: 'https://nilu.no/air' }],
              fetchedAt: '10:15 AM',
              isLiveGrounded: true,
            }),
        });
      }
      if (url === '/api/playbook') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              city: 'Oslo, Norway',
              generatedAt: '10:15 AM',
              headlineInsight: 'Use heat-pump zone heating on calm sub-zero nights.',
              recommendations: [],
            }),
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Navigate winter smog with clear, measurable daily choices/i,
      }),
    ).toBeInTheDocument();

    // Open ProfileModal via header button, pick Oslo, and apply
    fireEvent.click(screen.getByRole('button', { name: /Update Location/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Oslo, Norway/i }));
    fireEvent.click(screen.getByRole('button', { name: /Apply & Generate Local Plan/i }));

    await waitFor(() => {
      expect(screen.getByText(/Light morning fjord inversion clearing by midday\./i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /NILU Air Quality/i })).toHaveAttribute(
        'href',
        'https://nilu.no/air',
      );
    });

    // Verify localStorage saved updated state
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as {
      profile?: { city?: string };
    };
    expect(persisted.profile?.city).toBe('Oslo, Norway');

    // Open Clean-Air Advisor drawer
    fireEvent.click(screen.getAllByRole('button', { name: /Ask Clean-Air Advisor/i })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent(/Clean-Air Family Advisor/i);
  });

  it('displays an accessible error alert if fetching the live local air brief fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Upstream air-quality service unavailable.' }),
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Check Live Local Air/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Upstream air-quality service unavailable.',
      );
    });
  });
});
