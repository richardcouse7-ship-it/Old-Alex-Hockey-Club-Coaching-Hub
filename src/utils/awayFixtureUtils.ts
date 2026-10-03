import { SessionSlot } from '../types';
import { calculateMeetTime, resolveVenueName } from './scheduleImportParser';

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
