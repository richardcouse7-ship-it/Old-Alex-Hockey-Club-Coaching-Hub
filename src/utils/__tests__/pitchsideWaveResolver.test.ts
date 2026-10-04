import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  getSlotTimeRangeMinutes,
  isPitch1Slot,
  isPitch2Slot,
  resolvePitchWaves,
  resolveAwayWave,
} from '../pitchsideWaveResolver';
import { SessionSlot } from '../../types';

describe('pitchsideWaveResolver', () => {
  describe('parseTimeToMinutes', () => {
    it('converts HH:MM into total minutes from midnight', () => {
      expect(parseTimeToMinutes('09:30')).toBe(570);
      expect(parseTimeToMinutes('10:45')).toBe(645);
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('14:15')).toBe(855);
      expect(parseTimeToMinutes('12:00')).toBe(720);
    });

    it('handles single digit hours and leading/trailing spaces', () => {
      expect(parseTimeToMinutes(' 9:15 ')).toBe(555);
      expect(parseTimeToMinutes('8:00')).toBe(480);
    });

    it('returns 0 for empty or invalid strings', () => {
      expect(parseTimeToMinutes('')).toBe(0);
      expect(parseTimeToMinutes('invalid')).toBe(0);
      expect(parseTimeToMinutes(null as unknown as string)).toBe(0);
    });
  });

  describe('getSlotTimeRangeMinutes', () => {
    it('prefers explicit startTime and endTime if present', () => {
      const slot: SessionSlot = {
        id: 's1',
        date: '2026-10-04',
        timeSlot: '09:30–11:00',
        startTime: '09:30',
        endTime: '11:00',
        pitchSectorId: 'p1n',
        ageGroupId: '3rd Class',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-1'],
        sessionTitle: '3rd Class Skills',
        sessionPurpose: '',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
      };

      const range = getSlotTimeRangeMinutes(slot);
      expect(range.startMinutes).toBe(570);
      expect(range.endMinutes).toBe(660);
    });

    it('falls back to timeSlot string with en-dash or hyphen', () => {
      const slot1: SessionSlot = {
        id: 's2',
        date: '2026-10-04',
        timeSlot: '10:15–11:30',
        startTime: '',
        endTime: '',
        pitchSectorId: 'p2n',
        ageGroupId: '4th Class',
        pathway: 'Foundation',
        assignedCoachIds: [],
        sessionTitle: '4th Class Skills',
        sessionPurpose: '',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
      };
      expect(getSlotTimeRangeMinutes(slot1)).toEqual({ startMinutes: 615, endMinutes: 690 });

      const slot2 = { ...slot1, timeSlot: '11:30-12:45' };
      expect(getSlotTimeRangeMinutes(slot2)).toEqual({ startMinutes: 690, endMinutes: 765 });
    });
  });

  describe('Turf Sector Matchers', () => {
    it('correctly matches Pitch 1 and Pitch 2 turf slots', () => {
      const baseSlot: SessionSlot = {
        id: 's-test',
        date: '2026-10-04',
        timeSlot: '10:00–11:15',
        startTime: '10:00',
        endTime: '11:15',
        pitchSectorId: 'p1n',
        ageGroupId: '2nd Class',
        pathway: 'Foundation',
        assignedCoachIds: [],
        sessionTitle: '2nd Class Training',
        sessionPurpose: '',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
      };

      expect(isPitch1Slot(baseSlot)).toBe(true);
      expect(isPitch2Slot(baseSlot)).toBe(false);

      const p2Slot: SessionSlot = {
        ...baseSlot,
        pitchSectorId: 'p2s',
      };
      expect(isPitch1Slot(p2Slot)).toBe(false);
      expect(isPitch2Slot(p2Slot)).toBe(true);
    });
  });

  describe('resolvePitchWaves', () => {
    const wave1_P1: SessionSlot = {
      id: 'w1-p1',
      date: '2026-10-04',
      timeSlot: '09:00–10:15',
      startTime: '09:00',
      endTime: '10:15',
      pitchSectorId: 'p1n',
      ageGroupId: '1st Class',
      pathway: 'Foundation',
      assignedCoachIds: ['coach-1'],
      sessionTitle: '1st Class Skills',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const wave1_P2: SessionSlot = {
      id: 'w1-p2',
      date: '2026-10-04',
      timeSlot: '09:00–10:15',
      startTime: '09:00',
      endTime: '10:15',
      pitchSectorId: 'p2n',
      ageGroupId: '2nd Class',
      pathway: 'Foundation',
      assignedCoachIds: ['coach-2'],
      sessionTitle: '2nd Class Skills',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const wave2_P1: SessionSlot = {
      id: 'w2-p1',
      date: '2026-10-04',
      timeSlot: '10:15–11:30',
      startTime: '10:15',
      endTime: '11:30',
      pitchSectorId: 'p1s',
      ageGroupId: '3rd Class',
      pathway: 'Foundation',
      assignedCoachIds: ['coach-3'],
      sessionTitle: '3rd Class Training',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const wave2_P2: SessionSlot = {
      id: 'w2-p2',
      date: '2026-10-04',
      timeSlot: '10:15–11:30',
      startTime: '10:15',
      endTime: '11:30',
      pitchSectorId: 'p2s',
      ageGroupId: '4th Class',
      pathway: 'Foundation',
      assignedCoachIds: ['coach-4'],
      sessionTitle: '4th Class Training',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const awaySlot: SessionSlot = {
      id: 'away-1',
      date: '2026-10-04',
      timeSlot: '10:15–11:30',
      startTime: '10:15',
      endTime: '11:30',
      pitchSectorId: 'away',
      isAway: true,
      venueName: 'Wesley College',
      ageGroupId: 'Inters',
      pathway: 'Youth Performance',
      assignedCoachIds: ['coach-5'],
      sessionTitle: 'Inter A @ Wesley',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const allSlots = [wave1_P1, wave1_P2, wave2_P1, wave2_P2, awaySlot];

    it('resolves real-time active wave at 10:45 AM during the 10:15–11:30 wave', () => {
      // 10:45 AM = 645 minutes
      const result = resolvePitchWaves(allSlots, 645);

      expect(result.isFallback).toBe(false);
      expect(result.nowSlots.map((s) => s.id)).toEqual(['w2-p1', 'w2-p2']);
      expect(result.turfNow.pitch1.map((s) => s.id)).toEqual(['w2-p1']);
      expect(result.turfNow.pitch2.map((s) => s.id)).toEqual(['w2-p2']);
      expect(result.waveStartMinutes).toBe(615); // 10:15
      expect(result.waveEndMinutes).toBe(690); // 11:30
    });

    it('strictly isolates Away fixtures from Milltown turf occupancy', () => {
      const result = resolvePitchWaves(allSlots, 645);

      // Even though awaySlot is from 10:15 to 11:30, it must NOT appear in nowSlots or turfNow
      expect(result.nowSlots.some((s) => s.id === 'away-1')).toBe(false);
      expect(result.turfNow.pitch1.some((s) => s.id === 'away-1')).toBe(false);
      expect(result.turfNow.pitch2.some((s) => s.id === 'away-1')).toBe(false);
    });

    it('accurately identifies the Next Wave when Wave 1 is active', () => {
      // 09:30 AM = 570 minutes (Wave 1 active)
      const result = resolvePitchWaves(allSlots, 570);

      expect(result.isFallback).toBe(false);
      expect(result.nowSlots.map((s) => s.id)).toEqual(['w1-p1', 'w1-p2']);
      expect(result.nextSlots.map((s) => s.id)).toEqual(['w2-p1', 'w2-p2']);
      expect(result.turfNext.pitch1.map((s) => s.id)).toEqual(['w2-p1']);
      expect(result.turfNext.pitch2.map((s) => s.id)).toEqual(['w2-p2']);
    });

    it('gracefully provides standby fallback before morning start (e.g. at 08:30 AM)', () => {
      // 08:30 AM = 510 minutes
      const result = resolvePitchWaves(allSlots, 510);

      expect(result.isFallback).toBe(true);
      // Fallback resolves to the earliest upcoming wave (Wave 1)
      expect(result.nowSlots.map((s) => s.id)).toEqual(['w1-p1', 'w1-p2']);
      expect(result.turfNow.pitch1.map((s) => s.id)).toEqual(['w1-p1']);
      expect(result.turfNow.pitch2.map((s) => s.id)).toEqual(['w1-p2']);
      // Next wave is Wave 2
      expect(result.nextSlots.map((s) => s.id)).toEqual(['w2-p1', 'w2-p2']);
    });

    it('gracefully falls back to first wave of the day if all waves are finished (e.g. at 17:00 PM)', () => {
      // 17:00 PM = 1020 minutes
      const result = resolvePitchWaves(allSlots, 1020);

      expect(result.isFallback).toBe(true);
      expect(result.nowSlots.map((s) => s.id)).toEqual(['w1-p1', 'w1-p2']);
      expect(result.nextSlots.map((s) => s.id)).toEqual(['w2-p1', 'w2-p2']);
    });
  });

  describe('resolveAwayWave', () => {
    const away1: SessionSlot = {
      id: 'away-1',
      date: '2026-10-04',
      timeSlot: '10:00–11:30',
      startTime: '10:00',
      endTime: '11:30',
      pitchSectorId: 'away',
      isAway: true,
      venueName: 'Mount Temple',
      ageGroupId: '1st Years',
      pathway: 'Development',
      assignedCoachIds: ['coach-1'],
      sessionTitle: '1st Years @ Mount Temple',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const away2: SessionSlot = {
      id: 'away-2',
      date: '2026-10-04',
      timeSlot: '12:00–13:30',
      startTime: '12:00',
      endTime: '13:30',
      pitchSectorId: 'away',
      isAway: true,
      venueName: 'Three Rock Rovers',
      ageGroupId: 'Minors',
      pathway: 'Youth Performance',
      assignedCoachIds: ['coach-2'],
      sessionTitle: 'Minors @ TRR',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    const homeSlot: SessionSlot = {
      id: 'home-1',
      date: '2026-10-04',
      timeSlot: '10:00–11:15',
      startTime: '10:00',
      endTime: '11:15',
      pitchSectorId: 'p1n',
      ageGroupId: '5th Class',
      pathway: 'Development',
      assignedCoachIds: [],
      sessionTitle: '5th Class Skills',
      sessionPurpose: '',
      coachNotes: '',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    it('resolves active and upcoming away fixtures correctly', () => {
      // 10:30 AM = 630 minutes
      const result = resolveAwayWave([away1, away2, homeSlot], 630);

      expect(result.allAwaySlots.length).toBe(2);
      expect(result.activeAwaySlots.map((s) => s.id)).toEqual(['away-1']);
      expect(result.upcomingAwaySlots.map((s) => s.id)).toEqual(['away-2']);
    });
  });
});
