# AGENTS.md — Old Alex Hockey Club Coaching Hub

> **Project:** Old Alex Hockey Club Coaching Hub  
> **Organization:** Old Alexandra Hockey Club, Milltown, Dublin 6, Ireland  
> **Primary Persona:** Director of Coaching / Head of Youth & Player Development  
> **Repository Root:** `C:\Users\richa\antigravity\Old-Alex-Hockey-Club-Coaching-Hub-v2`  
> **Stack:** React 19, TypeScript, Tailwind CSS v4, Vite 8, Zustand 5, Vitest 5  

---

## 1. Project Mission & Domain Principles

The **Old Alex Coaching Hub** is a single-page web application engineered specifically for the operational, tactical, and communication needs of Old Alexandra Hockey Club's youth and junior sections at Milltown AstroTurf.

### Core Domain Principles
1. **Club & Sunday Operations**:
   - **Pitches & Sectors**: Pitch 1 (Full, Half A, Half B) and Pitch 2 (Sectors A, B, C, D).
   - **Age Grades & Pathways**: 15 distinct squads across Foundation (U8/U10/U12), Development (U14/U16), and Senior/Junior Performance pathways.
   - **Leinster Hockey Alignment**: Match fixtures, tournaments (Blitzes), and skill development curricula align with Leinster Hockey regulations and schedules.
2. **Pitchside Ergonomics**:
   - Must function reliably outdoors in bright sunlight, rain, and cold conditions.
   - **Sun Mode** (`.sun-mode` in `src/index.css`) provides high-contrast UI with deep borders and stark visibility.
   - Generous touch targets (min 44px) for gloved/cold hands on mobile devices and iPads.
   - Screen Wake Lock API and audio whistle synthesizers (Web Audio API) assist live pitch management.
3. **Away-Session Contract**:
   - **Identification**: Any session where `isAway: true` or `pitchSectorId: 'away'` (or travelling to external grounds such as Wesley, Mount Temple, High School, Drogheda, etc.) is an off-site away match.
   - **Pitch Isolation**: Away sessions **must never** participate in Milltown Pitch 1 or Pitch 2 collision checks.
   - **Utilization Guard**: Away sessions **must never** inflate Milltown pitch utilisation calculations.
   - **Dedicated Sub-Section**: Away sessions are isolated into the dedicated Away Fixtures subsection in the timetable view, displaying meet times (45m prior to pushback), venue Google Maps links, and WhatsApp match briefings.
4. **Frictionless Communication**:
   - 1-click formatted exports for WhatsApp broadcasts to parents, coaches, and team managers.
   - Clean tabular print/PDF exports for pitch noticeboards.

---

## 2. Technical Architecture & State Management

### Architecture Data Flow
```
React UI Components
  └── Zustand Application Store (`useAppStore` in src/store/)
        └── Domain Slices & Selectors (`src/store/slices/`, `src/store/selectors.ts`)
              └── Persistence Adapter Contract (`PersistenceAdapter` in src/store/persistence/)
                    └── LocalStoragePersistenceAdapter
                          └── StorageService (`src/services/storageService.ts`)
                                └── Browser `localStorage` (`oldalex_*` keys)
```

- **Authoritative State Layer**: The Zustand store (`useAppStore`) is the single authoritative application state layer.
- **Access Rule**: React components **must not** directly access `StorageService` or domain `localStorage`. All state queries use store hooks or memoized selectors; all mutations invoke store actions.

### Directory Map
```
src/
├── components/          # Domain-driven UI views (Timetable, Fixtures, Attendance, CoachAvailability, etc.)
├── data/                # Initial seeds, master templates, season calendars (NOTE: never constants/)
├── services/            # Export generation, Google integration, storage APIs
├── store/               # Sliced Zustand state management
│   ├── persistence/     # Type-safe Storage Adapter, schema migrations, defensive fallback
│   ├── slices/          # Modular domain slices (slots, coaches, drills, fixtures, operations, etc.)
│   ├── selectors.ts     # Memoized/derived state queries (conflicts, utilization, slot filters)
│   └── types.ts         # Store contracts and action signatures
├── types/               # Core domain TypeScript interfaces
└── utils/               # Parsers (scheduleImportParser), awayFixtureUtils, time helpers
```

### Data Safety & Persistence Invariants
- **Key Compatibility**: Existing `oldalex_*` localStorage keys must remain strictly compatible across updates.
- **User Precedence**: Persisted user data in `localStorage` strictly takes precedence over seed data in `src/data/`.
- **Non-Destructive Migrations**: Never perform destructive schema migrations; use defensive fallbacks (`src/store/persistence/migration.ts`) so corrupted or partial payloads never crash startup.
- **No Unapproved Resets**: Never reset user data without explicit user approval.
- **Key Preservation**: Never rename or delete existing persistence keys as part of routine development.

---

## 3. Explicitly Out of Scope (Unless Requested)

Do **not** introduce any of the following features without explicit instruction:
- Authentication or user accounts
- Multi-tenancy
- Parent portal
- In-app chat / messaging backends
- E-commerce or payment processing
- GPS tracking or wearable device telemetry
- Video hosting or heavy media streaming
- Cloud persistence or remote databases
- Enterprise permission matrices
- Unnecessary external third-party integrations
- Unnecessary AI functionality or phantom SDKs

---

## 4. Testing & Verification Baseline

- **Test Suite**: Vitest is actively configured with **9 test files and 47 passing tests** covering slots, coaches, fixtures, attendance, preferences, selectors, store hydration, defensive migration, and schedule import parsing.
- **Test Command**: `npm test` (`vitest run`).
- **Browser/CDP Regression**: Browser-level and Chrome DevTools Protocol (CDP) checks are used when verifying pitchside interactions, responsive viewports, and visual flows.

---

## 5. Development Discipline & Workflow

Before making substantial changes:
1. **Inspect**: Inspect the relevant existing implementation files.
2. **Identify**: Identify affected domains, slices, and selectors.
3. **Check Tests**: Check existing unit tests covering the area.
4. **Propose**: State the proposed approach clearly.
5. **Minimal Coherent Edits**: Make the smallest coherent change necessary. Do **not** refactor unrelated code during feature work.
6. **Type Safety**: Run `npx tsc --noEmit` (or `npm run lint`).
7. **Linting**: Run `npm run lint`.
8. **Unit Tests**: Run `npm test` to guarantee all tests pass.
9. **Build Verification**: Run `npm run build` to verify production bundling.
10. **Workflow Verification**: Verify affected user workflows and ensure UI changes preserve pitchside ergonomics and Sun Mode contrast.
