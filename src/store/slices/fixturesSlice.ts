import { AppSliceCreator, FixturesSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { MatchFixture } from '../../types';

export const createFixturesSlice: AppSliceCreator<FixturesSlice> = (set, get) => ({
  fixtures: [],

  setFixtures: (fixtures: MatchFixture[]) => {
    set({ fixtures });
    persistenceAdapter.saveKey('fixtures', fixtures);
  },

  addFixture: (fixture: MatchFixture) => {
    const next = [fixture, ...get().fixtures];
    set({ fixtures: next });
    persistenceAdapter.saveKey('fixtures', next);
  },

  updateFixture: (fixture: MatchFixture) => {
    const next = get().fixtures.map((f) => (f.id === fixture.id ? fixture : f));
    set({ fixtures: next });
    persistenceAdapter.saveKey('fixtures', next);
  },

  recordMatchResult: (fixtureId, homeScore, awayScore, scorers) => {
    const next = get().fixtures.map((f) => {
      if (f.id === fixtureId) {
        return {
          ...f,
          homeScore,
          awayScore,
          goalscorers: scorers,
          result: `${homeScore} - ${awayScore}`,
          status: 'Completed' as const,
        };
      }
      return f;
    });
    set({ fixtures: next });
    persistenceAdapter.saveKey('fixtures', next);
  },

  importLeinsterSeasonFixtures: (importedFixtures, mode) => {
    if (mode === 'replace') {
      set({ fixtures: importedFixtures });
      persistenceAdapter.saveKey('fixtures', importedFixtures);
      return {
        importedCount: importedFixtures.length,
        updatedCount: 0,
        totalCount: importedFixtures.length,
      };
    }

    // Merge mode: Deduplicate and update based on date, opposition, and normalized team/group
    const currentFixtures = [...get().fixtures];
    let updatedCount = 0;
    let importedCount = 0;

    const isSameFixture = (a: MatchFixture, b: MatchFixture) => {
      if (a.date !== b.date) return false;

      const oppA = (a.opposition || '').toLowerCase().trim();
      const oppB = (b.opposition || '').toLowerCase().trim();
      if (oppA !== oppB) return false;

      const teamA = (a.rankedTeam || a.ageGroupOrTeam || '').toLowerCase().trim();
      const teamB = (b.rankedTeam || b.ageGroupOrTeam || '').toLowerCase().trim();
      if (teamA === teamB) return true;

      // Handle singular/plural and rank suffix (e.g. "inters" vs "inter a")
      const baseA = teamA.replace(/\s+[a-e]\b/i, '').replace(/s$/, '');
      const baseB = teamB.replace(/\s+[a-e]\b/i, '').replace(/s$/, '');
      return baseA.length > 2 && baseA === baseB;
    };

    for (const item of importedFixtures) {
      const existingIdx = currentFixtures.findIndex((curr) => isSameFixture(curr, item));
      if (existingIdx !== -1) {
        currentFixtures[existingIdx] = {
          ...currentFixtures[existingIdx],
          ...item,
          id: currentFixtures[existingIdx].id, // retain primary key
        };
        updatedCount++;
      } else {
        currentFixtures.push(item);
        importedCount++;
      }
    }

    set({ fixtures: currentFixtures });
    persistenceAdapter.saveKey('fixtures', currentFixtures);
    return {
      importedCount,
      updatedCount,
      totalCount: currentFixtures.length,
    };
  },
});
