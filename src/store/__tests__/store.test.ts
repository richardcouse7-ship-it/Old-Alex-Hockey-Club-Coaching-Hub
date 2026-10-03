import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { STORAGE_KEYS, loadValidatedDomainData } from '../persistence/migration';
import { COACHES, INITIAL_SESSION_SLOTS } from '../../data/initialData';
import { Coach, SessionSlot } from '../../types';

describe('Store Initialization and Hydration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes store with all required state slices and domain actions', () => {
    const state = useAppStore.getState();

    // Verify domain slice presence
    expect(state.slots).toBeDefined();
    expect(state.coaches).toBeDefined();
    expect(state.fixtures).toBeDefined();
    expect(state.drills).toBeDefined();
    expect(state.checklist).toBeDefined();
    expect(state.firstAid).toBeDefined();
    expect(state.players).toBeDefined();
    expect(state.attendance).toBeDefined();
    expect(state.sectors).toBeDefined();

    // Verify UI/Navigation/Preference slice presence
    expect(state.currentTab).toBeDefined();
    expect(state.selectedDate).toBeDefined();
    expect(state.activeModal).toBeNull();
    expect(typeof state.isSunMode).toBe('boolean');
    expect(typeof state.isSidebarCollapsed).toBe('boolean');

    // Verify key action functions
    expect(typeof state.addSlot).toBe('function');
    expect(typeof state.updateCoach).toBe('function');
    expect(typeof state.recordMatchResult).toBe('function');
    expect(typeof state.recordPlayerAttendanceStatus).toBe('function');
    expect(typeof state.openModal).toBe('function');
  });

  it('uses default domain data when no persisted data exists in storage', () => {
    const data = loadValidatedDomainData();
    expect(data.slots.length).toBe(INITIAL_SESSION_SLOTS.length);
    expect(data.coaches.length).toBe(COACHES.length);
    expect(data.isSunMode).toBe(false);
    expect(data.isSidebarCollapsed).toBe(false);
  });

  it('persisted valid data takes precedence over default seed data', () => {
    const customSlot: SessionSlot = {
      id: 'custom-persisted-slot-1',
      date: '2026-10-18',
      timeSlot: '10:00–11:15',
      startTime: '10:00',
      endTime: '11:15',
      pitchSectorId: 'p1n',
      ageGroupId: '1st Class',
      pathway: 'Foundation',
      assignedCoachIds: ['coach-1'],
      sessionTitle: 'Custom Persisted Test Session',
      sessionPurpose: 'Testing precedence',
      coachNotes: 'Notes',
      attachedDrillIds: [],
      equipmentChecklist: [],
      status: 'Ready',
    };

    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify([customSlot]));

    const data = loadValidatedDomainData();
    expect(data.slots.length).toBe(1);
    expect(data.slots[0].id).toBe('custom-persisted-slot-1');
    expect(data.slots[0].sessionTitle).toBe('Custom Persisted Test Session');
  });

  it('missing individual domain keys do not break initialization and fall back safely', () => {
    // Only set coaches in localStorage, leaving slots, drills, fixtures missing
    const testCoaches: Coach[] = [
      {
        id: 'test-coach-only',
        name: 'Single Coach',
        role: 'Tester',
        phone: '0870000000',
        email: 'tester@oldalex.ie',
        accentColor: '#38bdf8',
        initials: 'SC',
        isActive: true,
      },
    ];

    localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(testCoaches));

    const data = loadValidatedDomainData();
    expect(data.coaches.length).toBe(1);
    expect(data.coaches[0].id).toBe('test-coach-only');
    // Missing keys fall back to valid initial defaults
    expect(data.slots.length).toBe(INITIAL_SESSION_SLOTS.length);
    expect(data.fixtures.length).toBeGreaterThan(0);
    expect(data.checklist.length).toBeGreaterThan(0);
  });

  it('malformed or corrupt persisted data does not crash application startup', () => {
    // Corrupt JSON string
    localStorage.setItem(STORAGE_KEYS.SLOTS, '{ not valid JSON syntax ...');
    localStorage.setItem(STORAGE_KEYS.COACHES, '12345'); // Non-array payload

    expect(() => {
      const data = loadValidatedDomainData();
      expect(Array.isArray(data.slots)).toBe(true);
      expect(Array.isArray(data.coaches)).toBe(true);
      expect(data.slots.length).toBe(INITIAL_SESSION_SLOTS.length);
      expect(data.coaches.length).toBe(COACHES.length);
    }).not.toThrow();
  });
});
