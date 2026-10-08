import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { Coach, CoachAvailability } from '../../types';

describe('Coach Roster and Availability Domain Actions', () => {
  const coach1: Coach = {
    id: 'coach-test-1',
    name: 'Ben McInerney',
    role: 'Lead Coach',
    phone: '0871112233',
    email: 'ben@oldalex.ie',
    accentColor: '#38bdf8',
    initials: 'BM',
    isActive: true,
  };

  const coach2: Coach = {
    id: 'coach-test-2',
    name: 'Hannah Fox',
    role: 'Assistant Coach',
    phone: '0874445566',
    email: 'hannah@oldalex.ie',
    accentColor: '#f43f5e',
    initials: 'HF',
    isActive: true,
  };

  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().setCoaches([coach1, coach2]);
    useAppStore.getState().setAvailability([]);
  });

  it('adds a new coach and preserves existing coach records', () => {
    const newCoach: Coach = {
      id: 'coach-test-3',
      name: 'Amy Springs',
      role: 'Youth Coach',
      phone: '0879998877',
      email: 'amy@oldalex.ie',
      accentColor: '#a855f7',
      initials: 'AS',
      isActive: true,
    };

    useAppStore.getState().addCoach(newCoach);

    const coaches = useAppStore.getState().coaches;
    expect(coaches.length).toBe(3);
    expect(coaches.find((c) => c.id === 'coach-test-3')?.name).toBe('Amy Springs');
    expect(coaches.find((c) => c.id === 'coach-test-1')?.name).toBe('Ben McInerney');
  });

  it('updates coach role, qualifications, and contact details without mutating other coaches', () => {
    const target = useAppStore.getState().coaches.find((c) => c.id === 'coach-test-1')!;

    useAppStore.getState().updateCoach({
      ...target,
      role: 'Senior Development Lead',
      phone: '0870009999',
    });

    const updated = useAppStore.getState().coaches.find((c) => c.id === 'coach-test-1');
    expect(updated?.role).toBe('Senior Development Lead');
    expect(updated?.phone).toBe('0870009999');

    // Verify coach 2 was untouched
    const untouched = useAppStore.getState().coaches.find((c) => c.id === 'coach-test-2');
    expect(untouched?.role).toBe('Assistant Coach');
    expect(untouched?.phone).toBe('0874445566');
  });

  it('records and updates coach availability status for a specific date', () => {
    useAppStore.getState().updateAvailabilityStatus(
      'coach-test-1',
      '2026-09-13',
      'AVAILABLE',
      'Pitch 1 morning'
    );

    let records = useAppStore.getState().availability;
    expect(records.length).toBe(1);
    expect(records[0].coachId).toBe('coach-test-1');
    expect(records[0].date).toBe('2026-09-13');
    expect(records[0].status).toBe('AVAILABLE');
    expect(records[0].notes).toBe('Pitch 1 morning');

    // Update the same coach on the same date (e.g. status changes to MORNING_ONLY)
    useAppStore.getState().updateAvailabilityStatus(
      'coach-test-1',
      '2026-09-13',
      'MORNING_ONLY',
      'Late arrival 10:00'
    );

    records = useAppStore.getState().availability;
    expect(records.length).toBe(1); // Modifies existing record, doesn't duplicate
    expect(records[0].status).toBe('MORNING_ONLY');
    expect(records[0].notes).toBe('Late arrival 10:00');
  });

  it('deletes coaches and cleans up associated availability', () => {
    useAppStore.getState().updateAvailabilityStatus(
      'coach-test-1',
      '2026-09-13',
      'AVAILABLE'
    );
    useAppStore.getState().updateAvailabilityStatus(
      'coach-test-2',
      '2026-09-13',
      'AVAILABLE'
    );

    useAppStore.getState().deleteCoaches(['coach-test-1']);

    const remainingCoaches = useAppStore.getState().coaches;
    expect(remainingCoaches.length).toBe(1);
    expect(remainingCoaches[0].id).toBe('coach-test-2');

    // Availability for coach-test-1 must be pruned
    const remainingAvail = useAppStore.getState().availability;
    expect(remainingAvail.length).toBe(1);
    expect(remainingAvail[0].coachId).toBe('coach-test-2');
  });

  it('syncs with master roster non-destructively and handles aliases', () => {
    // Modify coach1 custom properties
    const customCoach1: Coach = {
      ...coach1,
      role: 'Head of Youth Hockey',
      phone: '0879991111',
    };
    useAppStore.getState().setCoaches([customCoach1]);

    const result = useAppStore.getState().syncMasterRoster();
    const finalCoaches = useAppStore.getState().coaches;

    // Preserves the existing coach customization
    const syncedCoach1 = finalCoaches.find((c) => c.name.toLowerCase() === coach1.name.toLowerCase());
    expect(syncedCoach1).toBeDefined();
    expect(syncedCoach1?.role).toBe('Head of Youth Hockey');
    expect(syncedCoach1?.phone).toBe('0879991111');

    // Added all other master coaches
    expect(result.addedCount).toBeGreaterThan(0);
    expect(result.total).toBe(finalCoaches.length);
    expect(finalCoaches.some((c) => c.name === 'Nicola Wildish')).toBe(true);
    expect(finalCoaches.some((c) => c.name === 'Richard Couse')).toBe(true);

    // Running sync again reports 0 added
    const secondSync = useAppStore.getState().syncMasterRoster();
    expect(secondSync.addedCount).toBe(0);
    expect(secondSync.total).toBe(finalCoaches.length);
  });
});

