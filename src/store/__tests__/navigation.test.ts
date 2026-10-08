import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { STORAGE_KEYS } from '../persistence/migration';
import { getUpcomingSunday } from '../../utils/dateUtils';
import { createNavigationSlice } from '../slices/navigationSlice';

describe('Navigation Slice & Sunday Auto-Update', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes selectedDate dynamically to the upcoming Sunday by default', () => {
    const upcomingSunday = getUpcomingSunday();
    const slice = createNavigationSlice(
      () => {},
      () => ({}) as any,
      {} as any
    );

    expect(slice.selectedDate).toBe(upcomingSunday);
  });

  it('initializes selectedDate from localStorage if already persisted', () => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_DATE, JSON.stringify('2026-11-15'));
    const slice = createNavigationSlice(
      () => {},
      () => ({}) as any,
      {} as any
    );

    expect(slice.selectedDate).toBe('2026-11-15');
  });

  it('setSelectedDate updates state and persists to localStorage', () => {
    useAppStore.getState().setSelectedDate('2026-10-18');

    expect(useAppStore.getState().selectedDate).toBe('2026-10-18');
    expect(localStorage.getItem(STORAGE_KEYS.SELECTED_DATE)).toBe(JSON.stringify('2026-10-18'));
  });

  it('allows selecting and viewing past archived Sundays without crashing', () => {
    const pastSunday = '2026-09-13';
    useAppStore.getState().setSelectedDate(pastSunday);

    expect(useAppStore.getState().selectedDate).toBe(pastSunday);
    expect(localStorage.getItem(STORAGE_KEYS.SELECTED_DATE)).toBe(JSON.stringify(pastSunday));

    // Verify slots and state queries remain intact
    const state = useAppStore.getState();
    const dateSlots = state.slots.filter((s) => s.date === pastSunday);
    expect(Array.isArray(dateSlots)).toBe(true);
  });
});
