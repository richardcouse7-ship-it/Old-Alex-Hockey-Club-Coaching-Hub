import { describe, it, expect } from 'vitest';
import {
  isAwaySession,
  extractOpposition,
  normalizeAwaySlot,
  convertFixtureToAwaySlot,
  syncAwayFixturesToSlots,
} from '../awayFixtureUtils';
import { MatchFixture, SessionSlot, Coach } from '../../types';

describe('Away Fixture Utilities', () => {
  const mockCoaches: Coach[] = [
    {
      id: 'coach-1',
      name: 'Josh Gill',
      role: 'Head Coach',
      phone: '0871112233',
      email: 'josh@oldalex.ie',
      accentColor: '#dc2626',
      initials: 'JG',
      isActive: true,
    },
    {
      id: 'coach-2',
      name: 'Ben McInerney',
      role: 'Development Coach',
      phone: '0872223344',
      email: 'ben@oldalex.ie',
      accentColor: '#2563eb',
      initials: 'BM',
      isActive: true,
    },
  ];

  const sampleAwayFixture: MatchFixture = {
    id: 'fix-away-101',
    date: '2026-10-18',
    pushbackTime: '11:00',
    ageGroupOrTeam: 'Inter A',
    competition: 'Leinster Inter League Div 1',
    opposition: 'YMCA Inter 1',
    isHome: false,
    venue: 'Wesley College (YMCA HC)',
    leadCoachOrManager: 'Josh Gill',
    umpires: ['Club Appointed'],
    notes: 'Arrive in tracksuits',
    status: 'Scheduled',
    trainingGroup: 'Inters',
    rankedTeam: 'Inter A',
    round: 'Round 2',
  };

  const sampleHomeFixture: MatchFixture = {
    id: 'fix-home-102',
    date: '2026-10-18',
    pushbackTime: '13:00',
    ageGroupOrTeam: 'Inter B',
    competition: 'Leinster Inter League Div 2',
    opposition: 'Pembroke Wanderers Inter 3',
    isHome: true,
    venue: 'Milltown Pitch 1 (Full)',
    leadCoachOrManager: 'Ben McInerney',
    umpires: ['Club Appointed'],
    status: 'Scheduled',
    trainingGroup: 'Inters',
    rankedTeam: 'Inter B',
    round: 'Round 2',
  };

  describe('isAwaySession', () => {
    it('detects isAway true or pitchSectorId away', () => {
      expect(isAwaySession({ isAway: true })).toBe(true);
      expect(isAwaySession({ pitchSectorId: 'away' })).toBe(true);
    });

    it('detects external venue keywords', () => {
      expect(isAwaySession({ venueName: 'Wesley College' })).toBe(true);
      expect(isAwaySession({ venueName: 'Mount Temple School' })).toBe(true);
      expect(isAwaySession({ venueName: 'Milltown Pitch 1' })).toBe(false);
      expect(isAwaySession({ venueName: 'Milltown Sand Pitch' })).toBe(false);
    });

    it('detects away keywords in sessionTitle and coachNotes', () => {
      expect(isAwaySession({ sessionTitle: 'Inter A (AWAY vs YMCA)' })).toBe(true);
      expect(isAwaySession({ coachNotes: 'Venue: Wesley College' })).toBe(true);
      expect(isAwaySession({ sessionTitle: 'U14 Training', coachNotes: 'Normal pitch session' })).toBe(false);
    });
  });

  describe('extractOpposition', () => {
    it('extracts opponent from v or vs text', () => {
      expect(extractOpposition('Match v YMCA in Wesley')).toBe('YMCA');
      expect(extractOpposition('Old Alex vs Pembroke in Serpentine')).toBe('Pembroke');
      expect(extractOpposition('General squad training')).toBeUndefined();
    });
  });

  describe('normalizeAwaySlot', () => {
    it('populates meetTime (45 mins prior) and enforces pitchSectorId away', () => {
      const slot: SessionSlot = {
        id: 'slot-1',
        date: '2026-10-18',
        timeSlot: '11:00–12:15',
        startTime: '11:00',
        endTime: '12:15',
        pitchSectorId: 'p1n',
        ageGroupId: 'Inters',
        pathway: 'Youth Performance',
        assignedCoachIds: [],
        sessionTitle: 'Inter A vs YMCA in Wesley',
        sessionPurpose: 'League game',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Needs Coach',
        venueName: 'Wesley College',
      };

      const normalized = normalizeAwaySlot(slot);
      expect(normalized.isAway).toBe(true);
      expect(normalized.pitchSectorId).toBe('away');
      expect(normalized.meetTime).toBe('10:15');
    });
  });

  describe('convertFixtureToAwaySlot', () => {
    it('converts MatchFixture into a valid off-site SessionSlot', () => {
      const slot = convertFixtureToAwaySlot(sampleAwayFixture, mockCoaches);

      expect(slot.isAway).toBe(true);
      expect(slot.pitchSectorId).toBe('away');
      expect(slot.date).toBe('2026-10-18');
      expect(slot.startTime).toBe('11:00');
      expect(slot.endTime).toBe('12:15');
      expect(slot.timeSlot).toBe('11:00–12:15');
      expect(slot.meetTime).toBe('10:15');
      expect(slot.venueName).toBe('Wesley College (YMCA HC)');
      expect(slot.opposition).toBe('YMCA Inter 1');
      expect(slot.fixtureId).toBe('fix-away-101');
      expect(slot.assignedCoachIds).toEqual(['coach-1']); // Josh Gill matched
      expect(slot.status).toBe('Ready');
      expect(slot.equipmentChecklist.length).toBeGreaterThan(0);
      expect(slot.sessionTitle).toContain('Inter A (AWAY vs YMCA Inter 1)');
      expect(slot.sessionPurpose).toContain('Round 2');
    });
  });

  describe('syncAwayFixturesToSlots', () => {
    it('creates new SessionSlots for away fixtures and ignores home fixtures', () => {
      const existingSlots: SessionSlot[] = [];
      const fixtures = [sampleAwayFixture, sampleHomeFixture];

      const result = syncAwayFixturesToSlots(existingSlots, fixtures, mockCoaches);

      expect(result.createdCount).toBe(1);
      expect(result.updatedCount).toBe(0);
      expect(result.updatedSlots.length).toBe(1);
      expect(result.updatedSlots[0].fixtureId).toBe('fix-away-101');
      expect(result.updatedSlots[0].isAway).toBe(true);
      expect(result.updatedSlots[0].pitchSectorId).toBe('away');
    });

    it('updates existing slot when fixture is re-synced while preserving custom assignments', () => {
      const initialSlot = convertFixtureToAwaySlot(sampleAwayFixture, mockCoaches);
      // User customized coaches and added a drill
      initialSlot.assignedCoachIds = ['coach-2']; // Ben substituted Josh
      initialSlot.attachedDrillIds = ['drill-press-1'];

      const updatedFixture: MatchFixture = {
        ...sampleAwayFixture,
        pushbackTime: '12:00', // Time rescheduled
        venue: 'Wesley College Pitch 2',
      };

      const result = syncAwayFixturesToSlots([initialSlot], [updatedFixture], mockCoaches);

      expect(result.createdCount).toBe(0);
      expect(result.updatedCount).toBe(1);
      expect(result.updatedSlots.length).toBe(1);
      const resSlot = result.updatedSlots[0];
      expect(resSlot.startTime).toBe('12:00');
      expect(resSlot.meetTime).toBe('11:15');
      expect(resSlot.venueName).toBe('Wesley College Pitch 2');
      // Preserved user customizations:
      expect(resSlot.assignedCoachIds).toEqual(['coach-2']);
      expect(resSlot.attachedDrillIds).toEqual(['drill-press-1']);
    });

    it('filters by targetDate when targetDate option is supplied', () => {
      const nextWeekFixture: MatchFixture = {
        ...sampleAwayFixture,
        id: 'fix-away-201',
        date: '2026-10-25',
      };
      const fixtures = [sampleAwayFixture, nextWeekFixture];

      const result = syncAwayFixturesToSlots([], fixtures, mockCoaches, {
        targetDate: '2026-10-18',
      });

      expect(result.createdCount).toBe(1);
      expect(result.updatedSlots.length).toBe(1);
      expect(result.updatedSlots[0].date).toBe('2026-10-18');
    });
  });
});
