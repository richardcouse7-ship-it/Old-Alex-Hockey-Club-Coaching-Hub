import { AppState } from './types';
import { Coach, PitchSector, ScheduleConflict, SessionSlot } from '../types';

let lastConflictsSlots: SessionSlot[] | null = null;
let lastConflictsCoaches: Coach[] | null = null;
let cachedConflicts: ScheduleConflict[] = [];

function computeConflicts(state: AppState): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const slots = state.slots;
  const coaches = state.coaches;

  // Group slots by timeSlot AND date
  const slotsByTimeAndDate: Record<string, SessionSlot[]> = {};
  for (const slot of slots) {
    const key = `${slot.date}_${slot.timeSlot}`;
    if (!slotsByTimeAndDate[key]) {
      slotsByTimeAndDate[key] = [];
    }
    slotsByTimeAndDate[key].push(slot);
  }

  // 1. Check for unassigned slots
  for (const slot of slots) {
    if (slot.assignedCoachIds.length === 0) {
      conflicts.push({
        id: `conflict-unassigned-${slot.id}`,
        type: 'NO_COACH_ASSIGNED',
        severity: 'high',
        title: `Uncovered Slot: ${slot.ageGroupId}`,
        description: `No coach assigned for ${slot.ageGroupId} at ${slot.timeSlot} on ${slot.pitchSectorId.toUpperCase()}.`,
        slotIds: [slot.id],
        timeSlot: slot.timeSlot,
        affectedPitchSectorId: slot.pitchSectorId,
      });
    }
  }

  // 2. Check for coach and sector double-bookings
  for (const [key, slotsList] of Object.entries(slotsByTimeAndDate)) {
    const timeSlot = slotsList[0]?.timeSlot || '';
    const coachOccurrenceMap: Record<string, string[]> = {};

    for (const slot of slotsList) {
      for (const coachId of slot.assignedCoachIds) {
        if (!coachOccurrenceMap[coachId]) {
          coachOccurrenceMap[coachId] = [];
        }
        coachOccurrenceMap[coachId].push(slot.id);
      }
    }

    for (const [coachId, assignedSlotIds] of Object.entries(coachOccurrenceMap)) {
      if (assignedSlotIds.length > 1) {
        const coach = coaches.find((c) => c.id === coachId);
        conflicts.push({
          id: `conflict-coach-${coachId}-${key}`,
          type: 'COACH_DOUBLE_BOOKED',
          severity: 'high',
          title: `Double-Booked Coach: ${coach?.name || 'Coach'}`,
          description: `${coach?.name || 'Coach'} is scheduled simultaneously for ${assignedSlotIds.length} different sessions during ${timeSlot}.`,
          slotIds: assignedSlotIds,
          timeSlot,
          affectedCoachId: coachId,
        });
      }
    }

    const sectorOccurrenceMap: Record<string, string[]> = {};
    for (const slot of slotsList) {
      if (slot.isAway || slot.pitchSectorId === 'away') continue; // Away fixtures occur off-site and do not collide with Milltown sectors
      if (!sectorOccurrenceMap[slot.pitchSectorId]) {
        sectorOccurrenceMap[slot.pitchSectorId] = [];
      }
      sectorOccurrenceMap[slot.pitchSectorId].push(slot.id);
    }

    for (const [sectorId, assignedSlotIds] of Object.entries(sectorOccurrenceMap)) {
      if (assignedSlotIds.length > 1) {
        conflicts.push({
          id: `conflict-sector-${sectorId}-${key}`,
          type: 'PITCH_OVERBOOKED',
          severity: 'high',
          title: `Pitch Collision: Sector ${sectorId.toUpperCase()}`,
          description: `Sector ${sectorId.toUpperCase()} has ${assignedSlotIds.length} different squads scheduled simultaneously during ${timeSlot}.`,
          slotIds: assignedSlotIds,
          timeSlot,
          affectedPitchSectorId: sectorId,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Computes timetable conflicts with snapshot cache to avoid infinite re-renders
 */
export function selectConflicts(state: AppState): ScheduleConflict[] {
  if (state.slots === lastConflictsSlots && state.coaches === lastConflictsCoaches) {
    return cachedConflicts;
  }
  lastConflictsSlots = state.slots;
  lastConflictsCoaches = state.coaches;
  cachedConflicts = computeConflicts(state);
  return cachedConflicts;
}

let lastUtilSlots: SessionSlot[] | null = null;
let lastUtilDate: string | null = null;
let lastUtilSectors: PitchSector[] | null = null;
let cachedUtilization: {
  sectorStats: {
    sectorId: string;
    sectorCode: string;
    sectorName: string;
    occupiedSlots: number;
    totalSlots: number;
    percentage: number;
  }[];
  totalOccupied: number;
  totalPossible: number;
  overallPercentage: number;
} | null = null;

function computeUtilization(state: AppState) {
  const slotsForDate = state.slots.filter((s) => s.date === state.selectedDate);
  const totalStandardSlotsPerSector = 4;

  const sectorStats = state.sectors.map((sector) => {
    const occupiedSlots = slotsForDate.filter(
      (s) => !s.isAway && s.pitchSectorId !== 'away' && s.pitchSectorId.toLowerCase() === sector.id.toLowerCase()
    ).length;

    const percentage = Math.min(
      100,
      Math.round((occupiedSlots / totalStandardSlotsPerSector) * 100)
    );

    return {
      sectorId: sector.id,
      sectorCode: sector.code,
      sectorName: sector.name,
      occupiedSlots,
      totalSlots: totalStandardSlotsPerSector,
      percentage,
    };
  });

  const totalOccupied = sectorStats.reduce((sum, s) => sum + s.occupiedSlots, 0);
  const totalPossible = sectorStats.length * totalStandardSlotsPerSector;
  const overallPercentage = totalPossible > 0 ? Math.round((totalOccupied / totalPossible) * 100) : 0;

  return {
    sectorStats,
    totalOccupied,
    totalPossible,
    overallPercentage,
  };
}

/**
 * Calculates Sunday pitch utilization metric with snapshot cache
 */
export function selectUtilization(state: AppState) {
  if (
    state.slots === lastUtilSlots &&
    state.selectedDate === lastUtilDate &&
    state.sectors === lastUtilSectors &&
    cachedUtilization !== null
  ) {
    return cachedUtilization;
  }
  lastUtilSlots = state.slots;
  lastUtilDate = state.selectedDate;
  lastUtilSectors = state.sectors;
  cachedUtilization = computeUtilization(state);
  return cachedUtilization;
}

/**
 * Selects unread notification count
 */
export function selectUnreadNotificationsCount(state: AppState): number {
  return state.notifications.filter((n) => !n.read).length;
}

let lastDateSlots: SessionSlot[] | null = null;
let lastDate: string | null = null;
let cachedDateSlots: SessionSlot[] = [];

/**
 * Selects all slots for the active selectedDate with snapshot cache
 */
export function selectSlotsForCurrentDate(state: AppState): SessionSlot[] {
  if (state.slots === lastDateSlots && state.selectedDate === lastDate) {
    return cachedDateSlots;
  }
  lastDateSlots = state.slots;
  lastDate = state.selectedDate;
  cachedDateSlots = state.slots.filter((s) => s.date === state.selectedDate);
  return cachedDateSlots;
}

/**
 * Selects the currently inspected slot in drawer
 */
export function selectSelectedSlot(state: AppState): SessionSlot | null {
  if (!state.selectedSlotId) return null;
  return state.slots.find((s) => s.id === state.selectedSlotId) || null;
}
