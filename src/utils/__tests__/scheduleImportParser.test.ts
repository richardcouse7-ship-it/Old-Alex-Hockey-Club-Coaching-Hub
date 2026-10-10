import { describe, it, expect } from 'vitest';
import {
  parseSpreadsheetSchedule,
  parseDateStringToISO,
  normalizeAgeGroup,
  isIgnoredCoachName,
  cleanCoachName,
  isValidCoachPersonName,
  SAMPLE_WEEKLY_SPREADSHEET_TEXT,
  SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT4,
  SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT11,
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

    it('isValidCoachPersonName strictly validates human names and rejects non-person cells', () => {
      // Valid coach person names
      expect(isValidCoachPersonName('Richard Couse')).toBe(true);
      expect(isValidCoachPersonName('Daisy Dillon Mansfield')).toBe(true);
      expect(isValidCoachPersonName('Violet O\'Neill')).toBe(true);
      expect(isValidCoachPersonName('Anya')).toBe(true); // Whitelisted single name

      // Times and time indicators
      expect(isValidCoachPersonName('2:00pm')).toBe(false);
      expect(isValidCoachPersonName('11:00am')).toBe(false);
      expect(isValidCoachPersonName('11:10 am')).toBe(false);
      expect(isValidCoachPersonName('10:30')).toBe(false);

      // Match and division indicators
      expect(isValidCoachPersonName('v Glenanne (Div 6)')).toBe(false);
      expect(isValidCoachPersonName('v Pembroke (Div 1)')).toBe(false);
      expect(isValidCoachPersonName('vs Bray')).toBe(false);
      expect(isValidCoachPersonName('Div 6')).toBe(false);

      // Notes and venue keywords
      expect(isValidCoachPersonName('BIBS and WHITE SOCKS')).toBe(false);
      expect(isValidCoachPersonName('St Mark\'s')).toBe(false);
      expect(isValidCoachPersonName('Serpentine Ave')).toBe(false);
      expect(isValidCoachPersonName('Loreto Beaufort')).toBe(false);
      expect(isValidCoachPersonName('Temple Carrig')).toBe(false);
      expect(isValidCoachPersonName('Our Lady\'s school Terenure')).toBe(false);
      expect(isValidCoachPersonName('Home')).toBe(false);
      expect(isValidCoachPersonName('Away')).toBe(false);
      expect(isValidCoachPersonName('Training (to be split Inter Mx to decide)')).toBe(false);
      expect(isValidCoachPersonName('Start time updated per follow-up emails')).toBe(false);

      // Single-word non-whitelisted strings
      expect(isValidCoachPersonName('Inter')).toBe(false);
      expect(isValidCoachPersonName('Training')).toBe(false);
    });
  });

  describe('Screenshot Weekly Schedule Parsing', () => {
    it('parses Richard screenshot master spreadsheet accurately (4 Oct 2026)', () => {
      const result = parseSpreadsheetSchedule(SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT4, COACHES, '2026-09-13');

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

    it('parses Richard screenshot master spreadsheet for 11 Oct 2026 accurately', () => {
      const result = parseSpreadsheetSchedule(SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT11, COACHES, '2026-09-13');

      // 1. Date Detection
      expect(result.detectedDate).toBe('2026-10-11');

      // 2. Total Sessions Parsed (16 rows)
      expect(result.rows.length).toBe(16);
      expect(result.slots.length).toBe(16);
      expect(result.slots.every((s) => s.date === '2026-10-11')).toBe(true);

      // 3. Away Matches (6 away sessions)
      const awaySlots = result.slots.filter((s) => s.isAway);
      expect(awaySlots.length).toBe(6);

      // Minor A Away vs Bray
      const minorA = result.slots.find((s) => s.sessionTitle.includes('Minor A'));
      expect(minorA).toBeDefined();
      expect(minorA?.isAway).toBe(true);
      expect(minorA?.startTime).toBe('15:00');
      expect(minorA?.endTime).toBe('17:00');
      expect(minorA?.meetTime).toBe('14:15');

      // Minor B Away vs Railway
      const minorB = result.slots.find((s) => s.sessionTitle.includes('Minor B'));
      expect(minorB).toBeDefined();
      expect(minorB?.isAway).toBe(true);
      expect(minorB?.startTime).toBe('10:15');
      expect(minorB?.meetTime).toBe('09:30');

      // Minor C Away vs Loreto
      const minorC = result.slots.find((s) => s.sessionTitle.includes('Minor C'));
      expect(minorC).toBeDefined();
      expect(minorC?.isAway).toBe(true);
      expect(minorC?.startTime).toBe('10:30');
      expect(minorC?.meetTime).toBe('09:45');

      // 6th Class A Away vs Pembroke
      const sixthA = result.slots.find((s) => s.sessionTitle.includes('6th Class A'));
      expect(sixthA).toBeDefined();
      expect(sixthA?.isAway).toBe(true);
      expect(sixthA?.startTime).toBe('10:15');
      // "One to umpire." should NOT be parsed as coach
      expect(sixthA?.assignedCoachIds.some((id) => id.includes('umpire'))).toBe(false);

      // 6th Class B Away vs Our Lady's
      const sixthB = result.slots.find((s) => s.sessionTitle.includes('6th Class B'));
      expect(sixthB).toBeDefined();
      expect(sixthB?.isAway).toBe(true);
      expect(sixthB?.startTime).toBe('10:40');

      // 6th Class C Away vs Glenanne
      const sixthC = result.slots.find((s) => s.sessionTitle.includes('6th Class C'));
      expect(sixthC).toBeDefined();
      expect(sixthC?.isAway).toBe(true);
      expect(sixthC?.startTime).toBe('10:45');

      // 4. Home sessions (10 sessions)
      const homeSlots = result.slots.filter((s) => !s.isAway);
      expect(homeSlots.length).toBe(10);

      // 12:00 Foundation block
      const penSlot = homeSlots.find((s) => s.ageGroupId === 'PEN');
      expect(penSlot?.pitchSectorId).toBe('p3');
      expect(penSlot?.startTime).toBe('12:00');

      const firstClass = homeSlots.find((s) => s.ageGroupId === '1st Class');
      expect(firstClass?.startTime).toBe('12:00');

      const secondClass = homeSlots.find((s) => s.ageGroupId === '2nd Class');
      expect(secondClass?.startTime).toBe('12:00');

      const thirdClass = homeSlots.find((s) => s.ageGroupId === '3rd Class');
      expect(thirdClass?.startTime).toBe('12:00');

      const fourthClass = homeSlots.find((s) => s.ageGroupId === '4th Class');
      expect(fourthClass?.startTime).toBe('12:00');
    });
  });

  describe('Provisional Schedule CSV Parsing', () => {
    const PROVISIONAL_CSV = `Home/Away,Group,Activity/Opponent,Venue,Time,Notes
Home,Inter,Training (to be split Inter Mx to decide),Home,10:30am - 12:00pm,
Home,"PEN, 1st, 2nd, 3rd, 4th class",Training,Home,12:00pm - 1:00pm,
Home,5th class & 1st year,Training,Home,1:00pm - 2:15pm,
Home,Inter,Training (to be split Inter Mx to decide),Home,2:15pm - 3:45pm,Second inter training slot
Away,6th class A,v Pembroke (Div 1),Serpentine Ave,11:00am,
Away,6th class B,v Our Lady's (Div 3),Our Lady's school Terenure,2:00pm,
Away,6th class C,v Glenanne (Div 6),St Mark's,11:10am,Start time updated per follow-up emails
Away,Minor A,v Bray (Div 1),Temple Carrig,4:00pm,
Away,Minor B,v Railway (Div 3),Park Ave,11:00am,
Away,Minor C,v Loreto (Div 7),Loreto Beaufort,11:15am,BIBS and WHITE SOCKS`;

    it('correctly parses user provisional schedule CSV into slots and match fixtures', () => {
      const result = parseSpreadsheetSchedule(PROVISIONAL_CSV, COACHES, '2026-10-11');

      // 1. Should have expanded multi-group rows (9 home sessions + 6 away matches = 15 total slots)
      expect(result.slots.length).toBe(15);
      expect(result.rows.length).toBe(15);

      // 2. Target date preserved
      expect(result.slots.every((s) => s.date === '2026-10-11')).toBe(true);

      // 3. Home morning Inter session (10:30 - 12:00)
      const firstInter = result.slots.find(
        (s) => s.sessionTitle.includes('Inter') && s.startTime === '10:30'
      );
      expect(firstInter).toBeDefined();
      expect(firstInter?.endTime).toBe('12:00');
      expect(firstInter?.isAway).toBe(false);

      // 4. Multi-group Junior Hour at 12:00 - 13:00 (PEN, 1st, 2nd, 3rd, 4th)
      const penSlot = result.slots.find((s) => s.ageGroupId === 'PEN');
      const firstClassSlot = result.slots.find((s) => s.ageGroupId === '1st Class');
      const secondClassSlot = result.slots.find((s) => s.ageGroupId === '2nd Class');
      const thirdClassSlot = result.slots.find((s) => s.ageGroupId === '3rd Class');
      const fourthClassSlot = result.slots.find((s) => s.ageGroupId === '4th Class');

      expect(penSlot).toBeDefined();
      expect(penSlot?.pitchSectorId).toBe('p3'); // The Cage
      expect(penSlot?.startTime).toBe('12:00');
      expect(penSlot?.endTime).toBe('13:00');

      expect(firstClassSlot).toBeDefined();
      expect(firstClassSlot?.startTime).toBe('12:00');
      expect(firstClassSlot?.endTime).toBe('13:00');

      expect(secondClassSlot).toBeDefined();
      expect(thirdClassSlot).toBeDefined();
      expect(fourthClassSlot).toBeDefined();

      // 5. Afternoon slot: 5th class & 1st year (1:00pm - 2:15pm -> 13:00 - 14:15)
      const fifthSlot = result.slots.find((s) => s.ageGroupId === '5th Class');
      const firstYearSlot = result.slots.find((s) => s.ageGroupId === '1st Years');

      expect(fifthSlot).toBeDefined();
      expect(fifthSlot?.startTime).toBe('13:00');
      expect(fifthSlot?.endTime).toBe('14:15');

      expect(firstYearSlot).toBeDefined();
      expect(firstYearSlot?.startTime).toBe('13:00');
      expect(firstYearSlot?.endTime).toBe('14:15');

      // 6. Second Inter session (2:15pm - 3:45pm -> 14:15 - 15:45)
      const secondInter = result.slots.find(
        (s) => s.sessionTitle.includes('Inter') && s.startTime === '14:15'
      );
      expect(secondInter).toBeDefined();
      expect(secondInter?.endTime).toBe('15:45');
      expect(secondInter?.coachNotes).toContain('Second inter training slot');

      // 7. Away Matches (6 total)
      const awaySlots = result.slots.filter((s) => s.isAway);
      expect(awaySlots.length).toBe(6);

      // Check 6th Class A vs Pembroke at Serpentine Ave
      const pembrokeMatch = awaySlots.find((s) => s.sessionTitle.includes('6th class A'));
      expect(pembrokeMatch).toBeDefined();
      expect(pembrokeMatch?.startTime).toBe('11:00');
      expect(pembrokeMatch?.meetTime).toBe('10:15'); // 45m prior
      expect(pembrokeMatch?.opposition).toBe('Pembroke');
      expect(pembrokeMatch?.venueName).toContain('Pembroke HC (Serpentine Ave)');

      // Check Our Lady's (2:00pm -> 14:00, meet 13:15)
      const ourLadysMatch = awaySlots.find((s) => s.sessionTitle.includes('6th class B'));
      expect(ourLadysMatch).toBeDefined();
      expect(ourLadysMatch?.startTime).toBe('14:00');
      expect(ourLadysMatch?.meetTime).toBe('13:15');
      expect(ourLadysMatch?.venueName).toContain("Our Lady's School Terenure");

      // Check Minor C vs Loreto with notes (BIBS and WHITE SOCKS)
      const minorCMatch = awaySlots.find((s) => s.sessionTitle.includes('Minor C'));
      expect(minorCMatch).toBeDefined();
      expect(minorCMatch?.startTime).toBe('11:15');
      expect(minorCMatch?.meetTime).toBe('10:30');
      expect(minorCMatch?.coachNotes).toContain('BIBS and WHITE SOCKS');

      // 8. Match Fixtures Generation
      expect(result.fixtures.length).toBe(6);
      const brayFixture = result.fixtures.find((f) => f.opposition === 'Bray');
      expect(brayFixture).toBeDefined();
      expect(brayFixture?.pushbackTime).toBe('16:00');
      expect(brayFixture?.venue).toContain('Temple Carrig');
      expect(brayFixture?.competition).toContain('Div 1');

      // 9. Coach Hardening & No Erroneous Coach Creation
      // The provisional CSV has no 'assigned', 'coach', or 'umpire' column headers.
      // It must produce exactly 0 new coaches and 0 assigned coaches.
      expect(result.newCoaches.length).toBe(0);
      expect(result.newCoaches).toEqual([]);
      expect(result.slots.every((s) => s.assignedCoachIds.length === 0)).toBe(true);
      expect(result.rows.every((r) => r.assignedCoachNames.length === 0)).toBe(true);

      // Verify that times, venues, opposition names, and notes were never converted into coaches
      const invalidKeywords = [
        "2:00pm",
        "St Mark's",
        "BIBS and WHITE SOCKS",
        "v Glenanne (Div 6)",
        "Home",
        "Away",
        "Serpentine Ave",
        "Loreto Beaufort",
        "Temple Carrig",
      ];
      for (const keyword of invalidKeywords) {
        expect(result.newCoaches.some((c) => c.name.toLowerCase() === keyword.toLowerCase())).toBe(false);
      }
    });

    it('verifies times, venues, opposition, and notes are never converted into coaches even if trailing columns exist', () => {
      const csvWithTrailingNotes = `Home/Away,Group,Activity/Opponent,Venue,Time,Notes
Away,6th class C,v Glenanne (Div 6),St Mark's,11:10am,Start time updated per follow-up emails
Away,Minor C,v Loreto (Div 7),Loreto Beaufort,11:15am,BIBS and WHITE SOCKS`;

      const result = parseSpreadsheetSchedule(csvWithTrailingNotes, COACHES, '2026-10-11');
      expect(result.newCoaches.length).toBe(0);
      expect(result.newCoaches).toEqual([]);
      expect(result.slots.every((s) => s.assignedCoachIds.length === 0)).toBe(true);
    });
  });
});
