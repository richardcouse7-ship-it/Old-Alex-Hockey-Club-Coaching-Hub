import { SEASON_SUNDAYS, SeasonSunday } from '../data/seasonCalendar';

/**
 * Format a Date object into 'YYYY-MM-DD' ISO format based on local year/month/day
 * avoiding timezone offset shifts.
 */
export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the upcoming Sunday ISO string (`YYYY-MM-DD`).
 * - If referenceDate is Sunday (getDay() === 0), returns that Sunday's ISO date.
 * - Otherwise, calculates days until next Sunday: (7 - day) % 7 and adds it.
 */
export function getUpcomingSunday(referenceDate: Date = new Date()): string {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  const daysUntilSunday = (7 - day) % 7;

  if (daysUntilSunday > 0) {
    d.setDate(d.getDate() + daysUntilSunday);
  }

  return formatDateToISO(d);
}

export interface CategorizedSunday extends SeasonSunday {
  status: 'This Sunday' | 'Upcoming' | 'Archived';
  statusLabel: string;
}

export interface CategorizedSundaysResult {
  upcomingSundays: CategorizedSunday[];
  pastSundays: CategorizedSunday[];
  currentWeekSundayISO: string;
}

/**
 * Splits SEASON_SUNDAYS into upcoming and past Sundays based on today or specified ISO date.
 * Appends human-friendly status labels.
 */
export function categorizeSeasonSundays(
  todayISO: string = formatDateToISO(new Date())
): CategorizedSundaysResult {
  // Determine the current active week's Sunday
  const [year, month, day] = todayISO.split('-').map(Number);
  const refDate = new Date(year, (month || 1) - 1, day || 1);
  const currentWeekSundayISO = getUpcomingSunday(refDate);

  const upcomingSundays: CategorizedSunday[] = [];
  const pastSundays: CategorizedSunday[] = [];

  for (const item of SEASON_SUNDAYS) {
    if (item.date === currentWeekSundayISO) {
      upcomingSundays.push({
        ...item,
        status: 'This Sunday',
        statusLabel: `${item.label} (This Sunday)`,
      });
    } else if (item.date > currentWeekSundayISO) {
      upcomingSundays.push({
        ...item,
        status: 'Upcoming',
        statusLabel: `${item.label} (Upcoming)`,
      });
    } else {
      pastSundays.push({
        ...item,
        status: 'Archived',
        statusLabel: `${item.label} (Archived)`,
      });
    }
  }

  return {
    upcomingSundays,
    pastSundays,
    currentWeekSundayISO,
  };
}
