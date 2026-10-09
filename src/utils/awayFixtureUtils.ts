import { Coach, MatchFixture, SessionSlot } from '../types';
import {
  calculateMeetTime,
  normalizeAgeGroup,
  normalizeTime,
  resolveVenueName,
} from './scheduleImportParser';
import { addMinutesToTime } from './timeUtils';

/**
 * Checks if a session is an off-site away fixture.
 * Detects both explicitly flagged slots and imported/historical slots containing
 * away venue keywords or match-against-external-venue syntax.
 */
export function isAwaySession(slot: Partial<SessionSlot>): boolean {
  if (slot.isAway === true) return true;
  if (slot.pitchSectorId === 'away') return true;

  // Check venueName if present
  if (slot.venueName) {
    const vn = slot.venueName.toLowerCase();
    if (
      !vn.includes('milltown') &&
      !vn.includes('home') &&
      !vn.includes('pitch 1') &&
      !vn.includes('pitch 2') &&
      !vn.includes('water') &&
      !vn.includes('sand')
    ) {
      return true;
    }
  }

  // Check title
  const title = (slot.sessionTitle || '').toLowerCase();
  if (
    /\bin (wesley|mt temple|mount temple|drogheda|loreto|st gerard|bray|dalkey|ymca|railway|monkstown)\b/i.test(title) ||
    /\b(away|vs .* in |v .* in )\b/i.test(title)
  ) {
    return true;
  }

  // Check notes
  const notes = (slot.coachNotes || '').toLowerCase();
  if (
    /\bvenue:\s*(wesley|mt temple|mount temple|drogheda|loreto|st gerard|bray|dalkey|ymca|railway|monkstown|away)/i.test(notes)
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts opposition name from title or notes if available
 */
export function extractOpposition(text: string): string | undefined {
  if (/ v /i.test(text)) {
    const opp = text.split(/ v /i)[1]?.trim();
    return opp ? opp.split(/ in /i)[0]?.trim() : undefined;
  }
  if (/ vs /i.test(text)) {
    const opp = text.split(/ vs /i)[1]?.trim();
    return opp ? opp.split(/ in /i)[0]?.trim() : undefined;
  }
  return undefined;
}

/**
 * Normalizes any session slot. If it is an away match, ensures isAway is true,
 * pitchSectorId is 'away', venueName is resolved, opposition is extracted,
 * and meetTime is calculated (45 mins prior to pushback).
 */
export function normalizeAwaySlot(slot: SessionSlot): SessionSlot {
  if (!isAwaySession(slot)) {
    return slot;
  }

  const titleAndNotes = `${slot.sessionTitle || ''} ${slot.coachNotes || ''}`;
  const venue = slot.venueName || resolveVenueName(titleAndNotes, false);
  const opposition = slot.opposition || extractOpposition(slot.sessionTitle) || extractOpposition(slot.coachNotes || '');
  
  const startTime = slot.startTime || (slot.timeSlot ? slot.timeSlot.split('–')[0].split('-')[0].trim() : '10:00');
  const meetTime = slot.meetTime || calculateMeetTime(startTime, 45);

  return {
    ...slot,
    isAway: true,
    pitchSectorId: 'away',
    venueName: venue,
    opposition,
    meetTime,
  };
}

/**
 * Converts a MatchFixture into an off-site away SessionSlot for the Sunday timetable.
 */
export function convertFixtureToAwaySlot(
  fixture: MatchFixture,
  coaches: Coach[] = []
): SessionSlot {
  const startTime =
    fixture.pushbackTime && /^\d{1,2}[:.]\d{2}/.test(fixture.pushbackTime)
      ? normalizeTime(fixture.pushbackTime)
      : '10:00';
  const endTime = addMinutesToTime(startTime, 75);
  const timeSlot = `${startTime}–${endTime}`;
  const meetTime = calculateMeetTime(startTime, 45);

  let ageGroupId = fixture.trainingGroup;
  let pathway = fixture.trainingGroup ? normalizeAgeGroup(fixture.trainingGroup).pathway : undefined;
  if (!ageGroupId || !pathway) {
    const norm = normalizeAgeGroup(fixture.ageGroupOrTeam || fixture.rankedTeam || '');
    ageGroupId = norm.ageGroup;
    pathway = norm.pathway;
  }

  // Coach assignment lookup
  const assignedCoachIds: string[] = [];
  if (fixture.leadCoachOrManager && coaches.length > 0) {
    const leadNorm = fixture.leadCoachOrManager.trim().toLowerCase();
    const matchedCoach = coaches.find((c) => {
      const cn = c.name.toLowerCase().trim();
      return cn === leadNorm || cn.includes(leadNorm) || leadNorm.includes(cn);
    });
    if (matchedCoach) {
      assignedCoachIds.push(matchedCoach.id);
    }
  }

  const teamDisplay = fixture.rankedTeam || fixture.ageGroupOrTeam || `${ageGroupId} Squad`;
  const sessionTitle = `${teamDisplay} (AWAY vs ${fixture.opposition || 'Opponent'})`;
  const resolvedVenue = fixture.venue || 'Away Ground';
  const sessionPurpose = `Leinster League Away Fixture vs ${fixture.opposition || 'Opponent'} at ${resolvedVenue}.${
    fixture.round ? ` Round: ${fixture.round}.` : ''
  } Meet at ${meetTime} (45m prior to pushback).`;

  const coachNotes = [
    fixture.leadCoachOrManager ? `Match Lead: ${fixture.leadCoachOrManager}` : '',
    fixture.umpires && fixture.umpires.length > 0 ? `Umpires: ${fixture.umpires.join(', ')}` : '',
    fixture.notes ? `Notes: ${fixture.notes}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const transportNotes = `Direct travel to ${resolvedVenue}. Squad meet at ${meetTime} (45m prior to ${startTime} pushback).`;

  return {
    id: `slot-away-fixture-${fixture.id}`,
    date: fixture.date,
    timeSlot,
    startTime,
    endTime,
    pitchSectorId: 'away',
    ageGroupId,
    pathway,
    assignedCoachIds,
    sessionTitle,
    sessionPurpose,
    coachNotes,
    attachedDrillIds: [],
    equipmentChecklist: [
      { item: 'Travelling Squad Match Ball Bag (18 balls)', checked: true },
      { item: 'Away Kit / Alternate White Socks & Tops', checked: true },
      { item: 'Portable Pitch First Aid Kit & Cold Packs', checked: true },
      { item: 'Captain Armband & Match Card / Pen', checked: true },
    ],
    status: assignedCoachIds.length > 0 ? 'Ready' : 'Needs Coach',
    isAway: true,
    venueName: resolvedVenue,
    opposition: fixture.opposition,
    meetTime,
    fixtureId: fixture.id,
    transportNotes,
  };
}

export interface SyncAwaySlotsResult {
  updatedSlots: SessionSlot[];
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
}

/**
 * Projects away MatchFixtures into SessionSlots, respecting existing user edits and avoiding duplicate collisions.
 */
export function syncAwayFixturesToSlots(
  existingSlots: SessionSlot[],
  fixtures: MatchFixture[],
  coaches: Coach[] = [],
  options?: {
    targetDate?: string;
    fixtureIds?: string[];
  }
): SyncAwaySlotsResult {
  let createdCount = 0;
  let updatedCount = 0;

  const candidateFixtures = fixtures.filter((f) => {
    // Only process off-site away fixtures
    if (f.isHome && f.pitchSectorId !== 'away' && !isAwaySession({ venueName: f.venue })) {
      return false;
    }
    if (options?.targetDate && f.date !== options.targetDate) {
      return false;
    }
    if (options?.fixtureIds && !options.fixtureIds.includes(f.id)) {
      return false;
    }
    return true;
  });

  const nextSlots = [...existingSlots];

  for (const fixture of candidateFixtures) {
    const existingSlotIndex = nextSlots.findIndex((slot) => {
      if (slot.fixtureId && slot.fixtureId === fixture.id) return true;
      if (
        slot.date === fixture.date &&
        (slot.isAway || slot.pitchSectorId === 'away') &&
        slot.opposition &&
        fixture.opposition &&
        slot.opposition.toLowerCase().trim() === fixture.opposition.toLowerCase().trim()
      ) {
        return true;
      }
      return false;
    });

    const generated = convertFixtureToAwaySlot(fixture, coaches);

    if (existingSlotIndex !== -1) {
      const current = nextSlots[existingSlotIndex];
      // Retain custom drills and user assigned coaches if already set
      nextSlots[existingSlotIndex] = normalizeAwaySlot({
        ...current,
        date: generated.date,
        startTime: generated.startTime,
        endTime: generated.endTime,
        timeSlot: generated.timeSlot,
        venueName: generated.venueName,
        opposition: generated.opposition,
        meetTime: generated.meetTime,
        fixtureId: fixture.id,
        sessionTitle: generated.sessionTitle,
        sessionPurpose: generated.sessionPurpose,
        transportNotes: generated.transportNotes,
        coachNotes: current.coachNotes || generated.coachNotes,
        assignedCoachIds:
          current.assignedCoachIds.length > 0 ? current.assignedCoachIds : generated.assignedCoachIds,
        status:
          current.assignedCoachIds.length > 0 || generated.assignedCoachIds.length > 0
            ? 'Ready'
            : 'Needs Coach',
      });
      updatedCount++;
    } else {
      nextSlots.push(normalizeAwaySlot(generated));
      createdCount++;
    }
  }

  return {
    updatedSlots: nextSlots,
    createdCount,
    updatedCount,
    skippedCount: fixtures.length - candidateFixtures.length,
  };
}
