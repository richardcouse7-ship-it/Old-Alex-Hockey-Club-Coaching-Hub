import { AgeGroup, Coach, MatchFixture, Pathway, PitchSector, SessionSlot } from '../types';

export interface ParsedScheduleRow {
  rawTeam: string;
  ageGroupId: AgeGroup;
  pathway: Pathway;
  rawVenue: string;
  isMatch: boolean;
  opposition?: string;
  competition?: string;
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

// Exact provisional schedule CSV format with Home/Away, Group, Activity, Venue, Time, Notes
export const SAMPLE_PROVISIONAL_CSV_TEXT = `Home/Away,Group,Activity/Opponent,Venue,Time,Notes
Home,Inter,Training (to be split Inter Mx to decide),Home,10:30am - 12:00pm,
Home,"PEN, 1st, 2nd, 3rd, 4th class",Training,Home,12:00pm - 1:00pm,
Home,5th class & 1st year,Training,Home,1:00pm - 2:15pm,
Home,Inter,Training (to be split Inter Mx to decide),Home,2:15pm - 3:45pm,Second inter training slot
Away,6th class A,v Pembroke (Div 1),Serpentine Ave,11:00am,
Away,6th class B,v Our Lady's (Div 3),Our Lady's school Terenure,2:00pm,
Away,6th class C,v Glenanne (Div 6),St Mark's,11:10am,Start time updated per follow-up emails
Away,Minor A,v Bray (Div 1),Temple Carrig,4:00pm,
Away,Minor B,v Railway (Div 3),Park Ave,11:00am,
Away,Minor C,v Loreto (Div 7),Loreto Beaufort,11:15am,BIBS and WHITE SOCKS`;

// Tab-separated text for Richard's weekly master sheet screenshots
export const SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT4 = `Date	Match/Team	Venue/Location	Assigned	Assigned Umpire/Coach	Assigned	Assigned	Assig	Assigned	Start Time	End Time	Total
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

export const SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT11 = `Date	Match/Team	Venue/Location	Assigned	Assigned Umpire/Coach	Assigned	Assigned	Assig Assigned	Start Time	End Time
11/10/2026	Inter	Training	Richard Couse	Grace MacAllister	Matt Salisbury			10:30	12:00
11/10/2026	Inter	Training	Richard Couse	Josh Gill				14:14	15:45
11/10/2026	Inter	Training	Violet O'Neill	Meabh Russell				14:15	15:30
11/10/2026	Minor A	Away V Bray Templecarrig	Ben McInerney	Conor Ryan	Anya Bowyers			15:00	17:00
11/10/2026	Minor B	Away V Railway Park Ave	Cara Coleman					10:15	12:00
11/10/2026	Minor C	Away V Loreto (Bibs & White Socks)	Una Kelly	Nicola Wildish				10:30	12:15
11/10/2026	1st Year	Training	Josh Gill	Jennifer Casey	Meabh Russell	Cara Coleman		13:00	14:15
11/10/2026	6th Class A	Away V Pembroke Serpentine Ave	Ben McInerney	Jeremy Erwin	One to umpire.			10:15	12:00
11/10/2026	6th Class B	Away V Our Ladys's Teneure	Katie Mullan	Natasha Nangle				10:40	12:10
11/10/2026	6th Class C	Away V Glennae St Marks School	Daisy Dillon M...	Carmen-meta Hayes				10:45	12:15
11/10/2026	5th Class	Training	John Walsh	Jessica Walsh	Violet O'Neill	Daisy Dillon Mal...		13:00	14:15
11/10/2026	4th Class	Training	Josh Gill	Richard Couse	Grace MacAllister			12:00	13:00
11/10/2026	3rd Class	Training	Joanna Lee	Cara Coleman	Eve Odonnell			12:00	13:00
11/10/2026	2nd Class	Training	Meabh Russell	Violet O'Neill	Grace McKenna			12:00	13:00
11/10/2026	1st Class	Training	Megan Marshall	Caoimhe Hardy	Emma Garry			12:00	13:00
11/10/2026	Pen	Training	Babs Richmond	Jessica Walsh	Brooke Ellis			12:00	13:00

	12 o'clock Floaters						`;

export const SAMPLE_WEEKLY_SPREADSHEET_TEXT = SAMPLE_WEEKLY_SPREADSHEET_TEXT_OCT11;

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

// Known single-name volunteer whitelist (e.g., club records)
export const KNOWN_SINGLE_NAME_COACHES = new Set(['anya', 'avril', 'ronan']);

/**
 * Strict Coach Person Name Validation
 * Rejects non-coach CSV cells such as venues, times, match strings, and notes.
 */
export function isValidCoachPersonName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();

  // Length must be between 3 and 32 characters
  if (trimmed.length < 3 || trimmed.length > 32) return false;

  // Contains time indicators: e.g. "2:00pm", "11:00 am", "10:30"
  if (/\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(trimmed)) return false;
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return false;

  // Contains match/division indicators: e.g. "v Glenanne", "vs Bray", "Div 6", "Div 1"
  if (/\bv\s+/i.test(trimmed)) return false;
  if (/\bvs\s+/i.test(trimmed)) return false;
  if (/\bdiv\s*\d+/i.test(trimmed)) return false;

  // Contains notes/venue keywords
  if (
    /\b(bibs|socks|email|emails|training|split|school|ave|road|college|pitch|updated|astro|terenure|terrenure|bray|loreto|glenanne|railway|pembroke|home|away|mark'?s?|temple|carri?g|beaufort|serpentine|ymca|dalkey|monkstown|park)\b/i.test(
      trimmed
    )
  ) {
    return false;
  }

  // Does not contain at least one space separating first and last name (unless in known single-name whitelist)
  const lower = trimmed.toLowerCase();
  const hasSpace = /\s+/.test(trimmed);
  if (!hasSpace && !KNOWN_SINGLE_NAME_COACHES.has(lower)) {
    return false;
  }

  return true;
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
    lower.includes('to umpire') ||
    lower.includes('one to umpire') ||
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

  if (!isValidCoachPersonName(name)) {
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

// Parse a single CSV or TSV line respecting quotes
export function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Convert 12h or 24h time string like "10:30am", "1:00pm", "14:15", "9:30" to "HH:mm"
export function parseTimeStringTo24H(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();

  const match = clean.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? match[2] : '00';
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm') {
    if (hours < 12) hours += 12;
  } else if (meridiem === 'am') {
    if (hours === 12) hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Parse range or single time like "10:30am - 12:00pm", "1:00pm - 2:15pm", "11:00am"
export function parseTimeField(raw: string): { startTime: string; endTime: string } {
  if (!raw) return { startTime: '10:00', endTime: '11:15' };

  const clean = raw.trim();
  const rangeMatch = clean.match(/^([^-–—to]+)\s*[-–—to]\s*([^-–—to]+)$/i);
  if (rangeMatch) {
    let startPart = rangeMatch[1].trim();
    let endPart = rangeMatch[2].trim();

    const endHasPm = /pm/i.test(endPart);
    const endHasAm = /am/i.test(endPart);
    const startHasMeridiem = /am|pm/i.test(startPart);

    if (!startHasMeridiem) {
      if (endHasPm) {
        const startH = parseInt(startPart, 10);
        if (startH >= 8 && startH < 12) {
          startPart += 'am';
        } else {
          startPart += 'pm';
        }
      } else if (endHasAm) {
        startPart += 'am';
      }
    }

    const parsedStart = parseTimeStringTo24H(startPart);
    const parsedEnd = parseTimeStringTo24H(endPart);

    if (parsedStart && parsedEnd) {
      return { startTime: parsedStart, endTime: parsedEnd };
    }
    if (parsedStart) {
      const sMins = timeToMinutes(parsedStart);
      const eMins = sMins + 75;
      const eh = Math.floor(eMins / 60).toString().padStart(2, '0');
      const em = (eMins % 60).toString().padStart(2, '0');
      return { startTime: parsedStart, endTime: `${eh}:${em}` };
    }
  }

  const parsedSingle = parseTimeStringTo24H(clean);
  if (parsedSingle) {
    const sMins = timeToMinutes(parsedSingle);
    const eMins = sMins + 75;
    const eh = Math.floor(eMins / 60).toString().padStart(2, '0');
    const em = (eMins % 60).toString().padStart(2, '0');
    return { startTime: parsedSingle, endTime: `${eh}:${em}` };
  }

  return { startTime: '10:00', endTime: '11:15' };
}

// Expand grouped squad names like "PEN, 1st, 2nd, 3rd, 4th class" or "5th class & 1st year"
export function expandTeamGroups(rawTeam: string): string[] {
  const lower = rawTeam.toLowerCase();
  const hasSeparators = rawTeam.includes(',') || rawTeam.includes('&') || /\band\b/i.test(rawTeam);

  if (!hasSeparators) {
    return [rawTeam.trim()];
  }

  const keywords = ['pen', 'prep', '1st', '2nd', '3rd', '4th', '5th', '6th', 'year', 'minor', 'inter'];
  const matchedCount = keywords.filter((k) => lower.includes(k)).length;

  if (matchedCount <= 1) {
    return [rawTeam.trim()];
  }

  const rawParts = rawTeam.split(/[,&]|\band\b/i).map((p) => p.trim()).filter(Boolean);
  const hasTrailingClass = lower.includes('class');
  const results: string[] = [];

  for (const part of rawParts) {
    let normalizedPart = part;
    if (hasTrailingClass && !/class|year|pen|prep|minor|inter/i.test(part)) {
      if (/^(1st|2nd|3rd|4th|5th|6th)$/i.test(part)) {
        normalizedPart = `${part} Class`;
      }
    }
    results.push(normalizedPart);
  }

  return results.length > 0 ? results : [rawTeam.trim()];
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
  if (/serpentine/i.test(rawVenue) || /pembroke/i.test(rawVenue)) return 'Pembroke HC (Serpentine Ave)';
  if (/our lady/i.test(rawVenue)) return "Our Lady's School Terenure";
  if (/st mark/i.test(rawVenue)) return "St Mark's (Glenanne)";
  if (/temple carrig/i.test(rawVenue)) return 'Temple Carrig (Bray)';
  if (/park ave/i.test(rawVenue) || /railway/i.test(rawVenue)) return 'Railway Union HC (Park Ave)';
  if (/loreto\s*beaufort/i.test(rawVenue)) return 'Loreto Beaufort';
  if (/wesley/i.test(rawVenue)) return 'Wesley College';
  if (/mt temple/i.test(rawVenue) || /mount temple/i.test(rawVenue)) return 'Mount Temple School';
  if (/drogheda/i.test(rawVenue)) return 'Drogheda Grammar School';
  if (/st gerard/i.test(rawVenue)) return "St Gerard's School";
  if (/loreto/i.test(rawVenue)) return 'Loreto Secondary School';
  if (/bray/i.test(rawVenue)) return 'Bray Hockey Club';
  if (/dalkey/i.test(rawVenue)) return 'Loreto Dalkey';
  if (/ymca/i.test(rawVenue)) return 'YMCA Claremont Road';
  if (/monkstown/i.test(rawVenue)) return 'Monkstown HC';

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
  // 1. BOM & Whitespace Stripping
  rawInput = rawInput.replace(/^\uFEFF/, '').trim();

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

  const resolveOrCreateCoach = (rawName: string): Coach | null => {
    const cleaned = cleanCoachName(rawName);
    if (!isValidCoachPersonName(cleaned)) {
      return null;
    }

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
    if (/^daisy dillon mansfield/i.test(cleaned)) {
      resolvedName = 'Daisy Dillon Mansfield';
    } else if (/^daisy dillon/i.test(cleaned)) {
      resolvedName = 'Daisy Dillon Malone';
    } else if (/^carmen[- ]?meta/i.test(cleaned)) {
      resolvedName = 'Carmen-meta Hayes';
    } else if (/^hannah fox/i.test(cleaned)) {
      resolvedName = 'Hannah Fox';
    } else if (/^anya bowyers/i.test(cleaned) || cleaned.toLowerCase() === 'anya') {
      resolvedName = 'Anya Bowyers';
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
  let homeAwayCol = -1;
  let teamCol = -1;
  let activityCol = -1;
  let venueCol = -1;
  let timeCol = -1;
  let startTimeCol = -1;
  let endTimeCol = -1;
  let notesCol = -1;
  let assignedCoachCols: number[] = [];
  let hasInspectedHeaders = false;

  // Floaters capture state
  let inFloatSection = false;
  let currentFloatTime = '12:00';
  const floatCoaches: string[] = [];

  // Sector alternation tracker for simultaneous sessions
  const simultaneousCountMap: Record<string, number> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cells = parseCSVLine(line, delimiter);
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    const lowerCells = cells.map((c) => c.toLowerCase());

    // 1. Check if line is a header row
    const isHeaderRow = lowerCells.some(
      (c) =>
        c === 'match/team' ||
        c === 'team' ||
        c === 'group' ||
        c === 'venue/location' ||
        c.includes('assigned') ||
        c.includes('coach') ||
        c.includes('umpire') ||
        c === 'start time' ||
        c === 'home/away' ||
        c === 'activity/opponent' ||
        c === 'activity'
    );

    if (isHeaderRow && !hasInspectedHeaders) {
      hasInspectedHeaders = true;
      dateCol = lowerCells.findIndex((c) => c.includes('date'));
      homeAwayCol = lowerCells.findIndex((c) => c.includes('home/away') || c === 'h/a');
      teamCol = lowerCells.findIndex((c) => c.includes('group') || c.includes('team') || c.includes('match/team') || c.includes('squad'));
      activityCol = lowerCells.findIndex((c) => c.includes('activity') || c.includes('opponent') || c.includes('opposition'));
      venueCol = lowerCells.findIndex((c) => c.includes('venue') || c.includes('location'));
      timeCol = lowerCells.findIndex((c) => c === 'time' || (c.includes('time') && !c.includes('start') && !c.includes('end')));
      startTimeCol = lowerCells.findIndex((c) => c.includes('start'));
      endTimeCol = lowerCells.findIndex((c) => c.includes('end'));
      notesCol = lowerCells.findIndex((c) => c.includes('note') || c.includes('comment'));

      // Explicit Coach Column Index Tracking:
      // Only columns whose header includes 'assigned', 'coach', or 'umpire' may be treated as coach columns.
      // If no header row contains those keywords, assignedCoachCols remains empty [].
      assignedCoachCols = lowerCells
        .map((c, idx) => ({ c, idx }))
        .filter(
          ({ c }) =>
            c.includes('assigned') ||
            c.includes('coach') ||
            c.includes('umpire')
        )
        .map(({ idx }) => idx);

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
          if (coachName.length > 2 && !coachName.toLowerCase().includes('float') && isValidCoachPersonName(coachName)) {
            const resolved = resolveOrCreateCoach(coachName);
            if (resolved) {
              floatCoaches.push(resolved.name);
            }
          }
        }
      }
      continue;
    }

    // 3. If in float section, subsequent rows without teams/times are floaters
    if (inFloatSection) {
      const rowHasTimes = cells.some((c) => /^\d{1,2}[:.]\d{2}$/.test(c) || /am|pm/i.test(c));
      if (!rowHasTimes) {
        for (const cell of cells) {
          if (cell && !isIgnoredCoachName(cell)) {
            const coachName = cleanCoachName(cell);
            if (coachName.length > 2 && !coachName.toLowerCase().includes('float') && isValidCoachPersonName(coachName)) {
              const resolved = resolveOrCreateCoach(coachName);
              if (resolved) {
                floatCoaches.push(resolved.name);
              }
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
    if (rawTeam.toLowerCase() === 'match/team' || rawTeam.toLowerCase() === 'team' || rawTeam.toLowerCase() === 'group') continue;

    // Extract Venue / Location
    const actualVenueCol = venueCol !== -1 ? venueCol : actualTeamCol + 1;
    const rawVenue = cells[actualVenueCol]?.trim() || 'Home';

    // Extract Activity and Notes
    const rawActivity = activityCol !== -1 ? cells[activityCol]?.trim() || '' : '';
    const rawNotes = notesCol !== -1 ? cells[notesCol]?.trim() || '' : '';

    // Scan for times
    let detectedStartTime = '';
    let detectedEndTime = '';

    if (timeCol !== -1 && cells[timeCol]) {
      const timeObj = parseTimeField(cells[timeCol]);
      detectedStartTime = timeObj.startTime;
      detectedEndTime = timeObj.endTime;
    } else if (
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
        } else if (/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(trimmed)) {
          const parsed = parseTimeField(trimmed);
          timeMatches.push({ text: parsed.startTime, colIdx: idx });
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
    // Only columns tracked in assignedCoachCols may be scanned.
    // If no header had coach keywords, assignedCoachCols is empty, so no coaches are extracted from trailing cols.
    const assignedCoachNames: string[] = [];
    if (assignedCoachCols.length > 0) {
      for (const colIdx of assignedCoachCols) {
        const val = cells[colIdx]?.trim();
        if (!val || isIgnoredCoachName(val)) continue;
        const cleaned = cleanCoachName(val);
        if (cleaned.length >= 2 && isValidCoachPersonName(cleaned)) {
          const coach = resolveOrCreateCoach(cleaned);
          if (coach) {
            assignedCoachNames.push(coach.name);
          }
        }
      }
    }

    // Home / Away Determination
    let isHome = true;
    if (homeAwayCol !== -1 && cells[homeAwayCol]) {
      const ha = cells[homeAwayCol].toLowerCase().trim();
      isHome = ha === 'home' || ha === 'h';
    } else {
      const venueLower = rawVenue.toLowerCase();
      isHome = !(
        venueLower.includes('away') ||
        venueLower.includes('in wesley') ||
        venueLower.includes('in mt temple') ||
        venueLower.includes('in drogheda') ||
        venueLower.includes('at ')
      );
    }

    // Match and opposition extraction
    const matchTarget = `${rawActivity} ${rawVenue} ${rawTeam}`.toLowerCase();
    const isMatch =
      matchTarget.includes('match') ||
      matchTarget.includes('blitz') ||
      /\bv\b/i.test(rawActivity) ||
      /\bvs\b/i.test(rawActivity) ||
      /\bv\b/i.test(rawVenue) ||
      /\bvs\b/i.test(rawVenue) ||
      rawTeam.toLowerCase().includes('match');

    let opposition: string | undefined = undefined;
    let competitionName: string | undefined = undefined;

    if (rawActivity) {
      const vMatch = rawActivity.match(/\bv[s]?\s+([^(]+)(?:\(([^)]+)\))?/i);
      if (vMatch) {
        opposition = vMatch[1].trim();
        if (vMatch[2]) {
          competitionName = `Leinster League (${vMatch[2].trim()})`;
        }
      }
    }
    if (!opposition && / v /i.test(rawVenue)) {
      opposition = rawVenue.split(/ v /i)[1]?.trim();
    } else if (!opposition && / vs /i.test(rawVenue)) {
      opposition = rawVenue.split(/ vs /i)[1]?.trim();
    } else if (!opposition) {
      const vl = rawVenue.toLowerCase();
      if (vl.includes('monkstown')) opposition = 'Monkstown HC';
      else if (vl.includes('railway') || vl.includes('park ave')) opposition = 'Railway Union HC';
      else if (vl.includes('pembroke') || vl.includes('serpentine')) opposition = 'Pembroke HC';
      else if (vl.includes('our lady')) opposition = "Our Lady's HC";
      else if (vl.includes('glenanne') || vl.includes('st mark')) opposition = 'Glenanne HC';
      else if (vl.includes('bray') || vl.includes('temple carrig')) opposition = 'Bray HC';
      else if (vl.includes('loreto')) opposition = 'Loreto HC';
      else if (vl.includes('wesley')) opposition = 'Wesley College';
    }

    if (opposition && opposition.toLowerCase().includes(' in ')) {
      opposition = opposition.split(/ in /i)[0]?.trim();
    }

    // Expand multiple team groups (e.g. "PEN, 1st, 2nd, 3rd, 4th class")
    const expandedTeams = expandTeamGroups(rawTeam);

    for (const subTeam of expandedTeams) {
      const { ageGroup, pathway } = normalizeAgeGroup(subTeam);

      // Determine Pitch Sector
      let pitchSectorId = 'p1n';

      if (!isHome) {
        pitchSectorId = 'away';
      } else if (rawVenue.toLowerCase().includes('sand')) {
        pitchSectorId = simultaneousCountMap['sand'] ? 'p2s' : 'p2n';
        simultaneousCountMap['sand'] = (simultaneousCountMap['sand'] || 0) + 1;
      } else if (rawVenue.toLowerCase().includes('water')) {
        pitchSectorId = 'p1n';
      } else if (rawVenue.toLowerCase().includes('cage') || subTeam.toLowerCase().includes('pen')) {
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
          ? `${subTeam}: ${rawActivity || rawVenue}`
          : `${subTeam} (AWAY vs ${opposition || 'Opponent'})`
        : rawVenue.toLowerCase() === 'home'
        ? `${subTeam} Squad Training`
        : `${subTeam} Squad Training (${rawVenue})`;

      const noteParts = [
        rawNotes,
        rawActivity && rawActivity.toLowerCase() !== 'training' && !rawActivity.startsWith('v ') ? rawActivity : '',
        expandedTeams.length > 1 ? `Part of combined group: ${rawTeam}` : '',
      ].filter(Boolean);

      const notesText = noteParts.length > 0
        ? noteParts.join(' | ')
        : `Imported from weekly schedule sheet. Venue: ${venue}. Assigned: ${assignedCoachNames.join(', ')}`;

      parsedRows.push({
        rawTeam: subTeam,
        ageGroupId: ageGroup,
        pathway,
        rawVenue,
        isMatch,
        opposition,
        competition: competitionName,
        isHome,
        assignedCoachNames,
        startTime: detectedStartTime,
        endTime: detectedEndTime,
        timeSlot,
        durationMins: durationMins > 0 ? durationMins : 60,
        pitchSectorId,
        sessionTitle,
        notes: notesText,
        date: detectedDate || defaultTargetDate,
      });
    }
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
        competition: row.competition || (row.rawVenue.toLowerCase().includes('blitz') ? 'Friendly Blitz' : 'Leinster League'),
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
