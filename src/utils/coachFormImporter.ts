import { Coach, CoachAvailability, CoachAvailabilityStatus } from '../types';

/**
 * Parses raw TSV/CSV from Google Forms response sheet and merges with existing coach availability
 */
export function importGoogleFormResponses(
  rawText: string,
  targetDate: string,
  existingAvailability: CoachAvailability[],
  coaches: Coach[]
): CoachAvailability[] {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  const imported: CoachAvailability[] = [];

  for (const line of lines) {
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length < 2) continue;

    const firstCol = parts[0].toLowerCase();
    if (firstCol.includes('timestamp') || firstCol.includes('date') || firstCol.includes('name')) {
      continue;
    }

    let coachName = '';
    let rawStatus = '';
    let notes = '';

    if (parts.length >= 3) {
      coachName = parts[1].replace(/["']/g, '').trim();
      rawStatus = parts[2].replace(/["']/g, '').trim();
      notes = parts[3] ? parts.slice(3).join(', ').replace(/["']/g, '').trim() : '';
    } else {
      coachName = parts[0].replace(/["']/g, '').trim();
      rawStatus = parts[1].replace(/["']/g, '').trim();
    }

    if (!coachName) continue;

    const matchedCoach = coaches.find(
      (c) =>
        c.name.toLowerCase().includes(coachName.toLowerCase()) ||
        coachName.toLowerCase().includes(c.name.toLowerCase())
    );

    let status: CoachAvailabilityStatus = 'AVAILABLE';
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes('away') || sLower.includes('no') || sLower.includes('unavail')) {
      status = 'AWAY';
    } else if (sLower.includes('match') || sLower.includes('senior') || sLower.includes('eyhl') || sLower.includes('league')) {
      status = 'SENIOR_MATCH';
    } else if (sLower.includes('morning') || sLower.includes('partial') || sLower.includes('early')) {
      status = 'MORNING_ONLY';
    }

    const record: CoachAvailability = {
      id: `form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      coachId: matchedCoach?.id || `coach-guest-${Date.now()}`,
      coachName: matchedCoach?.name || coachName,
      date: targetDate,
      status,
      notes: notes || (matchedCoach ? undefined : 'New coach registered via form'),
      source: 'google_form',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    imported.push(record);
  }

  const merged = [...existingAvailability];
  for (const imp of imported) {
    const idx = merged.findIndex((m) => m.coachId === imp.coachId && m.date === imp.date);
    if (idx >= 0) {
      merged[idx] = imp;
    } else {
      merged.push(imp);
    }
  }

  return merged;
}
