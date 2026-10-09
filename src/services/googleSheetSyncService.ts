import { useAppStore } from '../store';
import {
  fetchGoogleSheetContent,
  parseLeinsterFixturesCSV,
  GoogleSheetTab,
  LeinsterParseResult,
} from '../utils/leinsterFixturesParser';
import { MatchFixture } from '../types';

export const DEFAULT_INTER_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1C1nAVGwhN_XEhommnuXfzNXsC0QOCjt1zD6DaDBQYs4/edit?usp=sharing';
export const DEFAULT_INTER_GID = '1948339002'; // 'OLD ALEX' tab
export const DEFAULT_INTER_TAB_NAME = 'OLD ALEX';

export const PRIMARY_OLD_ALEX_TABS = [
  { name: 'OLD ALEX (Inters)', gid: '1948339002', squad: 'Inters' },
  { name: 'OLD ALEX MINOR', gid: '313641918', squad: 'Minors' },
  { name: 'OLD ALEX 1ST YR', gid: '1111001', squad: '1st Years' },
  { name: 'OLD ALEX 6TH CLASS', gid: '1111002', squad: '6th Class' },
];


const STORAGE_KEY_URL = 'oldalex_linked_fixtures_sheet_url_v1';
const STORAGE_KEY_SYNC = 'oldalex_linked_fixtures_sheet_sync_v1';
const STORAGE_KEY_TAB_GID = 'oldalex_linked_fixtures_sheet_gid_v1';

export interface SheetSyncSummary {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  totalCount: number;
  fixtures: MatchFixture[];
  rankedTeamBreakdown: Record<string, number>;
  discoveredTabs: GoogleSheetTab[];
  sheetName?: string;
  timestamp: string;
  error?: string;
}

export class GoogleSheetSyncService {
  /**
   * Retrieves the currently linked Google Sheet URL
   */
  public static getLinkedSheetUrl(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_URL);
      if (stored && stored.trim()) return stored.trim();
    } catch {
      // fallback
    }
    return DEFAULT_INTER_SHEET_URL;
  }

  /**
   * Updates the linked Google Sheet URL
   */
  public static setLinkedSheetUrl(url: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } catch (e) {
      console.warn('Could not persist linked Google Sheet URL:', e);
    }
  }

  /**
   * Retrieves the currently linked tab GID (defaults to 1948339002 for 'OLD ALEX')
   */
  public static getLinkedTabGid(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TAB_GID);
      if (stored && stored.trim()) return stored.trim();
    } catch {
      // fallback
    }
    return DEFAULT_INTER_GID;
  }

  /**
   * Saves the chosen tab GID
   */
  public static setLinkedTabGid(gid: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_TAB_GID, gid.trim());
    } catch (e) {
      console.warn('Could not persist linked Google Sheet GID:', e);
    }
  }

  /**
   * Retrieves the last successful sync timestamp
   */
  public static getLastSyncTimestamp(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_SYNC);
    } catch {
      return null;
    }
  }

  /**
   * Records a sync timestamp
   */
  public static setLastSyncTimestamp(isoTimestamp: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_SYNC, isoTimestamp);
    } catch (e) {
      console.warn('Could not persist sync timestamp:', e);
    }
  }

  /**
   * Fetches and parses the Leinster fixtures spreadsheet from Google Sheets
   */
  public static async fetchAndParse(
    url?: string,
    specificGid?: string
  ): Promise<{
    parsedResult: LeinsterParseResult;
    sheetName?: string;
    discoveredTabs: GoogleSheetTab[];
  }> {
    const targetUrl = (url && url.trim()) || this.getLinkedSheetUrl();
    const targetGid = specificGid !== undefined ? specificGid : this.getLinkedTabGid();

    const fetchResult = await fetchGoogleSheetContent(targetUrl, targetGid);
    const parsedResult = parseLeinsterFixturesCSV(fetchResult.csvText);

    return {
      parsedResult,
      sheetName: fetchResult.sheetName,
      discoveredTabs: fetchResult.discoveredTabs,
    };
  }

  /**
   * 1-Click Sync: Fetches the Google Sheet, parses official fixtures,
   * merges into Zustand store, and records the sync timestamp.
   */
  public static async syncToStore(
    url?: string,
    specificGid?: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<SheetSyncSummary> {
    const targetUrl = (url && url.trim()) || this.getLinkedSheetUrl();
    const targetGid = specificGid !== undefined ? specificGid : this.getLinkedTabGid();

    const { parsedResult, sheetName, discoveredTabs } = await this.fetchAndParse(
      targetUrl,
      targetGid
    );

    if (parsedResult.fixtures.length === 0) {
      throw new Error(
        'No valid match fixtures were found in the specified Google Sheet. Please check the sheet columns or selected tab.'
      );
    }

    // Persist active URL and GID
    this.setLinkedSheetUrl(targetUrl);
    if (targetGid) this.setLinkedTabGid(targetGid);

    // Apply to authoritative Zustand store
    const store = useAppStore.getState();
    const { importedCount, updatedCount, totalCount } = store.importLeinsterSeasonFixtures(
      parsedResult.fixtures,
      mode
    );

    const now = new Date().toISOString();
    this.setLastSyncTimestamp(now);

    return {
      success: true,
      importedCount,
      updatedCount,
      totalCount,
      fixtures: parsedResult.fixtures,
      rankedTeamBreakdown: parsedResult.rankedTeamBreakdown,
      discoveredTabs,
      sheetName,
      timestamp: now,
    };
  }

  /**
   * Syncs all 4 official Old Alex tabs (Inters, Minors, 1st Years, 6th Class)
   * totaling all ~119 youth fixtures across Leinster leagues in 1 click.
   */
  public static async syncAllOldAlexTabs(
    url?: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<SheetSyncSummary> {
    const targetUrl = (url && url.trim()) || this.getLinkedSheetUrl();
    const allFixtures: MatchFixture[] = [];
    const aggregatedBreakdown: Record<string, number> = {};
    let combinedDiscoveredTabs: GoogleSheetTab[] = [];

    for (const tab of PRIMARY_OLD_ALEX_TABS) {
      try {
        const { parsedResult, discoveredTabs } = await this.fetchAndParse(targetUrl, tab.gid);
        if (discoveredTabs.length > 0 && combinedDiscoveredTabs.length === 0) {
          combinedDiscoveredTabs = discoveredTabs;
        }
        allFixtures.push(...parsedResult.fixtures);
        Object.entries(parsedResult.rankedTeamBreakdown).forEach(([team, count]) => {
          aggregatedBreakdown[team] = (aggregatedBreakdown[team] || 0) + count;
        });
      } catch (tabErr) {
        console.warn(`Could not sync tab ${tab.name} (${tab.gid}):`, tabErr);
      }
    }

    if (allFixtures.length === 0) {
      throw new Error('Could not parse any fixtures from the primary Old Alex tabs.');
    }

    // Persist active URL
    this.setLinkedSheetUrl(targetUrl);

    // Apply to authoritative Zustand store
    const store = useAppStore.getState();
    const { importedCount, updatedCount, totalCount } = store.importLeinsterSeasonFixtures(
      allFixtures,
      mode
    );

    const now = new Date().toISOString();
    this.setLastSyncTimestamp(now);

    return {
      success: true,
      importedCount,
      updatedCount,
      totalCount,
      fixtures: allFixtures,
      rankedTeamBreakdown: aggregatedBreakdown,
      discoveredTabs: combinedDiscoveredTabs,
      sheetName: 'All Old Alex Squads',
      timestamp: now,
    };
  }
}

