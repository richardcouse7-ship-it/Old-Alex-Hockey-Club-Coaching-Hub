import { AgeGroup, Coach, MatchFixture, Pathway, PitchSector, SessionSlot } from '../types';

export interface ParsedScheduleRow {
  rawTeam: string;
  ageGroupId: AgeGroup;
  pathway: Pathway;
  rawVenue: string;
  isMatch: boolean;
  opposition?: string;
  isHome: boolean;
  assignedCoachNames: string[];
  startTime: string;
  endTime: string;
  timeSlot: string;
  durationMins: number;
  pitchSectorId: string;
  sessionTitle: string;
  notes: string;
  date?: string;
}

export interface ParseScheduleResult {
  rows: ParsedScheduleRow[];
  floats: {
    time: string;
    coachNames: string[];
  }[];
  newCoaches: Coach[];
  slots: SessionSlot[];
  fixtures: MatchFixture[];
  rawLineCount: number;
  parseErrors: string[];
  detectedDate?: string;
}

// Exact raw tab-separated text corresponding to Richard's weekly master sheet screenshot
export const SAMPLE_WEEKLY_SPREADSHEET_TEXT = `Date	Match/Team	Venue/Location	Assigned	Assigned Umpire/Coach	Assigned	Assigned	Assig	Assigned	Start Time	End Time	Total
4/10/2026	Inter A	Match V YMCA in Wesley	Richard Couse						13:30	15:30	
4/10/2026	Inter B	Match V Pembroke (water)	Richard Couse	Nicola Wildish					10:15	12:00	
4/10/2026	Inter C	Match V Clontarf in Mt Temple	Katie Mullan	Ref Provided					13:45	15:30	
4/10/2026	Inter D	Match V Boyne in Drogheda Gramm	Matt Salisbury	Ref Provided					10:30	12:15	
4/10/2026	Inter E								13:30	15:00	
								
4/10/2026	Minor	Training	Ben McInerney	Conor Ryan	Una Kelly				14:30	15:15	
								
4/10/2026	1st Year A	Match V Dalkey	Josh Gill	Ben McInerney					10:30	12:00	
4/10/2026	1st Year B	Training	Josh Gill	Jennifer Casey					14:00	15:15	
4/10/2026	1st Year C	Match V Bray (sand)	Daisy Dillon Mansfield	Violet O'Neill					12:45	14:15	
4/10/2026	1st Year D	Match V Loreto (sand)	Daisy Dillon Mansfield	Violet O'Neill					10:30	12:00	
								
4/10/2026	6th Class	Training	Ben McInerney	Katie Mullan	Jeremy Erwin	Vivian Kelly			13:00	14:15	
								
4/10/2026	5th Class	Training	John Walsh	Hannah Fox	Nicola Wildish	Meabh Russell			13:00	14:15	
								
4/10/2026	4th Class	Training	Josh Gill	Daisy Dillon Mansfield	Emilie Galvin	Caoimhe Hardy			12:00	13:00	
4/10/2026	3rd Class	Training	Meabh Russell	Hannah Fox	Brooke Ellis	Bo Hartley			12:00	13:00	
4/10/2026	2nd Class	Training	Ben McInerney	Violet O'Neill	Nicola Wildish	Carmen Meta			12:00	13:00	
4/10/2026	1st Class	Training	Megan Marshall	Emma Garry	Emilie Galvin				12:00	13:00	
								
4/10/2026	Pen	Training	Barbara Luke	Sarah O'Kelly	Niamh O'Neill				12:00	13:00	
								
	12 o'clock Floaters	Lauren Walsh						
		Iris Fowler						
		Eve O'Donnell						`;

// Map raw team names to AgeGroup
export function normalizeAgeGroup(raw: string): { ageGroup: AgeGroup; pathway: Pathway } {
  const clean = raw.trim().toLowerCase();

  if (clean.includes('inter')) {
    return { ageGroup: 'Inters', pathway: 'Youth Performance' };
  }
  if (clean.includes('minor')) {
    return { ageGroup: 'Minors', pathway: 'Youth Performance' };
  }
  if (clean.includes('1st year') || clean.includes('first year')) {
    return { ageGroup: '1st Years', pathway: 'Youth Performance' };
  }
  if (clean.includes('6th')) {
    return { ageGroup: '6th Class', pathway: 'Development' };
  }
  if (clean.includes('5th')) {
    return { ageGroup: '5th Class', pathway: 'Development' };
  }
  if (clean.includes('4th')) {
    return { ageGroup: '4th Class', pathway: 'Development' };
  }
  if (clean.includes('3rd')) {
    return { ageGroup: '3rd Class', pathway: 'Development' };
  }
  if (clean.includes('2nd')) {
    return { ageGroup: '2nd Class', pathway: 'Foundation' };
  }
  if (clean.includes('1st class') || clean.includes('first class')) {
    return { ageGroup: '1st Class', pathway: 'Foundation' };
  }
  if (clean.includes('pen') || clean.includes('prep') || clean.includes('peri')) {
    return { ageGroup: 'PEN', pathway: 'Foundation' };
  }

  // Default fallback
  return { ageGroup: '1st Class', pathway: 'Foundation' };
}

// Parse date string like "4/10/2026" or "04/10/2026" or "2026-10-04" to ISO "YYYY-MM-DD"
export function parseDateStringToISO(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year.toString()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  return null;
}

// Normalize time strings like "9:30" -> "09:30", "13:45" -> "13:45"
export function normalizeTime(raw: string): string {
  if (!raw) return '10:00';
  const clean = raw.trim().replace('.', ':');
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const mins = match[2];
    return `${hours}:${mins}`;
  }
  return clean;
}

// Convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Filter non-coach names (e.g. "Ref Provided", "TBD", numbers, etc.)
export function isIgnoredCoachName(name: string): boolean {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  if (
    lower.length < 2 ||
    lower.includes('ref provided') ||
    lower.includes('referee provided') ||
    lower.includes('umpire provided') ||
    lower === 'ref' ||
    lower === 'referee' ||
    lower === 'umpire' ||
    lower === 'tbd' ||
    lower === 'tbc' ||
    lower === 'tba' ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === '-' ||
    /^\d+[:.]\d+$/.test(lower) ||
    /^\d+$/.test(lower) ||
    lower.startsWith('total')
  ) {
    return true;
  }
  return false;
}

// Clean coach name string
export function cleanCoachName(name: string): string {
  let cleaned = name.trim().replace(/^['"\s]+|['"\s]+$/g, '');
  cleaned = cleaned.replace(/[.…]+$/, '').trim();
  return cleaned;
}

// Palette of colors for new auto-created coaches
const COACH_ACCENT_COLORS = [
  '#dc2626', // red
  '#2563eb', // blue
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#db2777', // pink
  '#d97706', // amber
  '#4f46e5', // indigo
  '#059669', // emerald
  '#7c3aed', // violet
];

// Generate initials from full name
export function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Calculate meet time (default 45 mins before pushback)
export function calculateMeetTime(startTime: string, minutesBefore: number = 45): string {
  const startMins = timeToMinutes(startTime);
  const meetMins = Math.max(0, startMins - minutesBefore);
  const h = Math.floor(meetMins / 60).toString().padStart(2, '0');
  const m = (meetMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Clean and standardize venue names
export function resolveVenueName(rawVenue: string, isHome: boolean): string {
  if (isHome) {
    if (/sand/i.test(rawVenue)) return 'Milltown Sand Pitch';
    if (/water/i.test(rawVenue)) return 'Milltown Water Pitch';
    return 'Milltown Pitch 1 (Main Astro)';
  }
  if (/wesley/i.test(rawVenue)) return 'Wesley College';
  if (/mt temple/i.test(rawVenue) || /mount temple/i.test(rawVenue)) return 'Mount Temple School';
  if (/drogheda/i.test(rawVenue)) return 'Drogheda Grammar School';
  if (/st gerard/i.test(rawVenue)) return "St Gerard's School";
  if (/loreto/i.test(rawVenue)) return 'Loreto Secondary School';
  if (/bray/i.test(rawVenue)) return 'Bray Hockey Club';
  if (/dalkey/i.test(rawVenue)) return 'Loreto Dalkey';
  if (/ymca/i.test(rawVenue)) return 'YMCA Claremont Road';
  if (/monkstown/i.test(rawVenue)) return 'Monkstown HC';
  if (/railway/i.test(rawVenue)) return 'Railway Union HC';

  const inMatch = rawVenue.match(/\bin\s+([^,()]+)/i);
  if (inMatch) return inMatch[1].trim();
  return rawVenue.trim() || 'Away Ground';
}

/**
 * Main Schedule Importer Parser
 */
export function parseSpreadsheetSchedule(
  rawInput: string,
  existingCoaches: Coach[],
  defaultTargetDate: string
): ParseScheduleResult {
  const lines = rawInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedRows: ParsedScheduleRow[] = [];
  const floats: { time: string; coachNames: string[] }[] = [];
  const parseErrors: string[] = [];
  let detectedDate: string | undefined = undefined;

  // Track all coaches including newly discovered ones
  const coachMap = new Map<string, Coach>();
  existingCoaches.forEach((c) => {
    coachMap.set(c.name.toLowerCase().trim(), c);
  });

  const newlyDiscoveredCoaches: Coach[] = [];
  let colorIdx = existingCoaches.length % COACH_ACCENT_COLORS.length;

  const resolveOrCreateCoach = (rawName: string): Coach => {
    const cleaned = cleanCoachName(rawName);
    const normalized = cleaned.toLowerCase();

    // Direct match
    if (coachMap.has(normalized)) {
      return coachMap.get(normalized)!;
    }

    // Prefix / abbreviation match against existing coaches (e.g. "Daisy Dillon M..." -> "Daisy Dillon Mansfield")
    for (const [existingNorm, coach] of coachMap.entries()) {
      if (
        (normalized.length >= 6 && existingNorm.startsWith(normalized)) ||
        (existingNorm.length >= 6 && normalized.startsWith(existingNorm))
      ) {
        return coach;
      }
    }

    // Known club coaching names mapping
    let resolvedName = cleaned;
    if (/^daisy dillon/i.test(cleaned)) {
      resolvedName = 'Daisy Dillon Mansfield';
    } else if (/^carmen[- ]?meta/i.test(cleaned)) {
      resolvedName = 'Carmen Meta';
    } else if (/^hannah fox/i.test(cleaned)) {
      resolvedName = 'Hannah Fox';
    }

    const resolvedNorm = resolvedName.toLowerCase();
    if (coachMap.has(resolvedNorm)) {
      return coachMap.get(resolvedNorm)!;
    }

    // Auto-create new coach
    const initials = getInitials(resolvedName);
    const slug = resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCoach: Coach = {
      id: `coach-${slug}-${Date.now().toString(36)}`,
      name: resolvedName,
      role: resolvedName.toLowerCase().startsWith('parent')
        ? 'Parent Volunteer / Coach'
        : 'Youth Coach / Umpire',
      phone: '+353 87 000 0000',
      email: `${slug.replace(/-/g, '.')}@oldalex.ie`,
      accentColor: COACH_ACCENT_COLORS[colorIdx % COACH_ACCENT_COLORS.length],
      initials,
      isActive: true,
    };
    colorIdx++;
    coachMap.set(resolvedNorm, newCoach);
    newlyDiscoveredCoaches.push(newCoach);
    return newCoach;
  };

  // Determine delimiter: tab vs comma vs semicolon
  const delimiter = rawInput.includes('\t') ? '\t' : rawInput.includes(',') ? ',' : ';';

  // Dynamic column indexes
  let dateCol = -1;
  let teamCol = -1;
  let venueCol = -1;
  let startTimeCol = -1;
  let endTimeCol = -1;
  let hasInspectedHeaders = false;

  // Floaters capture state
  let inFloatSection = false;
  let currentFloatTime = '12:00';
  const floatCoaches: string[] = [];

  // Sector alternation tracker for simultaneous sessions
  const simultaneousCountMap: Record<string, number> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split(delimiter).map((c) => c.trim());
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    const lowerCells = cells.map((c) => c.toLowerCase());

    // 1. Check if line is a header row
    const isHeaderRow = lowerCells.some(
      (c) =>
        c === 'match/team' ||
        c === 'team' ||
        c === 'venue/location' ||
        c === 'assigned' ||
        c === 'start time'
    );

    if (isHeaderRow && !hasInspectedHeaders) {
      hasInspectedHeaders = true;
      dateCol = lowerCells.findIndex((c) => c.includes('date'));
      teamCol = lowerCells.findIndex((c) => c.includes('team') || c.includes('match/team'));
      venueCol = lowerCells.findIndex((c) => c.includes('venue') || c.includes('location'));
      startTimeCol = lowerCells.findIndex((c) => c.includes('start'));
      endTimeCol = lowerCells.findIndex((c) => c.includes('end'));
      continue;
    }

    // 2. Check for Floater section header (e.g. "12 o'clock Floaters" or "Floats")
    const floatCell = cells.find((c) => c.toLowerCase().includes('float'));
    if (floatCell) {
      inFloatSection = true;
      const floatTimeMatch = floatCell.match(/(\d{1,2})/);
      currentFloatTime = floatTimeMatch ? `${floatTimeMatch[1]}:00` : '12:00';

      // Check remaining cells on this float header line
      for (const cell of cells) {
        if (cell !== floatCell && cell && !isIgnoredCoachName(cell)) {
          const coachName = cleanCoachName(cell);
          if (coachName.length > 2 && !coachName.toLowerCase().includes('float')) {
            floatCoaches.push(coachName);
            resolveOrCreateCoach(coachName);
          }
        }
      }
      continue;
    }

    // 3. If in float section, subsequent rows without teams/times are floaters
    if (inFloatSection) {
      const rowHasTimes = cells.some((c) => /^\d{1,2}[:.]\d{2}$/.test(c));
      if (!rowHasTimes) {
        for (const cell of cells) {
          if (cell && !isIgnoredCoachName(cell)) {
            const coachName = cleanCoachName(cell);
            if (coachName.length > 2 && !coachName.toLowerCase().includes('float')) {
              floatCoaches.push(coachName);
              resolveOrCreateCoach(coachName);
            }
          }
        }
        continue;
      } else {
        // Exit float section if a regular row is encountered
        inFloatSection = false;
      }
    }

    // 4. Resolve column indexes if no header row was present
    if (dateCol === -1 && teamCol === -1) {
      const firstCellDate = parseDateStringToISO(cells[0]);
      if (firstCellDate) {
        dateCol = 0;
        teamCol = 1;
        venueCol = 2;
      } else {
        teamCol = 0;
        venueCol = 1;
      }
    }

    // Extract Date if present
    if (dateCol !== -1 && cells[dateCol]) {
      const parsedDate = parseDateStringToISO(cells[dateCol]);
      if (parsedDate && !detectedDate) {
        detectedDate = parsedDate;
      }
    }

    // Extract Team
    const actualTeamCol = teamCol !== -1 ? teamCol : 0;
    const rawTeam = cells[actualTeamCol]?.trim();
    if (!rawTeam || rawTeam.length < 2) continue;

    // Skip if team cell is a header leftover
    if (rawTeam.toLowerCase() === 'match/team' || rawTeam.toLowerCase() === 'team') continue;

    // Extract Venue / Location
    const actualVenueCol = venueCol !== -1 ? venueCol : actualTeamCol + 1;
    const rawVenue = cells[actualVenueCol]?.trim() || 'Home Training';

    // Scan for times
    let detectedStartTime = '';
    let detectedEndTime = '';

    if (
      startTimeCol !== -1 &&
      endTimeCol !== -1 &&
      cells[startTimeCol] &&
      cells[endTimeCol] &&
      /^\d{1,2}[:.]\d{2}$/.test(cells[startTimeCol]) &&
      /^\d{1,2}[:.]\d{2}$/.test(cells[endTimeCol])
    ) {
      detectedStartTime = normalizeTime(cells[startTimeCol]);
      detectedEndTime = normalizeTime(cells[endTimeCol]);
    } else {
      const timeMatches: { text: string; colIdx: number }[] = [];
      cells.forEach((val, idx) => {
        const trimmed = val.trim();
        if (/^\d{1,2}[:.]\d{2}$/.test(trimmed)) {
          timeMatches.push({ text: normalizeTime(trimmed), colIdx: idx });
        }
      });

      if (timeMatches.length >= 2) {
        detectedStartTime = timeMatches[0].text;
        detectedEndTime = timeMatches[1].text;
      } else if (timeMatches.length === 1) {
        detectedStartTime = timeMatches[0].text;
        const startMins = timeToMinutes(detectedStartTime);
        const endMins = startMins + 75;
        const endH = Math.floor(endMins / 60)
          .toString()
          .padStart(2, '0');
        const endM = (endMins % 60).toString().padStart(2, '0');
        detectedEndTime = `${endH}:${endM}`;
      } else {
        detectedStartTime = '10:00';
        detectedEndTime = '11:15';
      }
    }

    if (detectedStartTime === detectedEndTime) {
      const startMins = timeToMinutes(detectedStartTime);
      const endMins = startMins + 75;
      const endH = Math.floor(endMins / 60)
        .toString()
        .padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      detectedEndTime = `${endH}:${endM}`;
    }

    // Extract Assigned Coaches
    const assignedCoachNames: string[] = [];
    const coachStartCol = actualVenueCol + 1;
    const coachEndCol =
      startTimeCol !== -1 ? startTimeCol : cells.findIndex((c) => /^\d{1,2}[:.]\d{2}$/.test(c));

    const maxCol = coachEndCol !== -1 ? coachEndCol : cells.length;
    for (let c = coachStartCol; c < maxCol; c++) {
      const val = cells[c]?.trim();
      if (!val || isIgnoredCoachName(val)) continue;
      const cleaned = cleanCoachName(val);
      if (cleaned.length >= 2) {
        const coach = resolveOrCreateCoach(cleaned);
        assignedCoachNames.push(coach.name);
      }
    }

    // Age Group & Pathway
    const { ageGroup, pathway } = normalizeAgeGroup(rawTeam);

    // Is it a match?
    const isMatch =
      rawVenue.toLowerCase().includes('match') ||
      rawVenue.toLowerCase().includes('blitz') ||
      rawVenue.toLowerCase().includes(' v ') ||
      rawVenue.toLowerCase().includes(' vs ') ||
      rawTeam.toLowerCase().includes('match');

    const venueLower = rawVenue.toLowerCase();
    const isHome = !(
      venueLower.includes('away') ||
      venueLower.includes('in wesley') ||
      venueLower.includes('in mt temple') ||
      venueLower.includes('in drogheda') ||
      venueLower.includes('at ')
    );

    // Opposition extraction
    let opposition: string | undefined = undefined;
    if (/ v /i.test(rawVenue)) {
      opposition = rawVenue.split(/ v /i)[1]?.trim();
    } else if (/ vs /i.test(rawVenue)) {
      opposition = rawVenue.split(/ vs /i)[1]?.trim();
    } else if (venueLower.includes('monkstown')) {
      opposition = 'Monkstown HC';
    } else if (venueLower.includes('railway')) {
      opposition = 'Railway Union HC';
    }

    if (opposition && opposition.toLowerCase().includes(' in ')) {
      opposition = opposition.split(/ in /i)[0]?.trim();
    }
    // Determine Pitch Sector
    let pitchSectorId = 'p1n';

    if (!isHome) {
      pitchSectorId = 'away';
    } else if (venueLower.includes('sand')) {
      pitchSectorId = simultaneousCountMap['sand'] ? 'p2s' : 'p2n';
      simultaneousCountMap['sand'] = (simultaneousCountMap['sand'] || 0) + 1;
    } else if (venueLower.includes('water')) {
      pitchSectorId = 'p1n';
    } else if (venueLower.includes('cage') || rawTeam.toLowerCase().includes('pen')) {
      pitchSectorId = 'p3';
    } else {
      // For simultaneous sessions at the same time, distribute across pitch sectors:
      // P1N, P1S, P2N, P2S, P3
      const timeKey = `${detectedStartTime}-${detectedEndTime}`;
      const count = simultaneousCountMap[timeKey] || 0;
      simultaneousCountMap[timeKey] = count + 1;

      if (count % 5 === 0) pitchSectorId = 'p1n';
      else if (count % 5 === 1) pitchSectorId = 'p1s';
      else if (count % 5 === 2) pitchSectorId = 'p2n';
      else if (count % 5 === 3) pitchSectorId = 'p2s';
      else pitchSectorId = 'p3';
    }

    const durationMins = timeToMinutes(detectedEndTime) - timeToMinutes(detectedStartTime);
    const timeSlot = `${detectedStartTime}–${detectedEndTime}`;

    const venue = resolveVenueName(rawVenue, isHome);
    const sessionTitle = isMatch
      ? isHome
        ? `${rawTeam}: ${rawVenue}`
        : `${rawTeam} (AWAY vs ${opposition || 'Opponent'})`
      : `${rawTeam} Squad Training (${rawVenue})`;

    parsedRows.push({
      rawTeam,
      ageGroupId: ageGroup,
      pathway,
      rawVenue,
      isMatch,
      opposition,
      isHome,
      assignedCoachNames,
      startTime: detectedStartTime,
      endTime: detectedEndTime,
      timeSlot,
      durationMins: durationMins > 0 ? durationMins : 60,
      pitchSectorId,
      sessionTitle,
      notes: `Imported from weekly schedule sheet. Venue: ${venue}. Assigned: ${assignedCoachNames.join(', ')}`,
      date: detectedDate || defaultTargetDate,
    });
  }

  // Record Floaters
  if (floatCoaches.length > 0) {
    floats.push({
      time: currentFloatTime,
      coachNames: Array.from(new Set(floatCoaches)),
    });
  }

  const effectiveDate = detectedDate || defaultTargetDate;

  // Convert parsedRows to SessionSlot[]
  const slots: SessionSlot[] = parsedRows.map((row, idx) => {
    const coachIds = row.assignedCoachNames
      .map((name) => coachMap.get(name.toLowerCase().trim())?.id)
      .filter((id): id is string => Boolean(id));

    const resolvedVenue = resolveVenueName(row.rawVenue, row.isHome);
    const meetTime = !row.isHome ? calculateMeetTime(row.startTime, 45) : undefined;

    return {
      id: `slot-imported-${effectiveDate}-${idx + 1}-${Date.now().toString(36)}`,
      date: effectiveDate,
      timeSlot: row.timeSlot,
      startTime: row.startTime,
      endTime: row.endTime,
      pitchSectorId: row.pitchSectorId,
      ageGroupId: row.ageGroupId,
      pathway: row.pathway,
      assignedCoachIds: coachIds,
      sessionTitle: row.sessionTitle,
      isAway: !row.isHome,
      venueName: resolvedVenue,
      opposition: row.opposition,
      meetTime,
      sessionPurpose: !row.isHome
        ? `Competitive Away Leinster fixture vs ${row.opposition || 'Opponent'} at ${resolvedVenue}. Meet at ${meetTime} (45m prior to pushback).`
        : row.isMatch
        ? `Competitive fixture: ${row.rawVenue}. Focus on structure and execution.`
        : `Technical & tactical curriculum session for ${row.rawTeam}.`,
      coachNotes: row.notes,
      attachedDrillIds: [],
      equipmentChecklist: !row.isHome
        ? [
            { item: 'Travelling Squad Match Ball Bag (18 balls)', checked: true },
            { item: 'Away Kit / Alternate White Socks & Tops', checked: true },
            { item: 'Portable Pitch First Aid Kit & Cold Packs', checked: true },
            { item: 'Captain Armband & Match Card / Pen', checked: true },
          ]
        : [
            { item: 'Match / Training Hockey Balls (Bag of 24)', checked: true },
            { item: 'Cones & Agility Markers (16 minimum)', checked: true },
            { item: 'Bibs (2 contrasting colours)', checked: true },
            { item: 'Pitch First Aid Kit & Ice Pack', checked: true },
          ],
      status: coachIds.length > 0 ? 'Ready' : 'Needs Coach',
      transportNotes: !row.isHome
        ? `Direct travel to ${resolvedVenue}. Squad to assemble 45 minutes prior to ${row.startTime} pushback.`
        : undefined,
    };
  });

  // Convert match rows to MatchFixture[]
  const fixtures: MatchFixture[] = parsedRows
    .filter((row) => row.isMatch)
    .map((row, idx) => {
      const umpires = row.assignedCoachNames.slice(1);
      const leadCoach = row.assignedCoachNames[0] || 'Richard Couse';
      const venue = resolveVenueName(row.rawVenue, row.isHome);

      return {
        id: `fixture-imported-${effectiveDate}-${idx + 1}-${Date.now().toString(36)}`,
        date: effectiveDate,
        pushbackTime: row.startTime,
        ageGroupOrTeam: row.rawTeam,
        competition: row.rawVenue.toLowerCase().includes('blitz')
          ? 'Friendly Blitz'
          : 'Leinster League',
        opposition: row.opposition || 'Opposition TBD',
        isHome: row.isHome,
        venue,
        pitchSectorId: row.pitchSectorId,
        leadCoachOrManager: leadCoach,
        umpires: umpires.length > 0 ? umpires : [leadCoach],
        notes: `Imported weekly fixture. ${row.notes}`,
        status: 'Scheduled',
      };
    });

  return {
    rows: parsedRows,
    floats,
    newCoaches: newlyDiscoveredCoaches,
    slots,
    fixtures,
    rawLineCount: lines.length,
    parseErrors,
    detectedDate,
  };
}
