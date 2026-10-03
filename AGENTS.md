# AGENTS.md — Old Alex Hockey Club Coaching Hub

> **Project:** Old Alex Hockey Club Coaching Hub  
> **Organization:** Old Alexandra Hockey Club, Milltown, Dublin 6, Ireland  
> **Primary Persona:** Director of Coaching / Head of Youth  
> **Repository Root:** `C:\Users\richa\antigravity\Old-Alex-Hockey-Club-Coaching-Hub`  
> **Stack:** React 19, TypeScript 7, Tailwind CSS v4, Vite 8, Zustand 5, Vitest 5  

---

## 1. Project Mission & Domain Philosophy

The **Old Alex Coaching Hub** is a single-page web application engineered specifically for the operational, tactical, and communication needs of Old Alexandra Hockey Club's youth and junior sections at Milltown AstroTurf.

### Core Domain Principles
1. **Authentic Domain Model**:
   - **Pitches & Sectors**: Pitch 1 (Full, Half A, Half B) and Pitch 2 (Sectors A, B, C, D).
   - **Age Grades & Pathways**: 15 distinct squads across Foundation (U8/U10/U12), Development (U14/U16), and Senior/Junior Performance pathways.
   - **Leinster Hockey Alignment**: Match fixtures, tournaments (Blitzes), and skill development curricula align with Leinster Hockey regulations and schedules.
2. **Pitchside Ergonomics**:
   - Must function reliably outdoors in bright sunlight and wet conditions.
   - **Sun Mode** (`.sun-mode` in `src/index.css`) provides high-contrast UI with deep borders and stark visibility.
   - Generous touch targets (min 44px) for gloved/cold hands on mobile and iPad screens.
   - Screen Wake Lock API and audio whistle synthesizers assist live pitch management.
3. **Away Fixtures & Schedule Importer**:
   - **Away Exclusivity**: Any session with `isAway: true` or `pitchSectorId: 'away'` (or travelling to external grounds such as Wesley, Mount Temple, High School, Drogheda, etc.) **must never** occupy Milltown Pitch 1 or Pitch 2 cells.
   - **Dedicated Sub-Section**: Away fixtures appear in their own dedicated sub-section directly beneath the turf matrix and timeline views, with squad meet times (45m prior to pushback), venue Google Maps links, and WhatsApp match briefings.
   - **Schedule Importer**: Uses `src/utils/scheduleImportParser.ts` to parse multi-line tab-separated Google Sheets and Excel pastes into structured `SessionSlot` and `MatchFixture` records.
4. **Frictionless Communication**:
   - 1-click formatted exports for WhatsApp broadcasts to parents, coaches, and team managers.
   - Clean tabular print/PDF exports for pitch noticeboards.

---

## 2. Technical Architecture & Conventions

### Directory Map
```
src/
├── components/          # Domain-driven UI components & views
│   ├── Attendance/      # Safety roll call, mouthguard/shinguard checks
│   ├── Blitz/           # Tournament & mini-blitz match generators
│   ├── CoachAvailability/ # 31-coach roster & smart auto-allocations
│   ├── Common/          # Shared modals, error boundaries, UI atoms
│   ├── DrillLibrary/    # 40+ drill cards, tactical animator, whiteboard
│   ├── Fixtures/        # Leinster League/Cup fixtures, results, pitch conflict checks
│   ├── PitchSideCompanion/ # Live timer, whistle synth, sector whiteboard
│   ├── Timetable/       # Sunday master timetable, spatial turf grid
│   └── WeeklyPlanner/   # Mon-Sun cross-pitch training schedule
├── constants/           # Initial data seeds, master templates, season calendars
├── services/            # Export generation, Google integration, storage APIs
├── store/               # Sliced Zustand state management
│   ├── persistence/     # Type-safe Storage Adapter, schema migrations
│   ├── slices/          # coaches, drills, fixtures, slots, ui, etc.
│   ├── selectors.ts     # Memoized/derived state queries
│   └── types.ts         # Store contracts and action signatures
├── types/               # Core domain TypeScript interfaces
└── utils/               # Parsers, formatters, fixture generators
```

### State Management & Persistence Guidelines
- **Zustand Slices**: All application state is partitioned into modular slices (`src/store/slices/`).
- **Persistence Adapter**: State persistence is decoupled through `PersistenceAdapter` (`LocalStoragePersistenceAdapter`).
- **Schema Migrations**: Any modification to data structures must be accompanied by migration logic in `src/store/persistence/migration.ts`. Never perform raw, unvalidated writes to `localStorage`.
- **Derived State**: Use `src/store/selectors.ts` for computed values (e.g. readiness scores, pitch conflict detection, unallocated coach pools).

### Styling & CSS Rules
- **Tailwind CSS v4**: Use `@tailwindcss/vite`.
- Avoid heavy UI libraries or unnecessary runtime styling abstractions.
- Preserve contrast ratios and test all new components in both standard theme and `.sun-mode`.

---

## 3. Development Workflow & Quality Standards

### Common Commands
- **Dev Server**: `npm run dev` (Runs Vite on port 3000, host `0.0.0.0`)
- **Type Check / Lint**: `npm run lint` (`tsc --noEmit`)
- **Unit & Integration Tests**: `npm test` (`vitest run`)
- **Watch Tests**: `npm run test:watch` (`vitest`)
- **Production Build**: `npm run build` (`vite build`)

### Verification Checklist for AI Agents
Before finishing any task:
1. **Type Safety**: Execute `npm run lint` to verify zero TypeScript errors.
2. **Test Suite**: Run `npm test` to ensure all existing and new unit tests pass.
3. **No Phantom Dependencies**: Do not import or re-introduce unused dependencies (`@google/genai`, `express`, `dotenv`).
4. **Data Integrity**: Ensure default data seeds in `src/constants/initialData.ts` and `sundayMasterTemplates.ts` remain intact and backward compatible.
