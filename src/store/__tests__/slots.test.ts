import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { SessionSlot } from '../../types';

describe('Timetable Slots Domain Actions', () => {
  const sampleSlot1: SessionSlot = {
    id: 'test-slot-101',
    date: '2026-09-13',
    timeSlot: '09:30–11:00',
    startTime: '09:30',
    endTime: '11:00',
    pitchSectorId: 'p1n',
    ageGroupId: '3rd Class',
    pathway: 'Foundation',
    assignedCoachIds: ['coach-1'],
    sessionTitle: 'Foundation Agility Circuit',
    sessionPurpose: 'Footwork and stick speed',
    coachNotes: 'Cone spacing 2m',
    attachedDrillIds: ['drill-1'],
    equipmentChecklist: [{ item: 'Cones', checked: true }],
    status: 'Ready',
  };

  const sampleSlot2: SessionSlot = {
    id: 'test-slot-102',
    date: '2026-09-20',
    timeSlot: '11:00–12:15',
    startTime: '11:00',
    endTime: '12:15',
    pitchSectorId: 'p2s',
    ageGroupId: '5th Class',
    pathway: 'Development',
    assignedCoachIds: ['coach-2'],
    sessionTitle: 'Inter-squad Scrimmage',
    sessionPurpose: 'Tactical positioning',
    coachNotes: 'Whistle on fouls',
    attachedDrillIds: [],
    equipmentChecklist: [],
    status: 'Ready',
  };

  beforeEach(() => {
    localStorage.clear();
    // Initialize clean slot state
    useAppStore.getState().setSlots([sampleSlot1, sampleSlot2]);
    useAppStore.getState().setSelectedDate('2026-09-13');
  });

  it('creates a new session slot without altering existing slots', () => {
    const newSlot: SessionSlot = {
      id: 'test-slot-new-999',
      date: '2026-09-13',
      timeSlot: '12:15–13:30',
      startTime: '12:15',
      endTime: '13:30',
      pitchSectorId: 'p1s',
      ageGroupId: 'Inters',
      pathway: 'Youth Performance',
      assignedCoachIds: ['coach-3'],
      sessionTitle: 'Youth Performance Match Prep',
      sessionPurpose: 'High intensity match readiness',
      coachNotes: 'Full pitch press',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    useAppStore.getState().addSlot(newSlot);

    const currentSlots = useAppStore.getState().slots;
    expect(currentSlots.length).toBe(3);

    const added = currentSlots.find((s) => s.id === 'test-slot-new-999');
    expect(added).toBeDefined();
    expect(added?.date).toBe('2026-09-13');
    expect(added?.sessionTitle).toBe('Youth Performance Match Prep');

    // Confirm previous slots remain untouched
    const slot1 = currentSlots.find((s) => s.id === 'test-slot-101');
    const slot2 = currentSlots.find((s) => s.id === 'test-slot-102');
    expect(slot1?.sessionTitle).toBe('Foundation Agility Circuit');
    expect(slot2?.sessionTitle).toBe('Inter-squad Scrimmage');
  });

  it('updates title, timing, sector, and coach allocation correctly on an existing slot', () => {
    const current = useAppStore.getState().slots.find((s) => s.id === 'test-slot-101')!;

    const updatedSlot: SessionSlot = {
      ...current,
      sessionTitle: 'Updated Agility & Overload Phase',
      timeSlot: '09:45–11:15',
      startTime: '09:45',
      endTime: '11:15',
      pitchSectorId: 'p2n',
      assignedCoachIds: ['coach-1', 'coach-4'],
    };

    useAppStore.getState().updateSlot(updatedSlot);

    const target = useAppStore.getState().slots.find((s) => s.id === 'test-slot-101');
    expect(target?.sessionTitle).toBe('Updated Agility & Overload Phase');
    expect(target?.timeSlot).toBe('09:45–11:15');
    expect(target?.pitchSectorId).toBe('p2n');
    expect(target?.assignedCoachIds).toEqual(['coach-1', 'coach-4']);

    // Ensure slot 2 was unaffected
    const unaffected = useAppStore.getState().slots.find((s) => s.id === 'test-slot-102');
    expect(unaffected?.sessionTitle).toBe('Inter-squad Scrimmage');
    expect(unaffected?.pitchSectorId).toBe('p2s');
  });

  it('deletes a target slot and preserves unrelated slots', () => {
    useAppStore.getState().deleteSlot('test-slot-101');

    const remainingSlots = useAppStore.getState().slots;
    expect(remainingSlots.length).toBe(1);
    expect(remainingSlots.find((s) => s.id === 'test-slot-101')).toBeUndefined();
    expect(remainingSlots[0].id).toBe('test-slot-102');
  });

  it('assigns and removes coaches dynamically to slots', () => {
    // Assign new coach
    useAppStore.getState().assignCoachToSlot('test-slot-101', 'coach-5');
    let slot = useAppStore.getState().slots.find((s) => s.id === 'test-slot-101');
    expect(slot?.assignedCoachIds).toContain('coach-5');
    expect(slot?.assignedCoachIds).toContain('coach-1');

    // Remove coach
    useAppStore.getState().removeCoachFromSlot('test-slot-101', 'coach-1');
    slot = useAppStore.getState().slots.find((s) => s.id === 'test-slot-101');
    expect(slot?.assignedCoachIds).not.toContain('coach-1');
    expect(slot?.assignedCoachIds).toContain('coach-5');
  });

  it('changes selectedDate in navigation without mutating slot objects', () => {
    const slotsBefore = useAppStore.getState().slots;
    useAppStore.getState().setSelectedDate('2026-09-20');

    expect(useAppStore.getState().selectedDate).toBe('2026-09-20');
    // Ensure slot data wasn't modified
    expect(useAppStore.getState().slots).toEqual(slotsBefore);
  });
});
