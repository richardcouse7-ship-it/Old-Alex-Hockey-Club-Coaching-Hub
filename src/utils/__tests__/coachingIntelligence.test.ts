import { describe, it, expect } from 'vitest';
import {
  getSeasonPhaseForDate,
  getPreviousSessionReflection,
  getDebriefHealthSummary,
} from '../coachingIntelligence';
import { SessionSlot } from '../../types';

describe('coachingIntelligence utility', () => {
  describe('getSeasonPhaseForDate', () => {
    it('identifies Phase 1: Connect & Assess for September and October', () => {
      const sep = getSeasonPhaseForDate('2026-09-13');
      expect(sep.phaseNumber).toBe(1);
      expect(sep.phaseName).toBe('Connect & Assess');
      expect(sep.focus).toContain('Standards, baseline stick skills');

      const oct = getSeasonPhaseForDate('2026-10-18');
      expect(oct.phaseNumber).toBe(1);
      expect(oct.phaseName).toBe('Connect & Assess');
    });

    it('identifies Phase 2: Build the Toolkit for November and December', () => {
      const nov = getSeasonPhaseForDate('2026-11-08');
      expect(nov.phaseNumber).toBe(2);
      expect(nov.phaseName).toBe('Build the Toolkit');
      expect(nov.focus).toContain('2v1 overloads, 3D aerial lifts, team pressing');

      const dec = getSeasonPhaseForDate('2026-12-13');
      expect(dec.phaseNumber).toBe(2);
      expect(dec.phaseName).toBe('Build the Toolkit');
    });

    it('identifies Phase 3: Connect the Game for January, February, and March', () => {
      const jan = getSeasonPhaseForDate('2027-01-10');
      expect(jan.phaseNumber).toBe(3);
      expect(jan.phaseName).toBe('Connect the Game');
      expect(jan.focus).toContain('Pitch structure, 16m build-outs');

      const feb = getSeasonPhaseForDate('2027-02-14');
      expect(feb.phaseNumber).toBe(3);
      expect(feb.phaseName).toBe('Connect the Game');

      const mar = getSeasonPhaseForDate('2027-03-21');
      expect(mar.phaseNumber).toBe(3);
      expect(mar.phaseName).toBe('Connect the Game');
    });

    it('identifies Phase 4: Competition Polish for April and May', () => {
      const apr = getSeasonPhaseForDate('2027-04-11');
      expect(apr.phaseNumber).toBe(4);
      expect(apr.phaseName).toBe('Competition Polish');
      expect(apr.focus).toContain('Tournament execution, blitz scenarios');

      const may = getSeasonPhaseForDate('2027-05-09');
      expect(may.phaseNumber).toBe(4);
      expect(may.phaseName).toBe('Competition Polish');
    });

    it('falls back gracefully to Pre-season preparation for summer months or empty date', () => {
      const jul = getSeasonPhaseForDate('2026-07-15');
      expect(jul.phaseNumber).toBe(0);
      expect(jul.phaseName).toBe('Pre-Season Preparation');

      const empty = getSeasonPhaseForDate('');
      expect(empty.phaseNumber).toBe(0);
      expect(empty.phaseName).toBe('Pre-Season Preparation');
    });
  });

  describe('getPreviousSessionReflection', () => {
    const mockSlots: SessionSlot[] = [
      {
        id: 'slot-pen-w1',
        date: '2026-10-04',
        timeSlot: '09:00-10:15',
        startTime: '09:00',
        endTime: '10:15',
        pitchSectorId: 'p1n',
        ageGroupId: 'PEN',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-1'],
        sessionTitle: 'Intro Session',
        sessionPurpose: 'Basics',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
        postSessionReflection: {
          whatWorked: 'High energy and fun games',
          whatToChangeNextSunday: 'More cones for boundaries',
          priorityForNextWeek: 'Soft hands receiving',
        },
      },
      {
        id: 'slot-pen-w2',
        date: '2026-10-11',
        timeSlot: '09:00-10:15',
        startTime: '09:00',
        endTime: '10:15',
        pitchSectorId: 'p1n',
        ageGroupId: 'PEN',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-1'],
        sessionTitle: 'Second Session',
        sessionPurpose: 'Progressions',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
        postSessionReflection: {
          whatWorked: 'Passing was crisper',
          whatToChangeNextSunday: 'Earlier whistle on transitions',
          priorityForNextWeek: 'Stick tackle safety',
        },
      },
      {
        id: 'slot-inters-w2',
        date: '2026-10-11',
        timeSlot: '11:45-13:00',
        startTime: '11:45',
        endTime: '13:00',
        pitchSectorId: 'p1s',
        ageGroupId: 'Inters',
        pathway: 'Youth Performance',
        assignedCoachIds: ['coach-2'],
        sessionTitle: 'Inters Match Play',
        sessionPurpose: 'Pressing',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
        postSessionReflection: {
          whatWorked: 'Zonal press held shape',
          whatToChangeNextSunday: 'Faster substitutions',
          priorityForNextWeek: 'PC defensive exits',
        },
      },
    ];

    it('returns the most recent prior reflection for the same age group', () => {
      const currentSlot: SessionSlot = {
        ...mockSlots[0],
        id: 'slot-pen-w3',
        date: '2026-10-18',
      };

      const result = getPreviousSessionReflection(mockSlots, currentSlot);
      expect(result).not.toBeNull();
      expect(result?.priorDate).toBe('2026-10-11');
      expect(result?.reflection.priorityForNextWeek).toBe('Stick tackle safety');
      expect(result?.reflection.whatToChangeNextSunday).toBe('Earlier whistle on transitions');
    });

    it('ignores sessions from different age groups', () => {
      const intersSlot: SessionSlot = {
        ...mockSlots[2],
        id: 'slot-inters-w3',
        date: '2026-10-18',
      };

      const result = getPreviousSessionReflection(mockSlots, intersSlot);
      expect(result).not.toBeNull();
      expect(result?.priorDate).toBe('2026-10-11');
      expect(result?.reflection.priorityForNextWeek).toBe('PC defensive exits');
    });

    it('returns null gracefully when no prior session exists', () => {
      const firstWeekSlot: SessionSlot = {
        ...mockSlots[0],
        date: '2026-10-04',
      };

      const result = getPreviousSessionReflection(mockSlots, firstWeekSlot);
      expect(result).toBeNull();
    });

    it('returns null when prior slot has blank reflections', () => {
      const blankSlots: SessionSlot[] = [
        {
          ...mockSlots[0],
          id: 'slot-blank',
          date: '2026-09-20',
          postSessionReflection: {
            whatWorked: '',
            whatToChangeNextSunday: '',
            priorityForNextWeek: '',
          },
        },
      ];

      const currentSlot: SessionSlot = {
        ...mockSlots[0],
        id: 'slot-target',
        date: '2026-09-27',
      };

      const result = getPreviousSessionReflection(blankSlots, currentSlot);
      expect(result).toBeNull();
    });

    it('returns null gracefully if inputs are null or undefined', () => {
      expect(getPreviousSessionReflection(null, null)).toBeNull();
      expect(getPreviousSessionReflection([], undefined)).toBeNull();
    });
  });

  describe('getDebriefHealthSummary', () => {
    const slotsForSunday: SessionSlot[] = [
      {
        id: 'slot-1',
        date: '2026-10-04',
        timeSlot: '09:00-10:15',
        startTime: '09:00',
        endTime: '10:15',
        pitchSectorId: 'p1n',
        ageGroupId: 'PEN',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-1'],
        sessionTitle: 'PEN Session',
        sessionPurpose: 'Basics',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
        postSessionReflection: {
          whatWorked: 'Great engagement with the 1v1 ring drill',
          whatToChangeNextSunday: '',
          priorityForNextWeek: 'Body positioning',
        },
      },
      {
        id: 'slot-2',
        date: '2026-10-04',
        timeSlot: '09:00-10:15',
        startTime: '09:00',
        endTime: '10:15',
        pitchSectorId: 'p1s',
        ageGroupId: '1st Class',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-2'],
        sessionTitle: '1st Class Session',
        sessionPurpose: 'Skills',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
        postSessionReflection: {
          whatWorked: '',
          whatToChangeNextSunday: '',
          priorityForNextWeek: '',
        },
      },
      {
        id: 'slot-3',
        date: '2026-10-04',
        timeSlot: '10:30-11:45',
        startTime: '10:30',
        endTime: '11:45',
        pitchSectorId: 'p1n',
        ageGroupId: '2nd Class',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-3'],
        sessionTitle: '2nd Class Session',
        sessionPurpose: 'Passing',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
      },
      {
        id: 'slot-other-date',
        date: '2026-10-11',
        timeSlot: '09:00-10:15',
        startTime: '09:00',
        endTime: '10:15',
        pitchSectorId: 'p1n',
        ageGroupId: 'PEN',
        pathway: 'Foundation',
        assignedCoachIds: ['coach-1'],
        sessionTitle: 'PEN Future',
        sessionPurpose: 'Basics',
        coachNotes: '',
        attachedDrillIds: [],
        equipmentChecklist: [],
        status: 'Ready',
      },
    ];

    it('calculates completed and pending counts accurately for the target date', () => {
      const summary = getDebriefHealthSummary(slotsForSunday, '2026-10-04');
      expect(summary.totalCount).toBe(3);
      expect(summary.completedCount).toBe(1);
      expect(summary.pendingCount).toBe(2);
      expect(summary.groups).toHaveLength(3);

      const penGroup = summary.groups.find((g) => g.ageGroupId === 'PEN');
      expect(penGroup?.status).toBe('completed');

      const firstClassGroup = summary.groups.find((g) => g.ageGroupId === '1st Class');
      expect(firstClassGroup?.status).toBe('pending');

      const secondClassGroup = summary.groups.find((g) => g.ageGroupId === '2nd Class');
      expect(secondClassGroup?.status).toBe('pending');
    });

    it('handles empty or invalid inputs gracefully', () => {
      const empty = getDebriefHealthSummary([], '2026-10-04');
      expect(empty.totalCount).toBe(0);
      expect(empty.completedCount).toBe(0);
      expect(empty.pendingCount).toBe(0);
      expect(empty.groups).toEqual([]);

      const nullResult = getDebriefHealthSummary(null, '');
      expect(nullResult.totalCount).toBe(0);
    });
  });
});
