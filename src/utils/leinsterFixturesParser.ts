import { AgeGroup, MatchFixture } from '../types';

export interface LeinsterParsedRow {
  rawDate: string;
  normalizedDate: string;
  rawTime: string;
  normalizedTime: string;
  rawHomeTeam: string;
  rawAwayTeam: string;
  rawVenue: string;
  resolvedVenue: string;
  competition: string;
  round?: string;
  isHome: boolean;
  ourTeamRaw: string;
  opposition: string;
  trainingGroup: AgeGroup;
  rankedTeam: string;
  rankLetter: string;
  leadCoach: string;
  umpires: string[];
  notes?: string;
  isValid: boolean;
  validationError?: string;
}

export interface LeinsterParseResult {
  fixtures: MatchFixture[];
  rows: LeinsterParsedRow[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: string[];
  trainingGroupBreakdown: Record<string, number>;
  rankedTeamBreakdown: Record<string, number>;
  dateRange: { start: string; end: string } | null;
  homeCount: number;
  awayCount: number;
}

/**
 * Normalizes time string to standard 24h "HH:MM"
 */
export function normalizePushbackTime(rawTime: string): string {
  if (!rawTime) return '10:30';
  const clean = rawTime.trim().toLowerCase().replace('.', ':');

  // Match e.g. "11:00am", "1:30pm", "2pm", "11am"
  const ampmMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2] ? ampmMatch[2].padStart(2, '0') : '00';
    const isPm = ampmMatch[3].toLowerCase() === 'pm';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${mins}`;
  }

  // Match standard 24h e.g. "14:30" or "9:30"
  const standardMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (standardMatch) {
    const hours = standardMatch[1].padStart(2, '0');
    const mins = standardMatch[2];
    return `${hours}:${mins}`;
  }

  return '10:30';
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Parses date into ISO "YYYY-MM-DD"
 * Leinster season starts in Sept (e.g. 2026) and finishes in Apr/May (2027)
 */
export function normalizeLeinsterDate(rawDate: string, defaultSeasonYear = 2026): string | null {
  if (!rawDate) return null;
  const clean = rawDate.trim().replace(/^[a-z]+,?\s*/i, ''); // strip "Sunday, " or "Sun "

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = dmyMatch[3] ? parseInt(dmyMatch[3], 10) : undefined;
    if (year !== undefined && year < 100) year += 2000;
    if (!year) {
      year = month >= 8 ? defaultSeasonYear : defaultSeasonYear + 1;
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  // Textual: e.g. "11 Oct 2026" or "11 October"
  const textMatch = clean.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{2,4}))?$/i);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const month = MONTH_MAP[monthStr];
    if (month) {
      let year = textMatch[3] ? parseInt(textMatch[3], 10) : undefined;
      if (year !== undefined && year < 100) year += 2000;
      if (!year) {
        year = month >= 8 ? defaultSeasonYear : defaultSeasonYear + 1;
      }
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  return null;
}

export interface GoogleSheetTab {
  name: string;
  gid: string;
}

export interface GoogleSheetFetchResult {
  csvText: string;
  sheetName?: string;
  discoveredTabs: GoogleSheetTab[];
}

/**
 * Discovers available tabs in a Google Sheet
 */
export async function discoverGoogleSheetTabs(urlOrId: string): Promise<GoogleSheetTab[]> {
  const sheetIdMatch = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = sheetIdMatch ? sheetIdMatch[1] : /^[a-zA-Z0-9-_]{20,}$/.test(urlOrId.trim()) ? urlOrId.trim() : null;
  if (!id) return [];

  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`);
    if (!res.ok) return [];
    const html = await res.text();

    const regex = /\[\d+,\s*0,\s*\\*"(\d+)\\*",\s*\[\{\\*"1\\*":\[\[0,0,\\*"([^\\"]+)\\*"/g;
    const tabs: GoogleSheetTab[] = [];
    const seenGids = new Set<string>();
    let match;
    while ((match = regex.exec(html)) !== null) {
      const gid = match[1];
      const name = match[2].trim();
      if (!seenGids.has(gid) && name) {
        seenGids.add(gid);
        tabs.push({ gid, name });
      }
    }

    // Sort tabs so primary Old Alex tabs appear first
    tabs.sort((a, b) => {
      const aAlex = a.name.toLowerCase().startsWith('old alex');
      const bAlex = b.name.toLowerCase().startsWith('old alex');
      if (aAlex && !bAlex) return -1;
      if (!aAlex && bAlex) return 1;

      const aCopy = a.name.toLowerCase().startsWith('copy of');
      const bCopy = b.name.toLowerCase().startsWith('copy of');
      if (!aCopy && bCopy) return -1;
      if (aCopy && !bCopy) return 1;

      return a.name.localeCompare(b.name);
    });

    return tabs;
  } catch {
    return [];
  }
}

/**
 * Converts a Google Sheets URL or ID into an exportable CSV URL
 */
export function extractGoogleSheetCsvUrl(urlOrId: string, specificGid?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const clean = urlOrId.trim();

  // If already an export or gviz link with gid
  if ((clean.includes('/gviz/tq?tqx=out:csv') || clean.includes('/export?format=csv')) && (!specificGid || clean.includes(`gid=${specificGid}`))) {
    return clean;
  }

  // Check for spreadsheet ID match in URL
  const sheetIdMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = sheetIdMatch ? sheetIdMatch[1] : /^[a-zA-Z0-9-_]{20,}$/.test(clean) ? clean : null;

  if (!id) return null;

  // Extract gid (tab id) if present
  const gidMatch = clean.match(/[?&#]gid=([0-9]+)/);
  const gid = specificGid ?? (gidMatch ? gidMatch[1] : undefined);

  // Use Google Visualization Query API endpoint which provides reliable CORS support for web clients
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${gid !== undefined ? `&gid=${gid}` : ''}`;
}

/**
 * Fetches Google Sheet content as CSV text with auto-tab discovery
 */
export async function fetchGoogleSheetContent(
  urlOrId: string,
  specificGid?: string
): Promise<GoogleSheetFetchResult> {
  const sheetIdMatch = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const id = sheetIdMatch ? sheetIdMatch[1] : /^[a-zA-Z0-9-_]{20,}$/.test(urlOrId.trim()) ? urlOrId.trim() : null;

  if (!id) {
    throw new Error('Please provide a valid Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/...)');
  }

  const urlGidMatch = urlOrId.match(/[?&#]gid=([0-9]+)/);
  let targetGid = specificGid ?? (urlGidMatch ? urlGidMatch[1] : undefined);
  let sheetName: string | undefined;
  let discoveredTabs: GoogleSheetTab[] = [];

  // If no gid was explicitly provided in the URL or arguments, discover tabs
  if (!targetGid) {
    discoveredTabs = await discoverGoogleSheetTabs(id);
    if (discoveredTabs.length > 0) {
      // Prioritize "OLD ALEX" consolidated tab, or Inter tabs
      const bestTab =
        discoveredTabs.find((t) => t.name.toLowerCase() === 'old alex') ||
        discoveredTabs.find((t) => t.name.toLowerCase().includes('inter') && !t.name.toLowerCase().includes('copy')) ||
        discoveredTabs.find((t) => t.name.toLowerCase().includes('fixture')) ||
        discoveredTabs[0];

      if (bestTab) {
        targetGid = bestTab.gid;
        sheetName = bestTab.name;
      }
    }
  }

  const exportUrl = extractGoogleSheetCsvUrl(id, targetGid);
  if (!exportUrl) {
    throw new Error('Could not generate export URL for Google Sheet.');
  }

  try {
    const res = await fetch(exportUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch sheet (HTTP ${res.status}). Make sure the Google Sheet access is set to "Anyone with the link can view", or copy & paste the cells directly.`
      );
    }

    const text = await res.text();
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      throw new Error(
        'Google returned an HTML login or access denied page. Please ensure the Google Sheet link sharing is set to "Anyone with the link can view", or copy and paste the cells directly.'
      );
    }

    return { csvText: text, sheetName, discoveredTabs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      throw new Error(
        'Network error accessing Google Sheets. If the sheet is private, you can simply copy the rows in Google Sheets (Ctrl+C) and paste them directly into the "Paste from Sheets" tab.'
      );
    }
    throw err;
  }
}

/**
 * Checks whether a team string refers to Old Alexandra
 */
export function isOldAlexTeam(teamStr: string): boolean {
  if (!teamStr) return false;
  const lower = teamStr.toLowerCase().trim();
  return (
    lower.includes('old alex') ||
    lower.includes('old alexandra') ||
    lower.includes('oahc') ||
    lower.startsWith('alex') ||
    lower.includes('alexandra') ||
    lower === 'home' ||
    lower === 'our team' ||
    /^(inter|minor|1st year|first year|6th class|5th class|4th class|3rd class|2nd class|1st class|pen)\s*([a-e]|1|2|3|4|5)?$/i.test(lower)
  );
}

/**
 * Resolves Training Group and Ranked Team
 * For each training group there can be multiple ranked teams (A, B, C, D, E or 1sts, 2nds, etc.)
 */
export function resolveTrainingGroupAndRank(
  rawTeam: string,
  competition = ''
): {
  trainingGroup: AgeGroup;
  rankedTeam: string;
  rankLetter: string;
} {
  const combined = `${rawTeam} ${competition}`.toLowerCase();

  // 1. Identify Training Group
  let trainingGroup: AgeGroup = 'Inters';

  if (combined.includes('inter') || combined.includes('u18') || combined.includes('under 18')) {
    trainingGroup = 'Inters';
  } else if (combined.includes('minor') || combined.includes('u16') || combined.includes('under 16')) {
    trainingGroup = 'Minors';
  } else if (
    combined.includes('1st year') ||
    combined.includes('first year') ||
    combined.includes('1st yr') ||
    combined.includes('first yr') ||
    combined.includes('u14') ||
    combined.includes('under 14')
  ) {
    trainingGroup = '1st Years';
  } else if (combined.includes('6th') || combined.includes('sixth') || combined.includes('u12')) {
    trainingGroup = '6th Class';
  } else if (combined.includes('5th') || combined.includes('fifth') || combined.includes('u11')) {
    trainingGroup = '5th Class';
  } else if (combined.includes('4th') || combined.includes('fourth') || combined.includes('u10')) {
    trainingGroup = '4th Class';
  } else if (combined.includes('3rd') || combined.includes('third') || combined.includes('u9')) {
    trainingGroup = '3rd Class';
  } else if (combined.includes('2nd class') || combined.includes('second class') || combined.includes('u8')) {
    trainingGroup = '2nd Class';
  } else if (combined.includes('1st class') || combined.includes('first class')) {
    trainingGroup = '1st Class';
  } else if (combined.includes('pen') || combined.includes('prep')) {
    trainingGroup = 'PEN';
  }

  // 2. Identify Rank Letter (A, B, C, D, E...)
  let rankLetter = 'A';

  // Check explicit letter suffix or word e.g. "Inter A", "Minor B", "6th Class C"
  const letterMatch = rawTeam.match(/\b([A-E])\b(?!\s*class)/i);
  if (letterMatch) {
    rankLetter = letterMatch[1].toUpperCase();
  } else {
    // Strip age group prefix numbers (e.g. "1st Yr", "6th Class", "1st Year") so they don't hijack team ranking
    const strippedRawTeam = rawTeam.replace(
      /\b(1st|2nd|3rd|4th|5th|6th|first|second|third|fourth|fifth|sixth)\s*(year|yr|class)?\b/gi,
      ''
    );
    // Check numeric or ordinal ranks: e.g. "Old Alex 1", "Alex 2nd", "Team 3"
    const numMatch = strippedRawTeam.match(/\b([1-5])(?:st|nd|rd|th)?\b/i);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      const letterMap: Record<number, string> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
      rankLetter = letterMap[num] || 'A';
    } else {
      // Check division fallback in competition string
      const divMatch = competition.match(/\bdiv(?:ision)?\s*(\d+)\b/i);
      if (divMatch) {
        const divNum = parseInt(divMatch[1], 10);
        if (divNum === 1) rankLetter = 'A';
        else if (divNum === 2 || divNum === 3) rankLetter = 'B';
        else if (divNum === 4 || divNum === 5) rankLetter = 'C';
        else if (divNum >= 6) rankLetter = 'D';
      }
    }
  }

  // 3. Format canonical Ranked Team name
  const groupPrefixMap: Record<AgeGroup, string> = {
    Inters: 'Inter',
    Minors: 'Minor',
    '1st Years': '1st Year',
    '6th Class': '6th Class',
    '5th Class': '5th Class',
    '4th Class': '4th Class',
    '3rd Class': '3rd Class',
    '2nd Class': '2nd Class',
    '1st Class': '1st Class',
    PEN: 'PEN',
  };

  const prefix = groupPrefixMap[trainingGroup];
  const rankedTeam = `${prefix} ${rankLetter}`;

  return { trainingGroup, rankedTeam, rankLetter };
}

/**
 * Resolves Default Lead Coach for an Age Group
 */
export function getDefaultLeadCoach(trainingGroup: AgeGroup): string {
  switch (trainingGroup) {
    case 'Inters':
      return 'Richard Couse';
    case 'Minors':
      return 'Ben McInerney';
    case '1st Years':
      return 'Josh Gill';
    case '6th Class':
      return 'Katie Mullan';
    case '5th Class':
      return 'John Walsh';
    case '4th Class':
      return 'Josh Gill';
    case '3rd Class':
      return 'Meabh Russell';
    case '2nd Class':
      return 'Ben McInerney';
    case '1st Class':
      return 'Megan Marshall';
    case 'PEN':
      return 'Barbara Luke';
    default:
      return 'Richard Couse';
  }
}

/**
 * Clean & resolve venue name
 */
export function resolveLeinsterVenue(rawVenue: string, isHome: boolean, opposition = ''): string {
  if (isHome) {
    if (!rawVenue || /home|milltown/i.test(rawVenue)) {
      return 'Milltown Pitch 1 (Full)';
    }
    return rawVenue.trim();
  }

  const check = `${rawVenue} ${opposition}`.toLowerCase().trim();

  if (check.includes('serpentine') || check.includes('pembroke')) return 'Serpentine Ave (Pembroke HC)';
  if (check.includes('park ave') || check.includes('railway union') || check.includes('railway')) return 'Park Avenue (Railway Union HC)';
  if (check.includes('temple carrig') || check.includes('bray')) return 'Temple Carrig (Bray HC)';
  if (check.includes('st mark') || check.includes('glenanne')) return "St Mark's (Glenanne HC)";
  if (check.includes('wesley') || check.includes('ymca')) return 'Wesley College (YMCA HC)';
  if (check.includes('mt temple') || check.includes('mount temple') || check.includes('clontarf')) return 'Mount Temple (Clontarf HC)';
  if (check.includes('loreto beaufort') || check.includes('beaufort') || check.includes('loreto')) return 'Loreto Beaufort';
  if (check.includes('terenure') || check.includes("our lady")) return "Our Lady's School Terenure";
  if (check.includes('drogheda') || check.includes('boyne')) return 'Drogheda Grammar (Boyne HC)';
  if (check.includes('muckross')) return 'Muckross Park';
  if (check.includes('grange rd') || check.includes('three rock') || check.includes('trrhc')) return 'Grange Road (Three Rock Rovers)';
  if (check.includes('st gerard')) return "St Gerard's School Bray";
  if (check.includes('avoca')) return 'Newpark School (Avoca HC)';
  if (check.includes('monkstown')) return 'Rathdown School (Monkstown HC)';
  if (check.includes('corinthian')) return 'Whitechurch (Corinthians HC)';
  if (check.includes('weston')) return 'Griffeen Valley (Weston HC)';
  if (check.includes('dalkey')) return 'Loreto Dalkey (Dalkey HC)';
  if (check.includes('kilkenny')) return 'Kilkenny College';
  if (check.includes('malahide')) return 'Malahide Community School';
  if (check.includes('suttonians')) return 'Sutton Park School';
  if (check.includes('carlow')) return 'Carlow HC Ground';
  if (check.includes('wicklow')) return 'East Glendalough (Wicklow HC)';
  if (check.includes('rathgar')) return 'The High School (Rathgar HC)';
  if (check.includes('genesis')) return "St Raphaela's (Genesis HC)";
  if (check.includes('portrane')) return 'Donabate Leisure Centre (Portrane HC)';
  if (check.includes('gorey')) return 'Gorey Showgrounds (Gorey HC)';
  if (check.includes('laois')) return 'Portlaoise Leisure Centre (Laois HC)';
  if (check.includes('naas')) return 'Naas Sports Centre (Naas HC)';
  if (check.includes('newbridge')) return 'Newbridge College (Newbridge HC)';
  if (check.includes('north kildare')) return 'The Maws Kilcock (North Kildare HC)';
  if (check.includes('enniscorthy')) return 'Astro Active Centre (Enniscorthy HC)';

  if (!rawVenue || /away/i.test(rawVenue)) {
    return opposition ? `${opposition} Ground (Away)` : 'Away Venue (TBC)';
  }

  return rawVenue.trim();
}

/**
 * RFC 4180 CSV & TSV Parser supporting quoted strings with commas and newlines
 */
export function parseCSVToGrid(csvText: string): string[][] {
  const clean = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!clean.trim()) return [];

  // Determine delimiter from first line: check tab vs comma vs semicolon
  const firstLine = clean.split('\n')[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
  else if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        // Only push non-empty rows
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse Leinster Hockey Season Fixtures CSV / Spreadsheet
 */
export function parseLeinsterFixturesCSV(csvContent: string): LeinsterParseResult {
  const grid = parseCSVToGrid(csvContent);
  if (grid.length === 0) {
    return {
      fixtures: [],
      rows: [],
      totalRows: 0,
      validCount: 0,
      errorCount: 0,
      errors: ['File is empty or contains no readable lines.'],
      trainingGroupBreakdown: {},
      rankedTeamBreakdown: {},
      dateRange: null,
      homeCount: 0,
      awayCount: 0,
    };
  }

  // Scan first 15 rows to find header row (handles sheets with banner rows or metadata)
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const rowLower = grid[r].map((c) => c.toLowerCase().trim());
    const hasDate = rowLower.some((c) => c === 'date' || /\bdate\b/i.test(c) || c === 'day');
    const hasTeamOrOpp = rowLower.some(
      (c) =>
        c === 'team' ||
        /\bteam\b/i.test(c) ||
        c === 'squad' ||
        c === 'home' ||
        c === 'away' ||
        c === 'opponent' ||
        c === 'opposition' ||
        c === 'round'
    );
    if (hasDate && hasTeamOrOpp) {
      headerRowIdx = r;
      break;
    }
  }

  const hasExplicitHeader = headerRowIdx !== -1;
  const headerRow = hasExplicitHeader
    ? grid[headerRowIdx].map((h) => h.toLowerCase().trim())
    : grid[0].map((h) => h.toLowerCase().trim());

  let dateCol = -1;
  let timeCol = -1;
  let homeCol = -1;
  let awayCol = -1;
  let teamCol = -1;
  let oppCol = -1;
  let venueCol = -1;
  let compCol = -1;
  let roundCol = -1;
  let homeAwayIndicatorCol = -1;
  let coachCol = -1;
  let umpireCol = -1;
  let notesCol = -1;

  headerRow.forEach((col, idx) => {
    if (col === 'date' || /\bdate\b/i.test(col) || col === 'day') dateCol = idx;
    else if (col === 'time' || col.includes('pushback') || col.includes('push back') || col === 'ko' || col.includes('start time') || col === 'pb' || col === 'start') timeCol = idx;
    else if (col === 'home' || col === 'home team' || col === 'host' || col === 'team 1') homeCol = idx;
    else if (col === 'away' || col === 'away team' || col === 'visitor' || col === 'team 2') awayCol = idx;
    else if (col === 'home/away' || col === 'h/a' || col === 'home or away' || col === 'location type' || col === 'h / a') homeAwayIndicatorCol = idx;
    else if (col === 'group' || col === 'team' || col === 'match/team' || col === 'squad' || col === 'our team' || col === 'alex team' || col === 'old alex team' || col === 'grade' || col === 'category') teamCol = idx;
    else if (col === 'activity/opponent' || col === 'opponent' || col === 'opposition' || col === 'versus' || col === 'vs' || col === 'against' || col === 'other team') oppCol = idx;
    else if (col === 'venue' || col.includes('location') || col === 'ground' || col === 'pitch' || col === 'where') venueCol = idx;
    else if (col === 'competition' || col.includes('division') || col === 'comp' || col === 'league' || col === 'tournament') compCol = idx;
    else if (col === 'round' || col === 'rnd' || col === 'matchday' || col === 'game' || col === 'fixture') roundCol = idx;
    else if (col === 'coach' || col === 'lead coach' || col === 'manager' || col === 'lead coach/manager' || col.includes('assigned coach')) coachCol = idx;
    else if (col === 'umpire' || col === 'umpires' || col === 'referee' || col === 'ref' || col.includes('assigned umpire')) umpireCol = idx;
    else if (col === 'notes' || col === 'comments' || col === 'details' || col === 'info') notesCol = idx;
  });

  const dataRows = hasExplicitHeader ? grid.slice(headerRowIdx + 1) : grid;

  const parsedRows: LeinsterParsedRow[] = [];
  const errors: string[] = [];
  const trainingGroupBreakdown: Record<string, number> = {};
  const rankedTeamBreakdown: Record<string, number> = {};
  let homeCount = 0;
  let awayCount = 0;
  const dates: string[] = [];

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    if (row.length === 0 || row.every((c) => !c.trim())) continue;

    // Check for total/summary row marking end of consolidated schedule table
    if (row.some((c) => /total\s+(games|fixtures)/i.test(c))) {
      break;
    }

    // Extract values based on column indexes or heuristic position
    let rawDate = dateCol !== -1 ? row[dateCol] || '' : '';
    let rawTime = timeCol !== -1 ? row[timeCol] || '' : '';
    let rawHomeTeam = homeCol !== -1 ? row[homeCol] || '' : '';
    let rawAwayTeam = awayCol !== -1 ? row[awayCol] || '' : '';
    let rawTeam = teamCol !== -1 ? row[teamCol] || '' : '';
    let rawOpponent = oppCol !== -1 ? row[oppCol] || '' : '';
    let rawVenue = venueCol !== -1 ? row[venueCol] || '' : '';
    let rawComp = compCol !== -1 ? row[compCol] || '' : '';
    let rawRound = roundCol !== -1 ? row[roundCol] || '' : '';
    let rawHomeAway = homeAwayIndicatorCol !== -1 ? row[homeAwayIndicatorCol] || '' : '';
    let rawCoach = coachCol !== -1 ? row[coachCol] || '' : '';
    let rawUmpire = umpireCol !== -1 ? row[umpireCol] || '' : '';
    let rawNotes = notesCol !== -1 ? row[notesCol] || '' : '';

    // If headers weren't found, use cell content scanning heuristics
    if (!hasExplicitHeader) {
      for (const cell of row) {
        if (!rawDate && normalizeLeinsterDate(cell)) {
          rawDate = cell;
        } else if (!rawTime && /^\d{1,2}(:\d{2})?\s*(am|pm)?$/i.test(cell)) {
          rawTime = cell;
        } else if (!rawHomeAway && /^(home|away)$/i.test(cell)) {
          rawHomeAway = cell;
        } else if (!rawComp && /div|league|cup|blitz/i.test(cell)) {
          rawComp = cell;
        }
      }
    }

    // Date Normalization
    const normalizedDate = normalizeLeinsterDate(rawDate);
    if (!normalizedDate) {
      errors.push(`Row ${rowIdx + 1}: Could not determine valid match date from "${rawDate}".`);
      continue;
    }

    // Time Normalization
    const normalizedTime = normalizePushbackTime(rawTime);

    // Resolve Home vs Away & Teams
    let isHome = true;
    let ourTeamRaw = '';
    let opposition = '';

    if (rawHomeAway) {
      isHome = rawHomeAway.toLowerCase().trim() === 'home';
    } else if (rawVenue) {
      if (/^home$/i.test(rawVenue.trim())) isHome = true;
      else if (/^away$/i.test(rawVenue.trim())) isHome = false;
    }

    if (rawHomeTeam && rawAwayTeam) {
      // Home & Away format
      const homeIsAlex = isOldAlexTeam(rawHomeTeam);
      const awayIsAlex = isOldAlexTeam(rawAwayTeam);

      if (homeIsAlex && !awayIsAlex) {
        isHome = true;
        ourTeamRaw = rawHomeTeam;
        opposition = rawAwayTeam;
      } else if (awayIsAlex && !homeIsAlex) {
        isHome = false;
        ourTeamRaw = rawAwayTeam;
        opposition = rawHomeTeam;
      } else {
        if (/home/i.test(rawVenue)) {
          isHome = true;
          ourTeamRaw = homeIsAlex ? rawHomeTeam : rawAwayTeam;
          opposition = homeIsAlex ? rawAwayTeam : rawHomeTeam;
        } else {
          isHome = false;
          ourTeamRaw = awayIsAlex ? rawAwayTeam : rawHomeTeam;
          opposition = awayIsAlex ? rawHomeTeam : rawAwayTeam;
        }
      }
    } else if (rawTeam) {
      // Team + Activity/Opponent format (e.g., Colts schedule)
      ourTeamRaw = rawTeam;
      if (rawOpponent) {
        // Extract opponent from e.g. "v Pembroke (Div 1)" or "Match V YMCA"
        const cleanOpp = rawOpponent.replace(/^(match\s+)?v(?:s)?\.?\s+/i, '').trim();
        // Extract possible division in parenthesis e.g. "Pembroke (Div 1)"
        const parenDivMatch = cleanOpp.match(/^(.*?)\s*\((Div[^)]+)\)$/i);
        if (parenDivMatch) {
          opposition = parenDivMatch[1].trim();
          if (!rawComp) rawComp = `Leinster League ${parenDivMatch[2].trim()}`;
        } else {
          opposition = cleanOpp;
        }
      }
    }

    if (rawTeam && (!ourTeamRaw || isOldAlexTeam(rawTeam))) {
      ourTeamRaw = rawTeam;
    }
    if (rawOpponent && (!opposition || opposition === 'Opposition TBD')) {
      opposition = rawOpponent;
    }

    // Clean opposition
    opposition = opposition.replace(/^(v|vs)\.?\s+/i, '').trim() || 'Opposition TBD';
    if (!ourTeamRaw) ourTeamRaw = 'Old Alex Squad';

    // Resolved Venue
    const resolvedVenue = resolveLeinsterVenue(rawVenue, isHome, opposition);

    // Resolve Training Group and Ranked Team
    const { trainingGroup, rankedTeam, rankLetter } = resolveTrainingGroupAndRank(
      ourTeamRaw,
      rawComp
    );

    // Competition resolution
    let competition = rawComp.trim();
    if (!competition) {
      const teamLower = ourTeamRaw.toLowerCase();
      // Match explicit inter league divisions
      if (teamLower.includes('inter 1')) competition = 'Leinster Inter League Div 1';
      else if (teamLower.includes('inter 2')) competition = 'Leinster Inter League Div 2';
      else if (teamLower.includes('inter 3')) competition = 'Leinster Inter League Div 4';
      else if (teamLower.includes('inter 4')) competition = 'Leinster Inter League Div 7';
      else if (teamLower.includes('inter 5')) competition = 'Leinster Inter League Div 8';
      // Minor divisions
      else if (teamLower.includes('minor 1')) competition = 'Leinster Minor League Div 1';
      else if (teamLower.includes('minor 2')) competition = 'Leinster Minor League Div 3';
      else if (teamLower.includes('minor 3')) competition = 'Leinster Minor League Div 7';
      // 1st Year divisions
      else if (teamLower.includes('1st yr 1') || teamLower.includes('1st year 1')) competition = 'Leinster 1st Year League Div 1';
      else if (teamLower.includes('1st yr 2') || teamLower.includes('1st year 2')) competition = 'Leinster 1st Year League Div 2';
      else if (teamLower.includes('1st yr 3') || teamLower.includes('1st year 3')) competition = 'Leinster 1st Year League Div 4';
      else if (teamLower.includes('1st yr 4') || teamLower.includes('1st year 4')) competition = 'Leinster 1st Year League Div 7';
      // 6th class divisions
      else if (teamLower.includes('6th class 3')) competition = 'Leinster 6th Class League Div 6';
      else competition = `Leinster ${trainingGroup} League`;
    }

    // Lead coach
    const leadCoach = rawCoach.trim() || getDefaultLeadCoach(trainingGroup);
    const umpires = rawUmpire.trim() ? [rawUmpire.trim()] : ['Club Appointed'];

    // Increment breakdowns
    trainingGroupBreakdown[trainingGroup] = (trainingGroupBreakdown[trainingGroup] || 0) + 1;
    rankedTeamBreakdown[rankedTeam] = (rankedTeamBreakdown[rankedTeam] || 0) + 1;
    if (isHome) homeCount++;
    else awayCount++;
    dates.push(normalizedDate);

    parsedRows.push({
      rawDate,
      normalizedDate,
      rawTime,
      normalizedTime,
      rawHomeTeam,
      rawAwayTeam,
      rawVenue,
      resolvedVenue,
      competition,
      round: rawRound.trim() || undefined,
      isHome,
      ourTeamRaw,
      opposition,
      trainingGroup,
      rankedTeam,
      rankLetter,
      leadCoach,
      umpires,
      notes: rawNotes.trim() || undefined,
      isValid: true,
    });
  }

  // Calculate Date Range
  let dateRange: { start: string; end: string } | null = null;
  if (dates.length > 0) {
    dates.sort();
    dateRange = { start: dates[0], end: dates[dates.length - 1] };
  }

  // Build MatchFixture entities
  const fixtures: MatchFixture[] = parsedRows.map((row, idx) => ({
    id: `fix-leinster-${row.normalizedDate}-${row.rankedTeam.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}-${Date.now().toString(36)}`,
    date: row.normalizedDate,
    pushbackTime: row.normalizedTime,
    ageGroupOrTeam: row.rankedTeam,
    competition: row.competition,
    opposition: row.opposition,
    isHome: row.isHome,
    venue: row.resolvedVenue,
    pitchSectorId: row.isHome ? 'p1n' : undefined,
    leadCoachOrManager: row.leadCoach,
    umpires: row.umpires,
    notes: row.notes,
    status: 'Scheduled',
    trainingGroup: row.trainingGroup,
    rankedTeam: row.rankedTeam,
    round: row.round,
  }));

  return {
    fixtures,
    rows: parsedRows,
    totalRows: grid.length > 0 ? grid.length - (hasExplicitHeader ? 1 : 0) : 0,
    validCount: fixtures.length,
    errorCount: errors.length,
    errors,
    trainingGroupBreakdown,
    rankedTeamBreakdown,
    dateRange,
    homeCount,
    awayCount,
  };
}

/**
 * Realistic Sample CSV text representing a full season of Leinster Hockey fixtures
 * with multiple ranked teams per training group (Inters A-D, Minors A-C, 1st Years A-D, 6th Class A-C).
 */
export const SAMPLE_LEINSTER_SEASON_CSV = `Date,Time,Home Team,Away Team,Venue,Competition,Round
11/10/2026,10:30,Old Alex Inter A,YMCA HC,Milltown Pitch 1 (Full),Leinster Inter League Div 1,Round 1
11/10/2026,12:00,Pembroke Wanderers,Old Alex Inter B,Serpentine Ave,Leinster Inter League Div 2,Round 1
11/10/2026,13:30,Old Alex Inter C,Clontarf HC,Milltown Pitch 1 (Full),Leinster Inter League Div 3,Round 1
11/10/2026,15:00,Boyne HC,Old Alex Inter D,Drogheda Grammar,Leinster Inter League Div 4,Round 1
18/10/2026,11:00,Old Alex Minor A,Bray Hockey Club,Milltown Pitch 1 (Full),Leinster Minor League Div 1,Round 1
18/10/2026,12:30,Railway Union HC,Old Alex Minor B,Park Avenue,Leinster Minor League Div 3,Round 1
18/10/2026,14:00,Old Alex Minor C,Loreto HC,Milltown Pitch 1 (Full),Leinster Minor League Div 7,Round 1
25/10/2026,10:30,Old Alex 1st Year A,Dalkey HC,Milltown Pitch 1 (Full),Leinster 1st Year League Div 1,Round 1
25/10/2026,12:00,Old Alex 1st Year B,Avoca HC,Milltown Pitch 1 (Full),Leinster 1st Year League Div 2,Round 1
25/10/2026,13:30,Bray Hockey Club,Old Alex 1st Year C,Temple Carrig,Leinster 1st Year League Div 3,Round 1
25/10/2026,15:00,Loreto HC,Old Alex 1st Year D,Loreto Beaufort,Leinster 1st Year League Div 4,Round 1
08/11/2026,11:00,Pembroke Wanderers,Old Alex 6th Class A,Serpentine Ave,Leinster 6th Class League Div 1,Round 1
08/11/2026,12:15,Our Lady's School,Old Alex 6th Class B,Our Lady's school Terenure,Leinster 6th Class League Div 3,Round 1
08/11/2026,13:30,Glenanne HC,Old Alex 6th Class C,St Mark's,Leinster 6th Class League Div 6,Round 1
15/11/2026,11:00,Railway Union HC,Old Alex Inter A,Park Avenue,Leinster Inter League Div 1,Round 2
15/11/2026,12:30,Old Alex Inter B,Muckross HC,Milltown Pitch 1 (Full),Leinster Inter League Div 2,Round 2
15/11/2026,14:00,Old Alex Minor A,Three Rock Rovers,Milltown Pitch 1 (Full),Leinster Minor League Div 1,Round 2
22/11/2026,10:30,Monkstown HC,Old Alex Minor B,Rathdown,Leinster Minor League Div 3,Round 2
22/11/2026,12:00,Old Alex 1st Year A,Railway Union HC,Milltown Pitch 1 (Full),Leinster 1st Year League Div 1,Round 2
22/11/2026,13:30,Corinthians HC,Old Alex 1st Year B,Whitechurch,Leinster 1st Year League Div 2,Round 2
06/12/2026,11:00,Old Alex 6th Class A,Railway Union HC,Milltown Pitch 1 (Full),Leinster 6th Class League Div 1,Round 2
13/12/2026,11:00,Loreto HC,Old Alex Inter A,Loreto Beaufort,Leinster Inter League Div 1,Round 3
17/01/2027,11:00,Old Alex Minor A,YMCA HC,Milltown Pitch 1 (Full),Leinster Minor League Div 1,Round 3
24/01/2027,12:30,Old Alex Inter B,Genesis HC,Milltown Pitch 1 (Full),Leinster Inter League Div 2,Round 3
07/02/2027,11:00,Bray Hockey Club,Old Alex 1st Year A,Temple Carrig,Leinster 1st Year League Div 1,Round 3
21/02/2027,12:00,Old Alex 6th Class B,Pembroke Wanderers,Milltown Pitch 1 (Full),Leinster 6th Class League Div 3,Round 2
07/03/2027,11:00,Old Alex Inter A,Monkstown HC,Milltown Pitch 1 (Full),Leinster Premier Cup,Quarter-Final
21/03/2027,12:00,Old Alex Minor A,Loreto HC,Milltown Pitch 1 (Full),Leinster Minor Cup,Semi-Final
04/04/2027,11:00,Old Alex Inter A,Pembroke Wanderers,Milltown Pitch 1 (Full),Leinster Premier Cup,Final
18/04/2027,14:00,Old Alex Minor A,Railway Union HC,Milltown Pitch 1 (Full),Leinster Minor Cup,Final`;
