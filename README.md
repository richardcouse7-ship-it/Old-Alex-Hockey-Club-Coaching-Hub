# Old Alex Hockey Club Coaching Hub

A dedicated single-user coaching operations workspace engineered specifically for **Old Alexandra Hockey Club** (Milltown AstroTurf, Dublin 6, Ireland). 

The hub is purpose-built around Sunday coaching operations and the workflow of the **Director of Coaching / Head of Youth & Player Development**, coordinating pitch allocations, coach coverage, matchday fixtures, player safety, and rapid pitchside communications across all youth and junior age grades (U8 through U16).

---

## Current Capabilities

The application provides a comprehensive suite of pitchside management and tactical planning tools:

- **Sunday Timetable**: Spatial pitch grid (Pitch 1 and Pitch 2 sectors) and chronological timeline views, unallocated slot tracking, weather delay schedule shifts, and dedicated away match isolation (away sessions do not collide with Milltown pitches or distort local pitch utilisation).
- **Attendance & Safety**: Pitchside squad roll calls (Present, Absent, Injured, Late), mandatory safety compliance checks (mouthguard and shinguard verification), and instant emergency contact lookups.
- **Weekly Planning**: Multi-day weekly training schedules, cross-pitch allocations, and prebuilt Sunday master templates aligned with age-grade pathways.
- **Fixtures & Matchday Operations**: Leinster League, Cup, and friendly match tracking, pitch conflict detection, score recorder, and away match logistics with pushback meet times.
- **Drill Library**: Categorized drill repository aligned to the Leinster development curriculum, tactical whiteboard sketcher, and interactive animated drill diagrams.
- **Coach Roster & Availability**: 31-coach roster management, weekly availability tracking, and 1-click smart auto-allocation into uncovered pitch slots.
- **Kit & First Aid**: Sector gear allocations, kit shed inventory tracking (balls, bibs, cones, goalie gear), first aid incident logging, and supply restocking checklists.
- **Session Reviews & Debriefs**: Pitchside post-session feedback, developmental notes per age grade, and session archive for ongoing player progression tracking.
- **Blitz Tournament Management**: Multi-team tournament generator, automatic round-robin fixture scheduling, live match score updates, and real-time standings calculations.
- **Season Planning & Roadmaps**: Master club calendar overview, term and holiday schedules, Leinster match windows, and long-term curriculum milestone tracking.
- **Operational Exports & Communication Tools**: 1-click formatted WhatsApp broadcasts for parents, coaches, and team managers; printable/PDF pitch noticeboard sheets; and comprehensive Director briefing packs.

---

## Technology

The coaching hub is built on a modern, responsive frontend stack:

- **React 19** (`react`, `react-dom`): Modern React component architecture.
- **TypeScript** (`strict: true`): Strict end-to-end type safety across domain entities, state slices, and utility functions.
- **Vite 8** (`vite`, `@vitejs/plugin-react`): Fast development server and production bundler.
- **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`): Utility-first styling including custom pitchside high-contrast Sun Mode (`.sun-mode`).
- **Zustand 5** (`zustand`): Modular domain slices, actions, and memoized selectors.
- **localStorage**: Versioned browser-local storage for instant, zero-latency persistence.
- **Persistence Adapter Architecture**: Type-safe storage interface abstracting underlying persistence operations.
- **Vitest 5** (`vitest`): Fast, ESM-native unit and integration test runner.

---

## Architecture

The application relies on Zustand as the single authoritative client state layer. React components never interact directly with raw browser storage; they read state through store hooks and memoized selectors, and perform updates exclusively via dispatched store actions.

```
React UI
  └── Zustand Store (`useAppStore`)
        └── Domain Slices & Selectors (`src/store/slices/`, `src/store/selectors.ts`)
              └── Persistence Adapter Contract (`PersistenceAdapter`)
                    └── LocalStoragePersistenceAdapter (`src/store/persistence/`)
                          └── Browser localStorage (`oldalex_*` keys)
```

The `PersistenceAdapter` interface decouples the application state layer from storage details, enabling isolated unit testing and clean state synchronization.

---

## Data Persistence

The Coaching Hub is fully **client-side and local-first**:

- **No Remote Backend Required**: The application runs entirely in the browser with no remote database, server process, or third-party API key (such as `GEMINI_API_KEY`) required to function.
- **Preserve Existing Data**: Persisted user data strictly takes precedence over default seed data on hydration. Existing user records are preserved across app reloads and updates.
- **Storage Key Integrity**: `localStorage` keys (using the `oldalex_*` namespace) must **never be renamed or deleted casually**, as doing so will disconnect user state.
- **Defensive Fallback & Migration**: Defensive schema validation and migration safeguards (`migration.ts`) ensure that corrupted or partially formed payloads fall back gracefully without interrupting application startup.

---

## Development Commands

All development tasks are managed via standard `npm` scripts defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 3000 (`http://localhost:3000`) with host exposure |
| `npm run build` | Compiles TypeScript and builds production bundles into `dist/` |
| `npm run preview` | Locally previews the production build output |
| `npm run lint` | Runs TypeScript compiler type-checking (`tsc --noEmit`) |
| `npm test` | Runs the automated Vitest test suite once (`vitest run`) |
| `npm run test:watch` | Runs Vitest in interactive watch mode for test-driven development |
| `npm run clean` | Removes build output artifacts (`rm -rf dist server.js`) |

---

## Testing & Verification

The project maintains an automated test suite powered by Vitest, verifying domain state transitions, data migrations, schedule parsers, and conflict-detection selectors:

- **Test Suite Status**: **9 test files, 47 passing tests**
- **Test Command**: `npm test`
- **Coverage Areas**:
  - `src/store/__tests__/slots.test.ts`: Pitch session slot CRUD and allocation logic
  - `src/store/__tests__/coaches.test.ts`: Coach roster updates and availability toggles
  - `src/store/__tests__/fixtures.test.ts`: Matchday fixture scheduling and venue handling
  - `src/store/__tests__/attendance.test.ts`: Roll call recording and safety checks
  - `src/store/__tests__/preferences.test.ts`: User preferences, sun mode, and UI configuration
  - `src/store/__tests__/selectors.test.ts`: Pitch conflict detection and utilization calculation
  - `src/store/__tests__/persistence.test.ts`: Persistence adapter contracts and storage reads/writes
  - `src/store/__tests__/store.test.ts`: Store hydration and defensive fallback on corrupt payloads
  - `src/utils/__tests__/scheduleImportParser.test.ts`: Schedule import parsing and validation

---

## Project Principles

1. **Sunday Operations First**: Optimized for the time-critical tempo and operational reality of Sunday mornings at Milltown, handling multi-age-grade pitch turnarounds seamlessly.
2. **Pitchside Usability**: Engineered for outdoor use in rain, bright sunlight, and cold weather with high-contrast Sun Mode, generous touch targets (minimum 44px), screen wake lock, and pitch timer whistle audio.
3. **Simple, Reliable Workflows**: 1-click coach allocations, fast WhatsApp broadcast copy-formatting, and instant printable noticeboard sheets that work without friction.
4. **Data Safety**: Non-destructive migrations, defensive payload parsing, and reliable local storage preserve user schedules and notes across sessions.
5. **Zero Unnecessary SaaS Complexity**: Avoids user accounts, login friction, cloud subscriptions, remote database dependencies, and unwanted background telemetry in favor of an immediate, reliable, local-first workflow.