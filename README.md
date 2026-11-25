# VinterKlar — Winter Smog & Urban Clean-Air Assistant

[![VinterKlar CI](https://github.com/rockerspace/VinterKlar-Urban-Air-Quality-Assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/rockerspace/VinterKlar-Urban-Air-Quality-Assistant/actions/workflows/ci.yml)

VinterKlar is a GenAI-powered assistant that helps urban families and communities navigate severe winter smog, thermal inversions, and particulate pollution (`PM2.5` / `NOx`). It pairs live location-grounded air intelligence with tailored daily routines, indoor air quality hacks, sustainable alternatives, and a transparent Direct Impact Calculator.

---

## Chosen Vertical & Persona

- **Vertical**: Climate, Environmental Health & Sustainable Communities (Urban Winter Smog Mitigation)
- **Target Persona**: Urban and valley-basin families (parents, households with young children, asthma/respiratory sensitivities, or older adults) and school/neighborhood organizers seeking immediate, practical, and measurable ways to cut both personal pollution exposure and community emissions.

---

## GenAI Services Utilized & Integration Points

All AI calls run securely on the server side (`server.ts`) via the `@google/genai` SDK (`gemini-4-hydrogen`):

1. **Google Search Grounding (`/api/air-brief`)**: Retrieves real-time or seasonal winter air quality conditions, estimated AQI and `PM2.5` (`µg/m³`), thermal inversion windows, safest afternoon airing windows, primary local pollution drivers, and clickable web source citations (`groundingMetadata.groundingChunks`).
2. **Coordinate-to-City Resolution (`/api/resolve-city`)**: Uses structured JSON output (`responseSchema`) to convert browser geolocation coordinates into a normalized city name and winter topography context.
3. **Structured Playbook Generation (`/api/playbook`)**: Uses Gemini `responseSchema` to generate 6 tailored, household-specific recommendations across **Low-Emission Daily Routines**, **Indoor Air Quality Hacks**, and **Sustainable Alternatives**, each explaining the direct physical impact of the choice.
4. **Contextual Streaming Advisor (`/api/advisor/chat`)**: Uses `generateContentStream` over Server-Sent Events (SSE) for real-time follow-up Q&A pre-seeded with the family's city, current smog brief, home setup, and active calculator choices.

---

## Approach & Logic

1. **Hybrid GenAI + Deterministic Physics Engine**:
   - **Why**: LLM calls excel at local context, synthesis, and qualitative coaching, while interactive sliders and checkboxes require instantaneous (<16ms), deterministic, auditable math.
   - **How**: Gemini grounds the local atmospheric brief and tailors actionable playbooks, while `src/data/cleanAirData.ts` (`calculateDirectImpact`) runs a transparent indoor-air and emissions model synchronously in the browser.
2. **Direct Impact Modeling**:
   - **Indoor PM2.5**: `I_indoor = (I_outdoor × I/O_infiltration × filtration_factor) + indoor_cooking_load`, modeling draft sealing, MERV-13 Corsi-Rosenthal filtration (~52% steady-state reduction), and induction vs. gas stove spikes.
   - **Inhaled Dose & Equivalency**: Combines 20 hours indoor breathing (`11.5 m³/day`) and 4 hours outdoor/commute air (`3.0 m³/day`), showing percentage dose reduction and Berkeley Earth cigarette-equivalent exposure (`22 µg/m³ ≈ 1 cigarette/day`).
   - **Direct Emissions Avoided**: Models cold-start winter driving (`0.038 g PM2.5/km`, `0.45 g NOx/km`, `0.22 kg CO2e/km`), residential wood burning (`18.5 g PM2.5/hr`, `2.4 g NOx/hr`), idling avoidance, and gas cooking NOx.
3. **7-Day Trajectory & Community Scaling**:
   - Projects a 7-day rolling exposure/carbon comparison chart via **Recharts** (`EmissionChart.tsx`).
   - Scales household commitments to `10`, `50`, or `250` neighborhood households with one-click pledge copy, `.txt` summary download, and printable checklist export.

---

## How the Solution Works

1. **Set Location & Household Profile**: Choose a winter-smog preset (`Salt Lake City`, `New Delhi`, `Kraków`, `Oslo`), enter any city, or use browser geolocation, and configure household size, sensitive members, heating type, commute mode, cooking fuel, and home envelope tightness.
2. **Review Grounded Local Brief**: Inspect current AQI/`PM2.5`, peak inversion hours, and the safest afternoon airing window with cited sources.
3. **Simulate Choices in the Direct Impact Calculator**: Adjust baseline sliders and toggle 8 concrete interventions to immediately see indoor `PM2.5` drops, weekly/seasonal emissions prevented, and the 7-day Recharts trajectory.
4. **Follow & Export Your Playbook**: Adopt habits from the Gemini-tailored playbook, size a Corsi-Rosenthal purifier in the Indoor Air Lab, ask follow-up questions in the streaming Clean-Air Advisor, and download or print the summary for your school or neighborhood.

---

## Assumptions Made

- **Infiltration & Breathing Rates**: Assumes an average residential winter indoor/outdoor `PM2.5` infiltration ratio (`0.62` unsealed, `0.51` weatherstripped) and a representative `14.5 m³/day` total daily inhalation volume (`20h` indoor / `4h` outdoor).
- **Winter Season Length**: Seasonal totals assume a 90-day (~13-week) winter inversion period.
- **Emission Factors**: Cold-start passenger vehicle, wood-burning, and gas-cooking factors represent published urban EPA/WHO reference averages for comparative decision-making rather than site-specific stack measurements.
- **Browser Persistence**: Household preferences and adopted habits persist locally via `localStorage` for zero-friction access without mandatory sign-in walls.

---

## Local Development & Verification

```bash
npm install
# Configure GEMINI_API_KEY in .env (see .env.example)
npm run dev
```

- `npm test` — Run automated Vitest unit, Express API integration, security-validation, and React accessibility tests
- `npm run lint` — Strict TypeScript type check (`tsc --noEmit` with `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- `npm run build` — Production Vite bundle
- `npm start` — Run production Express server (`server.ts`)

### Architecture & Security Hardening
- **Modular Server (`serverApp.ts`, `serverPrompts.ts`, `serverHelpers.ts`, `server.ts`)**: Decoupled Express application factory with sliding-window per-IP rate limiting on `/api/*`, hardened HTTP security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`, `Cross-Origin-Opener-Policy`, HSTS in production), strict allowlist profile validation, control-character/newline sanitization, safe JSON syntax error responses, and internal 500 error masking.
- **Modular Frontend (`src/hooks/`, `src/utils/`, `src/components/`)**: Custom `useVinterKlarState` (abort-safe fetches + `localStorage` persistence) and `useDialogA11y` (keyboard focus trapping, focus restoration, Escape dismissal) hooks, pure domain helpers (`calculateDirectImpact`, `calculateRoomCadr`, `isSafeHttpUrl`), and full WCAG semantics (`aria-valuetext`, `aria-live`, `role="log"`, `<fieldset>`/`<legend>`, `<caption class="sr-only">`, `scope="col"`/`scope="row"`).

### Test Coverage
- **Physics & Emission Engine (`src/tests/cleanAirData.test.ts`)**: Verifies indoor PM2.5 infiltration math, filtration reductions, household-wide inhaled dose scaling, cold-start/woodsmoke/cooking emission factors, community multiplier scaling, and zero-value edge cases.
- **Shared Utilities (`src/tests/utils.test.ts`)**: Verifies URL protocol safety filtering and room CADR / Corsi-Rosenthal sizing math.
- **Server Security & Express Integration (`serverHelpers.test.ts`, `serverApp.test.ts`)**: Verifies allowlist profile sanitization, control-character stripping, coordinate bounds, chat capping, sliding-window rate limiting (`429`), malformed JSON (`400`), HTTP security headers, and SSE streaming across all 4 `/api/*` endpoints.
- **UI Components & SPA Integration (`src/tests/components.test.tsx`, `src/tests/App.test.tsx`)**: Verifies every interactive module (`ImpactCalculator`, `PlaybookSection`, `IndoorLabSection`, `EmissionChart`, `CommunitySection`, `ProfileModal`, `AdvisorDrawer` SSE streaming, `ResilientImage`, `ErrorBoundary`) and full `App` localStorage + API flows.
