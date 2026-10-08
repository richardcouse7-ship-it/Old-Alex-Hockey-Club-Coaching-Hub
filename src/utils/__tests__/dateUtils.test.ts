import { describe, it, expect } from 'vitest';
import {
  getUpcomingSunday,
  categorizeSeasonSundays,
  formatDateToISO,
} from '../dateUtils';
import { SEASON_SUNDAYS } from '../../data/seasonCalendar';

describe('Date Utilities (Sunday Operations)', () => {
  describe('formatDateToISO', () => {
    it('formats dates as YYYY-MM-DD padded correctly', () => {
      const date = new Date(2026, 8, 5); // Month is 0-indexed (8 = September)
      expect(formatDateToISO(date)).toBe('2026-09-05');
    });
  });

  describe('getUpcomingSunday', () => {
    it('returns the same date when referenceDate is already Sunday', () => {
      // 2026-10-11 is a Sunday
      const sunday = new Date('2026-10-11T12:00:00');
      expect(getUpcomingSunday(sunday)).toBe('2026-10-11');
    });

    it('returns the next Sunday when referenceDate is a Monday', () => {
      // 2026-10-05 is a Monday
      const monday = new Date('2026-10-05T10:00:00');
      expect(getUpcomingSunday(monday)).toBe('2026-10-11');
    });

    it('returns the next Sunday when referenceDate is a Saturday', () => {
      // 2026-10-10 is a Saturday
      const saturday = new Date('2026-10-10T15:00:00');
      expect(getUpcomingSunday(saturday)).toBe('2026-10-11');
    });

    it('returns the next Sunday when referenceDate is a Wednesday', () => {
      // 2026-10-07 is a Wednesday
      const wednesday = new Date('2026-10-07T09:00:00');
      expect(getUpcomingSunday(wednesday)).toBe('2026-10-11');
    });
  });

  describe('categorizeSeasonSundays', () => {
    it('segregates season Sundays into upcoming and past relative to the current week', () => {
      // Reference date: 2026-10-05 (Monday of week with Sunday 2026-10-11)
      const categorized = categorizeSeasonSundays('2026-10-05');

      expect(categorized.currentWeekSundayISO).toBe('2026-10-11');
      expect(categorized.upcomingSundays.length).toBeGreaterThan(0);
      expect(categorized.pastSundays.length).toBeGreaterThan(0);

      // Verify total count matches SEASON_SUNDAYS
      expect(categorized.upcomingSundays.length + categorized.pastSundays.length).toBe(
        SEASON_SUNDAYS.length
      );

      // Check upcoming includes 2026-10-11 marked as "This Sunday"
      const thisSunday = categorized.upcomingSundays.find((s) => s.date === '2026-10-11');
      expect(thisSunday).toBeDefined();
      expect(thisSunday?.status).toBe('This Sunday');
      expect(thisSunday?.statusLabel).toContain('(This Sunday)');

      // Check later dates marked as "Upcoming"
      const nextSunday = categorized.upcomingSundays.find((s) => s.date === '2026-10-18');
      expect(nextSunday).toBeDefined();
      expect(nextSunday?.status).toBe('Upcoming');
      expect(nextSunday?.statusLabel).toContain('(Upcoming)');

      // Check previous dates are in pastSundays marked as "Archived"
      const opener = categorized.pastSundays.find((s) => s.date === '2026-09-13');
      expect(opener).toBeDefined();
      expect(opener?.status).toBe('Archived');
      expect(opener?.statusLabel).toContain('(Archived)');
    });
  });
});
