import { SessionSlot, AgeGroup } from '../types';

export interface SeasonPhase {
  phaseName: string;
  phaseNumber: number;
  focus: string;
  checkpoint: string;
}

export interface PriorSessionReflectionResult {
  priorDate: string;
  reflection: NonNullable<SessionSlot['postSessionReflection']>;
}

export interface DebriefHealthGroup {
  ageGroupId: AgeGroup | string;
  status: 'completed' | 'pending';
  slotId: string;
}

export interface DebriefHealthSummary {
  completedCount: number;
  pendingCount: number;
  totalCount: number;
  groups: DebriefHealthGroup[];
}

/**
 * Maps date to season macro phases:
 * - Sept–Oct (months 9–10): Phase 1 "Connect & Assess" (Focus: Standards, baseline stick skills, summer reboot).
 * - Nov–Dec (months 11–12): Phase 2 "Build the Toolkit" (Focus: 2v1 overloads, 3D aerial lifts, team pressing).
 * - Jan–Mar (months 1–3): Phase 3 "Connect the Game" (Focus: Pitch structure, 16m build-outs, PC battery, transitions).
 * - Apr–May (months 4–5): Phase 4 "Competition Polish" (Focus: Tournament execution, blitz scenarios, execution under pressure).
 * - Summer fallback: Pre-season preparation.
 */
export function getSeasonPhaseForDate(dateString: string): SeasonPhase {
  if (!dateString) {
    return {
      phaseName: 'Pre-Season Preparation',
      phaseNumber: 0,
      focus: 'Pre-season conditioning, coach alignment, and curriculum review.',
      checkpoint: 'Summer reboot and player registrations.',
    };
  }

  // Parse month defensively (dateString format: YYYY-MM-DD or standard parseable string)
  let month = 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const parts = dateString.split('-');
    month = parseInt(parts[1], 10);
  } else {
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      month = parsedDate.getMonth() + 1;
    }
  }

  if (month === 9 || month === 10) {
    return {
      phaseName: 'Connect & Assess',
      phaseNumber: 1,
      focus: 'Standards, baseline stick skills, summer reboot',
      checkpoint: 'Baseline core skills & small-sided game assessment',
    };
  }

  if (month === 11 || month === 12) {
    return {
      phaseName: 'Build the Toolkit',
      phaseNumber: 2,
      focus: '2v1 overloads, 3D aerial lifts, team pressing',
      checkpoint: 'Mid-season skill benchmarks & pressing coordination',
    };
  }

  if (month >= 1 && month <= 3) {
    return {
      phaseName: 'Connect the Game',
      phaseNumber: 3,
      focus: 'Pitch structure, 16m build-outs, PC battery, transitions',
      checkpoint: 'Full pitch tactical transitions & penalty corner execution',
    };
  }

  if (month === 4 || month === 5) {
    return {
      phaseName: 'Competition Polish',
      phaseNumber: 4,
      focus: 'Tournament execution, blitz scenarios, execution under pressure',
      checkpoint: 'End-of-season blitz mastery & tournament finals readiness',
    };
  }

  return {
    phaseName: 'Pre-Season Preparation',
    phaseNumber: 0,
    focus: 'Pre-season conditioning, coach alignment, and curriculum review',
    checkpoint: 'Summer reboot and squad allocations',
  };
}

/**
 * Finds the most recent prior slot for the same ageGroupId where slot.date < currentSlot.date
 * and slot.postSessionReflection has at least one non-empty field (priorityForNextWeek, whatToChangeNextSunday, or whatWorked).
 * Returns { priorDate: string; reflection: PostSessionReflection } | null gracefully without throwing.
 */
export function getPreviousSessionReflection(
  slots: SessionSlot[] | undefined | null,
  currentSlot: SessionSlot | undefined | null
): PriorSessionReflectionResult | null {
  if (!slots || !currentSlot || !currentSlot.date || !currentSlot.ageGroupId) {
    return null;
  }

  try {
    const matchingSlots = slots.filter((s) => {
      if (s.id === currentSlot.id) return false;
      if (s.ageGroupId !== currentSlot.ageGroupId) return false;
      if (!s.date || s.date >= currentSlot.date) return false;

      const ref = s.postSessionReflection;
      if (!ref) return false;

      const hasPriority = Boolean(ref.priorityForNextWeek && ref.priorityForNextWeek.trim().length > 0);
      const hasChange = Boolean(ref.whatToChangeNextSunday && ref.whatToChangeNextSunday.trim().length > 0);
      const hasWorked = Boolean(ref.whatWorked && ref.whatWorked.trim().length > 0);

      return hasPriority || hasChange || hasWorked;
    });

    if (matchingSlots.length === 0) {
      return null;
    }

    // Sort descending by date to find the most recent prior session
    matchingSlots.sort((a, b) => b.date.localeCompare(a.date));

    const mostRecent = matchingSlots[0];
    return {
      priorDate: mostRecent.date,
      reflection: mostRecent.postSessionReflection!,
    };
  } catch {
    return null;
  }
}

/**
 * For a given Sunday date, aggregates all slots by age group and reports debrief compliance:
 * - completed: Slots with non-empty postSessionReflection.whatWorked or priorityForNextWeek.
 * - pending: Slots scheduled for that date without reflections.
 * Returns { completedCount: number; pendingCount: number; totalCount: number; groups: Array<{ ageGroupId: string; status: 'completed' | 'pending'; slotId: string }> }
 */
export function getDebriefHealthSummary(
  slots: SessionSlot[] | undefined | null,
  targetDate: string
): DebriefHealthSummary {
  if (!slots || !targetDate) {
    return {
      completedCount: 0,
      pendingCount: 0,
      totalCount: 0,
      groups: [],
    };
  }

  try {
    const dateSlots = slots.filter((s) => s.date === targetDate);

    // Track groups uniquely or per slot. If multiple slots exist for same age group on same date,
    // we process scheduled slots. To ensure robust UI representation, map each slot or group:
    const groups: DebriefHealthGroup[] = [];
    let completedCount = 0;
    let pendingCount = 0;

    for (const slot of dateSlots) {
      const ref = slot.postSessionReflection;
      const isCompleted = Boolean(
        ref &&
          ((ref.whatWorked && ref.whatWorked.trim().length > 0) ||
            (ref.priorityForNextWeek && ref.priorityForNextWeek.trim().length > 0))
      );

      if (isCompleted) {
        completedCount++;
        groups.push({
          ageGroupId: slot.ageGroupId,
          status: 'completed',
          slotId: slot.id,
        });
      } else {
        pendingCount++;
        groups.push({
          ageGroupId: slot.ageGroupId,
          status: 'pending',
          slotId: slot.id,
        });
      }
    }

    return {
      completedCount,
      pendingCount,
      totalCount: dateSlots.length,
      groups,
    };
  } catch {
    return {
      completedCount: 0,
      pendingCount: 0,
      totalCount: 0,
      groups: [],
    };
  }
}
