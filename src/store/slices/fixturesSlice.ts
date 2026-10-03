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
});
