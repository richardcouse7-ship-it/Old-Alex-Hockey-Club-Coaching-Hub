import { SessionSlot } from '../types';
import { isAwaySession } from './awayFixtureUtils';

/**
 * Converts a time string (e.g. "09:30", "9:30", "14:15") into total minutes from midnight.
 * Gracefully handles whitespace and single-digit hours. Returns 0 if invalid.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const cleaned = timeStr.trim();
  const parts = cleaned.split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Extracts start and end minutes for a SessionSlot.
 * Uses startTime and endTime properties if available, or parses from timeSlot (e.g. "10:45–12:00").
 */
export function getSlotTimeRangeMinutes(slot: SessionSlot): { startMinutes: number; endMinutes: number } {
  let startMinutes = 0;
  let endMinutes = 0;

  if (slot.startTime) {
    startMinutes = parseTimeToMinutes(slot.startTime);
  }
  if (slot.endTime) {
    endMinutes = parseTimeToMinutes(slot.endTime);
  }

  // Fallback to timeSlot string e.g. "10:45–12:00" or "10:45-12:00"
  if ((!startMinutes || !endMinutes) && slot.timeSlot) {
    const separator = slot.timeSlot.includes('–') ? '–' : '-';
    const [startStr, endStr] = slot.timeSlot.split(separator).map((s) => s.trim());
    if (!startMinutes && startStr) {
      startMinutes = parseTimeToMinutes(startStr);
    }
    if (!endMinutes && endStr) {
      endMinutes = parseTimeToMinutes(endStr);
    }
  }

  // Safeguard: if endMinutes <= startMinutes (e.g. missing end time), assume 60 min session
  if (endMinutes <= startMinutes && startMinutes > 0) {
    endMinutes = startMinutes + 60;
  }

  return { startMinutes, endMinutes };
}

/**
 * Checks whether a slot is assigned to Pitch 1 (Front Turf).
 */
export function isPitch1Slot(slot: SessionSlot): boolean {
  const sector = (slot.pitchSectorId || '').toLowerCase();
  const title = (slot.sessionTitle || '').toLowerCase();
  const notes = (slot.coachNotes || '').toLowerCase();

  return (
    sector.startsWith('p1') ||
    sector.includes('pitch 1') ||
    sector.includes('pitch1') ||
    sector.includes('front') ||
    title.includes('pitch 1') ||
    title.includes('front') ||
    notes.includes('pitch 1') ||
    notes.includes('front')
  );
}

/**
 * Checks whether a slot is assigned to Pitch 2 (Back Turf).
 */
export function isPitch2Slot(slot: SessionSlot): boolean {
  const sector = (slot.pitchSectorId || '').toLowerCase();
  const title = (slot.sessionTitle || '').toLowerCase();
  const notes = (slot.coachNotes || '').toLowerCase();

  return (
    sector.startsWith('p2') ||
    sector.includes('pitch 2') ||
    sector.includes('pitch2') ||
    sector.includes('back') ||
    title.includes('pitch 2') ||
    title.includes('back') ||
    notes.includes('pitch 2') ||
    notes.includes('back')
  );
}

export interface TurfSplit {
  pitch1: SessionSlot[];
  pitch2: SessionSlot[];
  other: SessionSlot[];
}

export interface PitchWavesResult {
  nowSlots: SessionSlot[];
  nextSlots: SessionSlot[];
  isFallback: boolean;
  waveStartMinutes: number | null;
  waveEndMinutes: number | null;
  turfNow: TurfSplit;
  turfNext: TurfSplit;
}

/**
 * Segregates an array of slots into Pitch 1, Pitch 2, and Other.
 */
export function segregateTurfSlots(slots: SessionSlot[]): TurfSplit {
  const pitch1: SessionSlot[] = [];
  const pitch2: SessionSlot[] = [];
  const other: SessionSlot[] = [];

  for (const slot of slots) {
    if (isPitch1Slot(slot)) {
      pitch1.push(slot);
    } else if (isPitch2Slot(slot)) {
      pitch2.push(slot);
    } else {
      other.push(slot);
    }
  }

  return { pitch1, pitch2, other };
}

/**
 * Resolves current ("Now on Turf") and upcoming ("Next Wave Up") sessions for Sunday operations.
 * 
 * Strict invariants:
 * 1. Away sessions (isAway || pitchSectorId === 'away') are completely isolated and filtered out.
 * 2. If no active slots at currentTimeMinutes, fallbackGracefully to the earliest upcoming wave,
 *    or the first wave of the day.
 * 3. Accurately identifies the immediate next upcoming wave sorted by earliest start time.
 * 4. Segregates turf slots between Pitch 1 (Front) and Pitch 2 (Back).
 */
export function resolvePitchWaves(
  slots: SessionSlot[],
  currentTimeMinutes: number,
  selectedDateSlots: SessionSlot[] = slots
): PitchWavesResult {
  // 1. Filter out Away slots from turf occupancy calculation
  const homeSlots = (selectedDateSlots.length > 0 ? selectedDateSlots : slots).filter(
    (slot) => !isAwaySession(slot)
  );

  if (homeSlots.length === 0) {
    const emptySplit: TurfSplit = { pitch1: [], pitch2: [], other: [] };
    return {
      nowSlots: [],
      nextSlots: [],
      isFallback: false,
      waveStartMinutes: null,
      waveEndMinutes: null,
      turfNow: emptySplit,
      turfNext: emptySplit,
    };
  }

  // 2. Map slots with their start and end minutes
  const timedSlots = homeSlots.map((slot) => {
    const { startMinutes, endMinutes } = getSlotTimeRangeMinutes(slot);
    return { slot, startMinutes, endMinutes };
  });

  // 3. Find active slots where startMinutes <= currentTimeMinutes && currentTimeMinutes < endMinutes
  const activeTimed = timedSlots.filter(
    (t) => t.startMinutes <= currentTimeMinutes && currentTimeMinutes < t.endMinutes
  );

  let nowSlots: SessionSlot[] = [];
  let isFallback = false;
  let waveStartMinutes: number | null = null;
  let waveEndMinutes: number | null = null;

  if (activeTimed.length > 0) {
    nowSlots = activeTimed.map((t) => t.slot);
    waveStartMinutes = Math.min(...activeTimed.map((t) => t.startMinutes));
    waveEndMinutes = Math.max(...activeTimed.map((t) => t.endMinutes));
  } else {
    // Fallback: If not currently in a wave (e.g. before 09:00, or in a break between waves)
    // Find upcoming waves first (startMinutes > currentTimeMinutes)
    const upcomingTimed = timedSlots
      .filter((t) => t.startMinutes > currentTimeMinutes)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    if (upcomingTimed.length > 0) {
      const earliestStart = upcomingTimed[0].startMinutes;
      const earliestWave = upcomingTimed.filter((t) => t.startMinutes === earliestStart);
      nowSlots = earliestWave.map((t) => t.slot);
      isFallback = true;
      waveStartMinutes = earliestStart;
      waveEndMinutes = Math.max(...earliestWave.map((t) => t.endMinutes));
    } else {
      // All sessions for the day have finished, fallback to first wave of the day
      const sortedByStart = [...timedSlots].sort((a, b) => a.startMinutes - b.startMinutes);
      const firstStart = sortedByStart[0].startMinutes;
      const firstWave = sortedByStart.filter((t) => t.startMinutes === firstStart);
      nowSlots = firstWave.map((t) => t.slot);
      isFallback = true;
      waveStartMinutes = firstStart;
      waveEndMinutes = Math.max(...firstWave.map((t) => t.endMinutes));
    }
  }

  // 4. Resolve Next Wave: Slots that start strictly after the current active wave starts (or current time)
  // Specifically, find slots where startMinutes > (isFallback ? waveStartMinutes : currentTimeMinutes)
  const referenceMinute = isFallback
    ? (waveStartMinutes ?? currentTimeMinutes)
    : Math.min(...activeTimed.map((t) => t.startMinutes));

  const futureTimed = timedSlots
    .filter((t) => t.startMinutes > referenceMinute)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let nextSlots: SessionSlot[] = [];
  if (futureTimed.length > 0) {
    const nextStart = futureTimed[0].startMinutes;
    // Next wave is all slots sharing that next earliest start time
    nextSlots = futureTimed.filter((t) => t.startMinutes === nextStart).map((t) => t.slot);
  }

  return {
    nowSlots,
    nextSlots,
    isFallback,
    waveStartMinutes,
    waveEndMinutes,
    turfNow: segregateTurfSlots(nowSlots),
    turfNext: segregateTurfSlots(nextSlots),
  };
}

export interface AwayWaveResult {
  activeAwaySlots: SessionSlot[];
  upcomingAwaySlots: SessionSlot[];
  allAwaySlots: SessionSlot[];
}

/**
 * Resolves active and upcoming away fixtures for the same Sunday date.
 */
export function resolveAwayWave(
  slots: SessionSlot[],
  currentTimeMinutes: number
): AwayWaveResult {
  const awaySlots = slots.filter((slot) => isAwaySession(slot));

  const timedAway = awaySlots.map((slot) => {
    const { startMinutes, endMinutes } = getSlotTimeRangeMinutes(slot);
    return { slot, startMinutes, endMinutes };
  });

  const activeAwaySlots = timedAway
    .filter((t) => t.startMinutes <= currentTimeMinutes && currentTimeMinutes < t.endMinutes)
    .map((t) => t.slot);

  const upcomingAwaySlots = timedAway
    .filter((t) => t.startMinutes > currentTimeMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map((t) => t.slot);

  return {
    activeAwaySlots,
    upcomingAwaySlots,
    allAwaySlots: awaySlots,
  };
}
