import { useState } from 'react';
import { ResilientImage } from './ResilientImage';
import { calculateRoomCadr } from '../utils/cadr';

const ROOM_PRESETS = [
  { label: 'Bedroom (16 m²)', areaM2: 16 },
  { label: 'Living Room (35 m²)', areaM2: 35 },
  { label: 'Open Plan (60 m²)', areaM2: 60 },
];

const SUSTAINABLE_SWAPS = [
  {
    habit: 'Morning School & Errand Run',
    conventional: 'Solo gas car cold-start (8 km)',
    alternative: 'Cargo e-bike, transit, or 2-family carpool',
    directImpact: '-50 to -100% cold-start tailpipe soot & street NOx',
    winterSavings: '$280–$460 fuel saved / winter',
  },
  {
    habit: 'Daily Boiling & Stove Cooking',
    conventional: 'Unvented gas range flame',
    alternative: 'Portable 1800W induction burner + electric kettle',
    directImpact: '-75% indoor NO2 spikes & lower cooking PM2.5',
    winterSavings: '$65 appliance · 5 yr lifespan',
  },
  {
    habit: 'Evening Comfort Heating',
    conventional: 'Fireplace / woodstove (4 hrs/wk)',
    alternative: 'Radiant zone heater + 2°C central setback',
    directImpact: '-74 g ultra-fine PM2.5/wk (~480 km car equiv./hr)',
    winterSavings: 'Burn-ban compliant · ~$120 saved',
  },
  {
    habit: 'Bedroom & Living Air Cleaning',
    conventional: 'Cracked window or no filtration',
    alternative: 'DIY 4-filter MERV-13 Corsi-Rosenthal cube',
    directImpact: '-52% steady-state indoor PM2.5 (4.5 ACH)',
    winterSavings: '~$65 build vs $250+ commercial HEPA',
  },
];

export function IndoorLabSection() {
  const [roomAreaM2, setRoomAreaM2] = useState<number>(35);
  const [ceilingM, setCeilingM] = useState<number>(2.6);

  const { areaSqFt, requiredCadrM3h, requiredCadrCfm, cubesNeeded } = calculateRoomCadr(
    roomAreaM2,
    ceilingM,
  );

  return (
    <section
      id="indoor-air"
      className="py-14 border-t border-[#D8E2DF]"
      aria-labelledby="indoor-lab-heading"
    >
      <div className="mb-8">
        <p className="text-xs font-medium text-[#175946] tracking-wide mb-1.5">
          Indoor Air Quality Lab & Sustainable Alternatives
        </p>
        <h2
          id="indoor-lab-heading"
          className="text-2xl sm:text-3xl font-bold text-[#13221F] tracking-tight"
        >
          High-impact indoor clean-air setups and everyday winter swaps
        </h2>
      </div>

      {/* Two-Column Editorial + Interactive Sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
        {/* Left: DIY Corsi-Rosenthal Visual + Sizing Calculator */}
        <div className="lg:col-span-6 bg-white border border-[#D8E2DF] rounded-xl overflow-hidden flex flex-col">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#EDF2F0]">
            <ResilientImage
              src="/src/assets/images/indoor_corsi_rosenthal_purifier_1795005084597.jpg"
              alt="DIY Corsi-Rosenthal MERV-13 box fan air purifier in a sunlit Nordic living room"
              className="w-full h-full object-cover"
              fallbackLabel="Corsi-Rosenthal MERV-13 Cube Guide"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#4A5C58] mb-1.5">
                <span className="font-medium text-[#175946]">Room Air-Change Sizing Tool</span>
                <span aria-hidden="true">·</span>
                <span>Target 4.8 ACH for winter smog</span>
              </div>
              <h3 className="text-lg font-semibold text-[#13221F] mb-1.5">
                Size Your Corsi-Rosenthal Cube or HEPA Purifier
              </h3>
              <p className="text-xs text-[#4A5C58] leading-relaxed">
                A 20-inch box fan sealed to four 20×20 MERV-13 filters delivers ~450 CFM on medium
                speed—matching expensive commercial purifiers at a fraction of the cost.
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#D8E2DF]">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Room size presets">
                {ROOM_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={roomAreaM2 === preset.areaM2}
                    onClick={() => setRoomAreaM2(preset.areaM2)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      roomAreaM2 === preset.areaM2
                        ? 'bg-[#175946] text-white border-[#175946]'
                        : 'bg-[#F7F9F8] text-[#13221F] border-[#D8E2DF] hover:bg-[#EDF2F0]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="room-area-slider" className="text-[#4A5C58]">
                      Floor Area
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                      {roomAreaM2} m² ({areaSqFt} sq ft)
                    </span>
                  </div>
                  <input
                    id="room-area-slider"
                    type="range"
                    min={10}
                    max={90}
                    step={1}
                    value={roomAreaM2}
                    aria-valuetext={`${roomAreaM2} square meters (${areaSqFt} square feet)`}
                    onChange={(e) => setRoomAreaM2(Number(e.target.value))}
                    className="w-full nordic-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="ceiling-slider" className="text-[#4A5C58]">
                      Ceiling Height
                    </label>
                    <span className="font-mono tabular-nums font-semibold text-[#13221F]">
                      {ceilingM.toFixed(1)} m
                    </span>
                  </div>
                  <input
                    id="ceiling-slider"
                    type="range"
                    min={2.2}
                    max={3.8}
                    step={0.1}
                    value={ceilingM}
                    aria-valuetext={`${ceilingM.toFixed(1)} meters`}
                    onChange={(e) => setCeilingM(Number(e.target.value))}
                    className="w-full nordic-slider"
                  />
                </div>
              </div>

              <div
                aria-live="polite"
                className="grid grid-cols-3 gap-3 bg-[#F7F9F8] border border-[#D8E2DF] rounded-lg p-3.5"
              >
                <div>
                  <span className="block text-[11px] text-[#4A5C58]">Target CADR</span>
                  <span className="font-mono tabular-nums text-base font-bold text-[#13221F]">
                    {requiredCadrCfm} CFM
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#4A5C58]">Airflow Rate</span>
                  <span className="font-mono tabular-nums text-base font-bold text-[#13221F]">
                    {requiredCadrM3h} m³/h
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#4A5C58]">Recommended Units</span>
                  <span className="font-mono tabular-nums text-base font-bold text-[#175946]">
                    {cubesNeeded} {cubesNeeded === 1 ? 'Cube' : 'Cubes'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sustainable Commute Visual + Key IAQ Hacks */}
        <div className="lg:col-span-6 bg-white border border-[#D8E2DF] rounded-xl overflow-hidden flex flex-col">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#EDF2F0]">
            <ResilientImage
              src="/src/assets/images/sustainable_winter_commute_1795005087859.jpg"
              alt="Family electric cargo bike beside a Nordic timber transit shelter in winter morning light"
              className="w-full h-full object-cover"
              fallbackLabel="Low-Emission Winter Mobility"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#4A5C58] mb-1.5">
                <span className="font-medium text-[#175946]">Neighborhood Mobility & Air Exchange</span>
                <span aria-hidden="true">·</span>
                <span>Zero Tailpipe Cold-Starts</span>
              </div>
              <h3 className="text-lg font-semibold text-[#13221F] mb-2">
                Three Low-Cost Hacks That Stop Smog Indoors & Outdoors
              </h3>
              <div className="space-y-3 text-xs text-[#4A5C58] leading-relaxed">
                <div className="pb-2.5 border-b border-[#D8E2DF]">
                  <span className="font-semibold text-[#13221F] block mb-0.5">
                    1. Pulse-Ventilate During the Afternoon Dip (10 Minutes Only)
                  </span>
                  Keep windows latched during morning and evening inversions. Open opposite windows
                  for 10 minutes during the afternoon mixing trough to flush indoor CO2 without
                  soaking walls in peak smog.
                </div>
                <div className="pb-2.5 border-b border-[#D8E2DF]">
                  <span className="font-semibold text-[#13221F] block mb-0.5">
                    2. Create a Sealed Bedroom Clean-Air Sanctuary
                  </span>
                  Closing bedroom doors overnight with a single purifier running concentrates clean
                  air into one-third the volume, ensuring 8 hours of uninterrupted lung recovery.
                </div>
                <div>
                  <span className="font-semibold text-[#13221F] block mb-0.5">
                    3. Consolidate Errands So Engines Stay Warm
                  </span>
                  Catalytic converters stay cold below 300°C for the first 3–5 km of winter driving,
                  emitting 3–4× normal soot and NOx. Batching errands or swapping short hops to
                  transit cuts neighborhood cold-start pollution sharply.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainable Winter Swap Matrix */}
      <div className="bg-white border border-[#D8E2DF] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8E2DF]">
          <h3 className="text-base font-semibold text-[#13221F]">
            Sustainable Alternative Comparison Matrix
          </h3>
          <p className="text-xs text-[#4A5C58] mt-0.5">
            Direct comparison of common winter habits against clean-air alternatives
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              Comparison of conventional winter habits versus clean-air alternatives, direct
              exposure/emission impacts, and estimated winter savings.
            </caption>
            <thead>
              <tr className="bg-[#F7F9F8] border-b border-[#D8E2DF] text-xs font-semibold text-[#4A5C58]">
                <th scope="col" className="py-3 px-6">
                  Daily Activity
                </th>
                <th scope="col" className="py-3 px-4">
                  Conventional Habit
                </th>
                <th scope="col" className="py-3 px-4">
                  Clean-Air Alternative
                </th>
                <th scope="col" className="py-3 px-4">
                  Direct Impact
                </th>
                <th scope="col" className="py-3 px-6 text-right">
                  Cost / Savings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E2DF] text-xs">
              {SUSTAINABLE_SWAPS.map((row) => (
                <tr key={row.habit} className="hover:bg-[#F7F9F8] transition-colors">
                  <th scope="row" className="py-3.5 px-6 font-semibold text-[#13221F] text-left">
                    {row.habit}
                  </th>
                  <td className="py-3.5 px-4 text-[#4A5C58]">{row.conventional}</td>
                  <td className="py-3.5 px-4 font-medium text-[#175946]">{row.alternative}</td>
                  <td className="py-3.5 px-4 text-[#13221F]">{row.directImpact}</td>
                  <td className="py-3.5 px-6 text-right font-mono tabular-nums text-[#4A5C58] whitespace-nowrap">
                    {row.winterSavings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
