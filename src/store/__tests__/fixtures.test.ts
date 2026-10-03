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
});
