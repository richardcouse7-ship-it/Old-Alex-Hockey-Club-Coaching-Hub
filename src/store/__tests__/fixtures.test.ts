import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { MatchFixture } from '../../types';

describe('Match Fixtures Domain Actions', () => {
  const fixture1: MatchFixture = {
    id: 'fix-test-1',
    date: '2026-09-13',
    pushbackTime: '10:00',
    ageGroupOrTeam: 'Inters',
    competition: 'Leinster League',
    opposition: 'Railway Union HC',
    isHome: true,
    venue: 'Milltown Pitch 1 North',
    pitchSectorId: 'p1n',
    leadCoachOrManager: 'Ben McInerney',
    umpires: ['Sarah Byrne', 'Rachel Kelly'],
    status: 'Scheduled',
    notes: 'Home league opener',
  };

  const fixture2: MatchFixture = {
    id: 'fix-test-2',
    date: '2026-09-20',
    pushbackTime: '11:30',
    ageGroupOrTeam: 'Minors',
    competition: 'Cup Semi-Final',
    opposition: 'Avoca HC',
    isHome: false,
    venue: 'Newpark School',
    pitchSectorId: 'p1s',
    leadCoachOrManager: 'Hannah Fox',
    umpires: [],
    status: 'Scheduled',
  };

  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().setFixtures([fixture1, fixture2]);
  });

  it('adds a new fixture and preserves existing fixture list', () => {
    const newFixture: MatchFixture = {
      id: 'fix-test-3',
      date: '2026-09-27',
      pushbackTime: '14:00',
      ageGroupOrTeam: '5th Class',
      competition: 'Friendly',
      opposition: 'Monkstown HC',
      isHome: true,
      venue: 'Milltown Pitch 2',
      pitchSectorId: 'p2n',
      leadCoachOrManager: 'Amy Springs',
      umpires: [],
      status: 'Scheduled',
    };

    useAppStore.getState().addFixture(newFixture);

    const fixtures = useAppStore.getState().fixtures;
    expect(fixtures.length).toBe(3);
    expect(fixtures.find((f) => f.id === 'fix-test-3')?.opposition).toBe('Monkstown HC');
    expect(fixtures.find((f) => f.id === 'fix-test-1')?.opposition).toBe('Railway Union HC');
  });

  it('records match results, updating score, scorers, and status to Completed', () => {
    useAppStore.getState().recordMatchResult('fix-test-1', 4, 1, 'Sarah Byrne (2), Katie Mullan (2)');

    const fixture = useAppStore.getState().fixtures.find((f) => f.id === 'fix-test-1');
    expect(fixture?.status).toBe('Completed');
    expect(fixture?.homeScore).toBe(4);
    expect(fixture?.awayScore).toBe(1);
    expect(fixture?.result).toBe('4 - 1');
    expect(fixture?.goalscorers).toBe('Sarah Byrne (2), Katie Mullan (2)');

    // Ensure fixture 2 was untouched
    const fixture2Current = useAppStore.getState().fixtures.find((f) => f.id === 'fix-test-2');
    expect(fixture2Current?.status).toBe('Scheduled');
    expect(fixture2Current?.homeScore).toBeUndefined();
  });

  it('updates fixture details such as umpires and pushback time', () => {
    const target = useAppStore.getState().fixtures.find((f) => f.id === 'fix-test-2')!;

    useAppStore.getState().updateFixture({
      ...target,
      pushbackTime: '12:00',
      umpires: ['Official Umpire 1', 'Official Umpire 2'],
    });

    const updated = useAppStore.getState().fixtures.find((f) => f.id === 'fix-test-2');
    expect(updated?.pushbackTime).toBe('12:00');
    expect(updated?.umpires).toEqual(['Official Umpire 1', 'Official Umpire 2']);
  });

  describe('importLeinsterSeasonFixtures', () => {
    const importedFixtures: MatchFixture[] = [
      {
        id: 'fix-imp-1',
        date: '2026-10-11',
        pushbackTime: '10:30',
        ageGroupOrTeam: 'Inter A',
        rankedTeam: 'Inter A',
        trainingGroup: 'Inters',
        competition: 'Leinster Inter League Div 1',
        opposition: 'YMCA HC',
        isHome: true,
        venue: 'Milltown Pitch 1 (Full)',
        leadCoachOrManager: 'Richard Couse',
        umpires: ['Club Appointed'],
        status: 'Scheduled',
      },
      {
        id: 'fix-imp-2',
        date: '2026-10-11',
        pushbackTime: '12:00',
        ageGroupOrTeam: 'Inter B',
        rankedTeam: 'Inter B',
        trainingGroup: 'Inters',
        competition: 'Leinster Inter League Div 2',
        opposition: 'Pembroke Wanderers',
        isHome: false,
        venue: 'Serpentine Ave',
        leadCoachOrManager: 'Richard Couse',
        umpires: ['Club Appointed'],
        status: 'Scheduled',
      },
      {
        id: 'fix-imp-3',
        date: '2026-09-13',
        pushbackTime: '10:00',
        ageGroupOrTeam: 'Inters',
        rankedTeam: 'Inter A',
        trainingGroup: 'Inters',
        competition: 'Leinster League',
        opposition: 'Railway Union HC',
        isHome: true,
        venue: 'Milltown Pitch 1 (Full)',
        leadCoachOrManager: 'Richard Couse',
        umpires: ['Sarah Byrne'],
        status: 'Scheduled',
        notes: 'Updated via Leinster import',
      },
    ];

    it('completely replaces fixtures when mode is replace', () => {
      const result = useAppStore.getState().importLeinsterSeasonFixtures(importedFixtures, 'replace');

      expect(result.importedCount).toBe(3);
      expect(result.updatedCount).toBe(0);
      expect(result.totalCount).toBe(3);

      const current = useAppStore.getState().fixtures;
      expect(current).toHaveLength(3);
      expect(current.map((f) => f.id)).toEqual(['fix-imp-1', 'fix-imp-2', 'fix-imp-3']);
    });

    it('merges and deduplicates fixtures when mode is merge', () => {
      // Existing contains fixture1 (2026-09-13 Inters vs Railway Union HC)
      // importedFixtures contains a match on same date & team & opposition
      const result = useAppStore.getState().importLeinsterSeasonFixtures(importedFixtures, 'merge');

      // 2 new fixtures added, 1 existing updated
      expect(result.importedCount).toBe(2);
      expect(result.updatedCount).toBe(1);
      expect(result.totalCount).toBe(4);

      const current = useAppStore.getState().fixtures;
      // Original id preserved on merged fixture
      const merged = current.find((f) => f.id === 'fix-test-1');
      expect(merged).toBeDefined();
      expect(merged?.notes).toBe('Updated via Leinster import');
    });
  });
});
