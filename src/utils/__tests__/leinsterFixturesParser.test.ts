import { describe, it, expect } from 'vitest';
import {
  parseCSVToGrid,
  normalizeLeinsterDate,
  normalizePushbackTime,
  resolveTrainingGroupAndRank,
  resolveLeinsterVenue,
  parseLeinsterFixturesCSV,
  SAMPLE_LEINSTER_SEASON_CSV,
} from '../leinsterFixturesParser';

describe('Leinster Hockey Fixtures Parser & Multi-Ranked Team Resolver', () => {
  describe('parseCSVToGrid', () => {
    it('correctly splits standard comma-separated lines', () => {
      const csv = 'Date,Time,Home,Away\n11/10/2026,11:00,Old Alex,Loreto';
      const grid = parseCSVToGrid(csv);
      expect(grid).toHaveLength(2);
      expect(grid[0]).toEqual(['Date', 'Time', 'Home', 'Away']);
      expect(grid[1]).toEqual(['11/10/2026', '11:00', 'Old Alex', 'Loreto']);
    });

    it('handles tab-separated values (TSV) from web table copies', () => {
      const tsv = 'Date\tTime\tHome\tAway\n11/10/2026\t11:00\tOld Alex\tLoreto';
      const grid = parseCSVToGrid(tsv);
      expect(grid).toHaveLength(2);
      expect(grid[1][2]).toBe('Old Alex');
      expect(grid[1][3]).toBe('Loreto');
    });

    it('handles quoted values with embedded commas', () => {
      const csv = '"Date","Match Title","Venue"\n"11/10/2026","Old Alex, Minor A","Serpentine, Dublin 4"';
      const grid = parseCSVToGrid(csv);
      expect(grid[1][1]).toBe('Old Alex, Minor A');
      expect(grid[1][2]).toBe('Serpentine, Dublin 4');
    });
  });

  describe('normalizeLeinsterDate', () => {
    it('normalizes DD/MM/YYYY to ISO format', () => {
      expect(normalizeLeinsterDate('11/10/2026')).toBe('2026-10-11');
      expect(normalizeLeinsterDate('04/04/2027')).toBe('2027-04-04');
    });

    it('normalizes textual dates', () => {
      expect(normalizeLeinsterDate('11 Oct 2026')).toBe('2026-10-11');
      expect(normalizeLeinsterDate('Sunday 21 March 2027')).toBe('2027-03-21');
    });

    it('infers season year when year is omitted (Autumn = 2026, Spring = 2027)', () => {
      expect(normalizeLeinsterDate('18/10', 2026)).toBe('2026-10-18');
      expect(normalizeLeinsterDate('14/02', 2026)).toBe('2027-02-14');
    });
  });

  describe('normalizePushbackTime', () => {
    it('converts 12-hour AM/PM format to 24-hour', () => {
      expect(normalizePushbackTime('11:00am')).toBe('11:00');
      expect(normalizePushbackTime('1:30pm')).toBe('13:30');
      expect(normalizePushbackTime('2pm')).toBe('14:00');
    });

    it('standardizes 24-hour format', () => {
      expect(normalizePushbackTime('14:30')).toBe('14:30');
      expect(normalizePushbackTime('9:30')).toBe('09:30');
    });
  });

  describe('resolveTrainingGroupAndRank', () => {
    it('resolves Inters with letter ranks A through D', () => {
      const a = resolveTrainingGroupAndRank('Old Alex Inter A');
      expect(a.trainingGroup).toBe('Inters');
      expect(a.rankedTeam).toBe('Inter A');
      expect(a.rankLetter).toBe('A');

      const c = resolveTrainingGroupAndRank('Inter C');
      expect(c.trainingGroup).toBe('Inters');
      expect(c.rankedTeam).toBe('Inter C');
      expect(c.rankLetter).toBe('C');
    });

    it('resolves Minors with letter ranks A through C', () => {
      const a = resolveTrainingGroupAndRank('Minor A');
      expect(a.trainingGroup).toBe('Minors');
      expect(a.rankedTeam).toBe('Minor A');

      const b = resolveTrainingGroupAndRank('Old Alex Minor B');
      expect(b.trainingGroup).toBe('Minors');
      expect(b.rankedTeam).toBe('Minor B');
    });

    it('resolves 1st Years and 6th Class squads with ranks', () => {
      const fy = resolveTrainingGroupAndRank('1st Year B');
      expect(fy.trainingGroup).toBe('1st Years');
      expect(fy.rankedTeam).toBe('1st Year B');

      const sc = resolveTrainingGroupAndRank('6th Class C');
      expect(sc.trainingGroup).toBe('6th Class');
      expect(sc.rankedTeam).toBe('6th Class C');
    });

    it('resolves numeric ordinals into letter ranks (e.g. Old Alex 1 -> A, Old Alex 2 -> B)', () => {
      const t1 = resolveTrainingGroupAndRank('Old Alex 1', 'Girls Minor League Div 1');
      expect(t1.trainingGroup).toBe('Minors');
      expect(t1.rankedTeam).toBe('Minor A');

      const t2 = resolveTrainingGroupAndRank('Old Alex 2', 'Girls Minor League Div 3');
      expect(t2.trainingGroup).toBe('Minors');
      expect(t2.rankedTeam).toBe('Minor B');
    });
  });

  describe('resolveLeinsterVenue', () => {
    it('resolves Milltown Pitch 1 for Home matches', () => {
      expect(resolveLeinsterVenue('Home', true)).toBe('Milltown Pitch 1 (Full)');
      expect(resolveLeinsterVenue('', true)).toBe('Milltown Pitch 1 (Full)');
    });

    it('resolves known Leinster club grounds for Away matches', () => {
      expect(resolveLeinsterVenue('Serpentine Ave', false)).toBe('Serpentine Ave (Pembroke HC)');
      expect(resolveLeinsterVenue('Park Ave', false)).toBe('Park Avenue (Railway Union HC)');
      expect(resolveLeinsterVenue('Temple Carrig', false)).toBe('Temple Carrig (Bray HC)');
      expect(resolveLeinsterVenue("St Mark's", false)).toBe("St Mark's (Glenanne HC)");
    });
  });

  describe('parseLeinsterFixturesCSV', () => {
    it('parses the full season sample CSV with 30 fixtures across all training groups', () => {
      const result = parseLeinsterFixturesCSV(SAMPLE_LEINSTER_SEASON_CSV);

      expect(result.validCount).toBe(30);
      expect(result.errorCount).toBe(0);
      expect(result.homeCount).toBe(17);
      expect(result.awayCount).toBe(13);

      // Training group breakdown
      expect(result.trainingGroupBreakdown['Inters']).toBeGreaterThan(5);
      expect(result.trainingGroupBreakdown['Minors']).toBeGreaterThan(5);
      expect(result.trainingGroupBreakdown['1st Years']).toBeGreaterThan(5);
      expect(result.trainingGroupBreakdown['6th Class']).toBeGreaterThan(3);

      // Ranked team breakdown
      expect(result.rankedTeamBreakdown['Inter A']).toBeDefined();
      expect(result.rankedTeamBreakdown['Inter B']).toBeDefined();
      expect(result.rankedTeamBreakdown['Minor A']).toBeDefined();
      expect(result.rankedTeamBreakdown['1st Year A']).toBeDefined();

      // Date range across season
      expect(result.dateRange).toEqual({
        start: '2026-10-11',
        end: '2027-04-18',
      });
    });

    it('parses Colts-style format with Home/Away, Group, Activity/Opponent columns', () => {
      const coltsCsv = `Home/Away,Group,Activity/Opponent,Venue,Time,Notes,Date
Away,6th class A,v Pembroke (Div 1),Serpentine Ave,11:00am,,11/10/2026
Away,6th class B,v Our Lady's (Div 3),Our Lady's school Terenure,2:00pm,,11/10/2026
Away,6th class C,v Glenanne (Div 6),St Mark's,11:10am,,11/10/2026
Away,Minor A,v Bray (Div 1),Temple Carrig,4:00pm,,11/10/2026`;

      const result = parseLeinsterFixturesCSV(coltsCsv);
      expect(result.validCount).toBe(4);
      expect(result.fixtures[0].ageGroupOrTeam).toBe('6th Class A');
      expect(result.fixtures[0].opposition).toBe('Pembroke');
      expect(result.fixtures[0].isHome).toBe(false);
      expect(result.fixtures[0].pushbackTime).toBe('11:00');
      expect(result.fixtures[3].ageGroupOrTeam).toBe('Minor A');
      expect(result.fixtures[3].opposition).toBe('Bray');
    });
  });
});
