import { describe, it, expect } from 'vitest';
import {
  selectSlotsForCurrentDate,
  selectConflicts,
  selectUtilization,
  selectSelectedSlot,
  selectUnreadNotificationsCount,
} from '../selectors';
import { AppState } from '../types';
import { Coach, PitchSector, SessionSlot } from '../../types';

describe('Selector Referential Stability & Calculations', () => {
  const mockSectors: PitchSector[] = [
    {
      id: 'p1n',
      code: 'P1N',
      name: 'Pitch 1 North',
      description: 'Main Turf',
      pitch: 'Pitch 1',
      side: 'North',
    },
    {
      id: 'p1s',
      code: 'P1S',
      name: 'Pitch 1 South',
      description: 'South Turf',
      pitch: 'Pitch 1',
      side: 'South',
    },
  ];

  const mockCoaches: Coach[] = [
    {
      id: 'c-1',
      name: 'Richard Couse',
      role: 'Director of Coaching',
      phone: '0871234567',
      email: 'rc@oldalex.ie',
      accentColor: '#9333ea',
      initials: 'RC',
      isActive: true,
    },
    {
      id: 'c-2',
      name: 'Jessica Walsh',
      role: 'Foundation Lead',
      phone: '0877654321',
      email: 'jw@oldalex.ie',
      accentColor: '#10b981',
      initials: 'JW',
      isActive: true,
    },
  ];

  const slotA: SessionSlot = {
    id: 's-1',
    date: '2026-09-13',
    timeSlot: '09:30–11:00',
    startTime: '09:30',
    endTime: '11:00',
    pitchSectorId: 'p1n',
    ageGroupId: '1st Class',
    pathway: 'Foundation',
    assignedCoachIds: ['c-1'],
    sessionTitle: 'Session 1',
    sessionPurpose: 'Purpose',
    coachNotes: 'Notes',
    attachedDrillIds: [],
    equipmentChecklist: [],
    status: 'Ready',
  };

  const slotB: SessionSlot = {
    id: 's-2',
    date: '2026-09-13',
    timeSlot: '09:30–11:00',
    startTime: '09:30',
    endTime: '11:00',
    pitchSectorId: 'p1s',
    ageGroupId: '2nd Class',
    pathway: 'Foundation',
    assignedCoachIds: [], // Unassigned -> triggers NO_COACH_ASSIGNED conflict
    sessionTitle: 'Session 2',
    sessionPurpose: 'Purpose',
    coachNotes: 'Notes',
    attachedDrillIds: [],
    equipmentChecklist: [],
    status: 'Needs Coach',
  };

  const slotDifferentDate: SessionSlot = {
    id: 's-3',
    date: '2026-09-20',
    timeSlot: '11:00–12:15',
    startTime: '11:00',
    endTime: '12:15',
    pitchSectorId: 'p1n',
    ageGroupId: '3rd Class',
    pathway: 'Development',
    assignedCoachIds: ['c-2'],
    sessionTitle: 'Session 3',
    sessionPurpose: 'Purpose',
    coachNotes: 'Notes',
    attachedDrillIds: [],
    equipmentChecklist: [],
    status: 'Ready',
  };

  const baseState: Partial<AppState> = {
    slots: [slotA, slotB, slotDifferentDate],
    coaches: mockCoaches,
    sectors: mockSectors,
    selectedDate: '2026-09-13',
    selectedSlotId: 's-1',
    notifications: [
      {
        id: 'n-1',
        title: 'Alert',
        message: 'Weather warning',
        type: 'urgent',
        timestamp: new Date().toISOString(),
        date: '2026-09-13',
        read: false,
      },
      {
        id: 'n-2',
        title: 'Info',
        message: 'Pitch open',
        type: 'schedule_update',
        timestamp: new Date().toISOString(),
        date: '2026-09-13',
        read: true,
      },
    ],
  };

  it('selectSlotsForCurrentDate filters slots correctly and maintains referential stability', () => {
    const res1 = selectSlotsForCurrentDate(baseState as AppState);
    expect(res1.length).toBe(2);
    expect(res1.map((s) => s.id)).toEqual(['s-1', 's-2']);

    // Call again with identical state -> must return the exact same array reference (===)
    const res2 = selectSlotsForCurrentDate(baseState as AppState);
    expect(res1).toBe(res2);
  });

  it('selectConflicts identifies conflicts and maintains referential stability when inputs are unchanged', () => {
    const conflicts1 = selectConflicts(baseState as AppState);
    expect(conflicts1.length).toBeGreaterThanOrEqual(1);

    // slotB has no coaches assigned
    const unassigned = conflicts1.find((c) => c.type === 'NO_COACH_ASSIGNED');
    expect(unassigned).toBeDefined();
    expect(unassigned?.slotIds).toContain('s-2');

    // Second call with same state -> must return identical reference to avoid React 19 infinite loop
    const conflicts2 = selectConflicts(baseState as AppState);
    expect(conflicts1).toBe(conflicts2);
  });

  it('selectUtilization calculates metrics and maintains referential stability when inputs are unchanged', () => {
    const util1 = selectUtilization(baseState as AppState);
    expect(util1.sectorStats.length).toBe(mockSectors.length);
    expect(util1.totalOccupied).toBe(2);
    expect(util1.overallPercentage).toBeGreaterThan(0);

    // Second call with identical state -> must return identical reference to avoid React 19 infinite loop
    const util2 = selectUtilization(baseState as AppState);
    expect(util1).toBe(util2);
  });

  it('selectSelectedSlot returns the active slot reference or null if unselected', () => {
    const slot = selectSelectedSlot(baseState as AppState);
    expect(slot).toBeDefined();
    expect(slot?.id).toBe('s-1');

    const emptyState = { ...baseState, selectedSlotId: null };
    expect(selectSelectedSlot(emptyState as AppState)).toBeNull();
  });

  it('selectUnreadNotificationsCount correctly counts unread notifications', () => {
    const unread = selectUnreadNotificationsCount(baseState as AppState);
    expect(unread).toBe(1);
  });
});
