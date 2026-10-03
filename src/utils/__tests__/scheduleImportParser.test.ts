import { describe, it, expect } from 'vitest';
import {
  parseSpreadsheetSchedule,
  parseDateStringToISO,
  normalizeAgeGroup,
  isIgnoredCoachName,
  cleanCoachName,
  SAMPLE_WEEKLY_SPREADSHEET_TEXT,
} from '../scheduleImportParser';
import { COACHES } from '../../data/initialData';

describe('scheduleImportParser', () => {
  describe('Helper Functions', () => {
    it('parseDateStringToISO handles various date formats correctly', () => {
      expect(parseDateStringToISO('4/10/2026')).toBe('2026-10-04');
      expect(parseDateStringToISO('04/10/2026')).toBe('2026-10-04');
      expect(parseDateStringToISO('4-10-2026')).toBe('2026-10-04');
      expect(parseDateStringToISO('2026-10-04')).toBe('2026-10-04');
      expect(parseDateStringToISO('invalid-date')).toBeNull();
      expect(parseDateStringToISO('')).toBeNull();
    });

    it('normalizeAgeGroup correctly normalizes team names', () => {
      expect(normalizeAgeGroup('Inter A').ageGroup).toBe('Inters');
      expect(normalizeAgeGroup('Inter D').ageGroup).toBe('Inters');
      expect(normalizeAgeGroup('Minor').ageGroup).toBe('Minors');
      expect(normalizeAgeGroup('1st Year A').ageGroup).toBe('1st Years');
      expect(normalizeAgeGroup('6th Class').ageGroup).toBe('6th Class');
      expect(normalizeAgeGroup('5th Class').ageGroup).toBe('5th Class');
      expect(normalizeAgeGroup('4th Class').ageGroup).toBe('4th Class');
      expect(normalizeAgeGroup('3rd Class').ageGroup).toBe('3rd Class');
      expect(normalizeAgeGroup('2nd Class').ageGroup).toBe('2nd Class');
      expect(normalizeAgeGroup('1st Class').ageGroup).toBe('1st Class');
      expect(normalizeAgeGroup('Pen').ageGroup).toBe('PEN');
    });

    it('isIgnoredCoachName filters out referee and placeholder text', () => {
      expect(isIgnoredCoachName('Ref Provided')).toBe(true);
      expect(isIgnoredCoachName('ref provided')).toBe(true);
      expect(isIgnoredCoachName('Ref')).toBe(true);
      expect(isIgnoredCoachName('TBD')).toBe(true);
      expect(isIgnoredCoachName('None')).toBe(true);
      expect(isIgnoredCoachName('-')).toBe(true);
      expect(isIgnoredCoachName('Richard Couse')).toBe(false);
      expect(isIgnoredCoachName('Ben McInerney')).toBe(false);
    });

    it('cleanCoachName trims spaces and trailing ellipsis', () => {
      expect(cleanCoachName('  Josh Gill  ')).toBe('Josh Gill');
      expect(cleanCoachName('Daisy Dillon M...')).toBe('Daisy Dillon M');
      expect(cleanCoachName('"Katie Mullan"')).toBe('Katie Mullan');
    });
  });

  describe('Screenshot Weekly Schedule Parsing', () => {
    it('parses Richard screenshot master spreadsheet accurately', () => {
      const result = parseSpreadsheetSchedule(SAMPLE_WEEKLY_SPREADSHEET_TEXT, COACHES, '2026-09-13');

      // 1. Check Date Auto-Detection
      expect(result.detectedDate).toBe('2026-10-04');

      // 2. Check Total Sessions Parsed (17 rows: 5 Inters, 1 Minor, 4 1st Years, 6th, 5th, 4th, 3rd, 2nd, 1st, Pen)
      expect(result.rows.length).toBe(17);
      expect(result.slots.length).toBe(17);

      // All slots should inherit the detected date
      expect(result.slots.every((s) => s.date === '2026-10-04')).toBe(true);

      // 3. Verify specific sessions from the screenshot
      const interA = result.rows.find((r) => r.rawTeam === 'Inter A');
      expect(interA).toBeDefined();
      expect(interA?.startTime).toBe('13:30');
      expect(interA?.endTime).toBe('15:30');
      expect(interA?.isMatch).toBe(true);
      expect(interA?.assignedCoachNames).toContain('Richard Couse');

      const interB = result.rows.find((r) => r.rawTeam === 'Inter B');
      expect(interB).toBeDefined();
      expect(interB?.startTime).toBe('10:15');
      expect(interB?.endTime).toBe('12:00');
      expect(interB?.assignedCoachNames).toContain('Richard Couse');
      expect(interB?.assignedCoachNames).toContain('Nicola Wildish');

      // Inter C & Inter D should NOT have "Ref Provided" as a coach
      const interC = result.rows.find((r) => r.rawTeam === 'Inter C');
      expect(interC).toBeDefined();
      expect(interC?.assignedCoachNames).toContain('Katie Mullan');
      expect(interC?.assignedCoachNames).not.toContain('Ref Provided');
      expect(result.newCoaches.some((c) => c.name.toLowerCase().includes('ref'))).toBe(false);

      const minor = result.rows.find((r) => r.rawTeam === 'Minor');
      expect(minor).toBeDefined();
      expect(minor?.ageGroupId).toBe('Minors');
      expect(minor?.startTime).toBe('14:30');
      expect(minor?.endTime).toBe('15:15');
      expect(minor?.assignedCoachNames).toEqual(['Ben McInerney', 'Conor Ryan', 'Una Kelly']);

      // 4th Class at 12:00 - 13:00
      const fourth = result.rows.find((r) => r.rawTeam === '4th Class');
      expect(fourth).toBeDefined();
      expect(fourth?.startTime).toBe('12:00');
      expect(fourth?.endTime).toBe('13:00');
      expect(fourth?.assignedCoachNames).toContain('Josh Gill');
      expect(fourth?.assignedCoachNames).toContain('Daisy Dillon Mansfield');

      // 4. Verify Floaters
      expect(result.floats.length).toBeGreaterThan(0);
      const floatGroup = result.floats[0];
      expect(floatGroup.time).toBe('12:00');
      expect(floatGroup.coachNames).toContain('Lauren Walsh');
      expect(floatGroup.coachNames).toContain('Iris Fowler');
      expect(floatGroup.coachNames).toContain("Eve O'Donnell");

      // 5. Verify Fixtures Generation
      expect(result.fixtures.length).toBeGreaterThanOrEqual(6);
      const ymcafix = result.fixtures.find((f) => f.opposition?.includes('YMCA'));
      expect(ymcafix).toBeDefined();
      expect(ymcafix?.isHome).toBe(false);
      expect(ymcafix?.venue).toBe('Wesley College');

      // 6. Verify Away Slots and Logistics
      const interASlot = result.slots.find((s) => s.sessionTitle.includes('Inter A'));
      expect(interASlot).toBeDefined();
      expect(interASlot?.isAway).toBe(true);
      expect(interASlot?.pitchSectorId).toBe('away');
      expect(interASlot?.venueName).toBe('Wesley College');
      expect(interASlot?.opposition).toBe('YMCA');
      expect(interASlot?.meetTime).toBe('12:45'); // 13:30 - 45m
      expect(interASlot?.equipmentChecklist.some((e) => /alternate white socks/i.test(e.item))).toBe(true);

      const interCSlot = result.slots.find((s) => s.sessionTitle.includes('Inter C'));
      expect(interCSlot).toBeDefined();
      expect(interCSlot?.isAway).toBe(true);
      expect(interCSlot?.pitchSectorId).toBe('away');
      expect(interCSlot?.venueName).toBe('Mount Temple School');
      expect(interCSlot?.opposition).toBe('Clontarf');
      expect(interCSlot?.meetTime).toBe('13:00'); // 13:45 pushback - 45m meet = 13:00

      const interDSlot = result.slots.find((s) => s.sessionTitle.includes('Inter D'));
      expect(interDSlot).toBeDefined();
      expect(interDSlot?.isAway).toBe(true);
      expect(interDSlot?.pitchSectorId).toBe('away');
      expect(interDSlot?.venueName).toBe('Drogheda Grammar School');
      expect(interDSlot?.opposition).toBe('Boyne');
      expect(interDSlot?.meetTime).toBe('09:45'); // 10:30 pushback - 45m meet = 09:45

      // 7. Verify Home Slots do not get marked as Away
      const minorSlot = result.slots.find((s) => s.sessionTitle.includes('Minor'));
      expect(minorSlot).toBeDefined();
      expect(minorSlot?.isAway).toBeFalsy();
      expect(minorSlot?.pitchSectorId).not.toBe('away');
    });

    it('gracefully parses table when pasted without a Date column', () => {
      const tableWithoutDate = `Match/Team	Venue/Location	Assigned	Assigned Umpire/Coach	Start Time	End Time
Inter A	Match V YMCA in Wesley	Richard Couse		13:30	15:30
Minor	Training	Ben McInerney	Conor Ryan	14:30	15:15`;

      const result = parseSpreadsheetSchedule(tableWithoutDate, COACHES, '2026-10-18');
      expect(result.rows.length).toBe(2);
      expect(result.slots[0].date).toBe('2026-10-18');
      expect(result.rows[0].rawTeam).toBe('Inter A');
      expect(result.slots[0].isAway).toBe(true);
      expect(result.slots[0].venueName).toBe('Wesley College');
      expect(result.rows[1].rawTeam).toBe('Minor');
      expect(result.slots[1].isAway).toBeFalsy();
    });
  });
});
