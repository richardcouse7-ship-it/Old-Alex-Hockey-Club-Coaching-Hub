import {
  COACHES,
  DRILLS,
  INITIAL_COACH_AVAILABILITY,
  INITIAL_FIRST_AID,
  INITIAL_FIXTURES,
  INITIAL_PREP_CHECKLIST,
  INITIAL_SECTOR_GEAR,
  INITIAL_SESSION_SLOTS,
  PITCH_SECTORS,
} from '../../data/initialData';
import { PREBUILT_SUNDAY_TEMPLATES } from '../../data/sundayMasterTemplates';
import {
  Coach,
  CoachAvailability,
  Drill,
  FirstAidIncident,
  MatchFixture,
  Player,
  SectorGearAllocation,
  SessionSlot,
  SundayMasterTemplate,
  SundayPrepChecklist,
  ClubWhatsAppGroup,
  BlitzTournament,
} from '../../types';
import { normalizeAwaySlot } from '../../utils/awayFixtureUtils';

export const STORAGE_KEYS = {
  SLOTS: 'oldalex_session_slots_v2',
  DRILLS: 'oldalex_drills_v1',
  COACHES: 'oldalex_coaches_v2',
  CHECKLIST: 'oldalex_prep_checklist_v1',
  NOTIFICATIONS: 'oldalex_notifications_v1',
  OFFLINE_SIM: 'oldalex_offline_sim_mode',
  AVAILABILITY: 'oldalex_coach_availability_v2',
  GEAR: 'oldalex_sector_gear_v2',
  FIRST_AID: 'oldalex_first_aid_v2',
  DIRECTOR_UNLOCKED: 'oldalex_director_unlocked_v1',
  DIRECTOR_PIN: 'oldalex_director_pin_v1',
  FIXTURES: 'oldalex_fixtures_v2',
  CUSTOM_TEMPLATES: 'oldalex_custom_sunday_templates_v1',
  WHATSAPP_GROUPS: 'oldalex_whatsapp_groups_v1',
  PLAYERS: 'oldalex_players_v2',
  ATTENDANCE: 'oldalex_attendance_v2',
  BLITZ_TOURNAMENTS: 'oldalex_blitz_tournaments_v2',
  SUN_MODE: 'oldalex_sun_mode_v1',
  SIDEBAR_COLLAPSED: 'oldalex_sidebar_collapsed_v1',
  SELECTED_DATE: 'oldalex_selected_date_v2',
} as const;

/**
 * Safely parse JSON from localStorage with fallback
 */
export function safeGetStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return defaultValue;
    return parsed as T;
  } catch (err) {
    console.warn(`[PersistenceMigration] Safe fallback triggered for key: ${key}`, err);
    return defaultValue;
  }
}

/**
 * Safely write JSON to localStorage
 */
export function safeSetStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[PersistenceMigration] LocalStorage write failed for key: ${key}`, err);
  }
}

/**
 * Non-destructive merge helper to sync existing coaches with master roster.
 * Preserves existing coach modifications, assigned slots, and availability records.
 */
export function syncWithMasterRoster(existingCoaches: Coach[], masterCoaches: Coach[]): Coach[] {
  // Normalize coach name for duplicate detection, including known aliases
  const normalizeKey = (name: string): string => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed === 'daisy dillon mansfield' || trimmed === 'daisy dillon malone') {
      return 'daisy dillon';
    }
    return trimmed;
  };

  const existingMap = new Map(existingCoaches.map((c) => [normalizeKey(c.name), c]));
  const merged = [...existingCoaches];

  for (const master of masterCoaches) {
    const key = normalizeKey(master.name);
    if (!existingMap.has(key)) {
      merged.push(master);
      existingMap.set(key, master);
    }
  }
  return merged;
}


/**
 * Defensive migration and fallback validator for initial store load.
 * Guarantees existing user data wins while ensuring malformed payloads never crash startup.
 */
export function loadValidatedDomainData() {
  const slots = safeGetStorage<SessionSlot[]>(STORAGE_KEYS.SLOTS, INITIAL_SESSION_SLOTS);
  const storedCoaches = safeGetStorage<Coach[]>(STORAGE_KEYS.COACHES, COACHES);
  const coaches = Array.isArray(storedCoaches)
    ? syncWithMasterRoster(storedCoaches, COACHES)
    : COACHES;
  
  // Drills: Merge any newly shipped club curriculum drills while preserving existing modifications
  const storedDrills = safeGetStorage<Drill[]>(STORAGE_KEYS.DRILLS, DRILLS);
  const missingDrills = DRILLS.filter((d) => !storedDrills.some((s) => s.id === d.id));
  const drills = missingDrills.length > 0 ? [...storedDrills, ...missingDrills] : storedDrills;

  const checklist = safeGetStorage<SundayPrepChecklist[]>(STORAGE_KEYS.CHECKLIST, INITIAL_PREP_CHECKLIST);
  const availability = safeGetStorage<CoachAvailability[]>(STORAGE_KEYS.AVAILABILITY, INITIAL_COACH_AVAILABILITY);
  const sectorGear = safeGetStorage<SectorGearAllocation[]>(STORAGE_KEYS.GEAR, INITIAL_SECTOR_GEAR);
  const firstAid = safeGetStorage<FirstAidIncident[]>(STORAGE_KEYS.FIRST_AID, INITIAL_FIRST_AID);
  const fixtures = safeGetStorage<MatchFixture[]>(STORAGE_KEYS.FIXTURES, INITIAL_FIXTURES);
  const customTemplates = safeGetStorage<SundayMasterTemplate[]>(STORAGE_KEYS.CUSTOM_TEMPLATES, []);
  const blitzTournaments = safeGetStorage<BlitzTournament[]>(STORAGE_KEYS.BLITZ_TOURNAMENTS, []);
  const whatsAppGroups = safeGetStorage<ClubWhatsAppGroup[]>(STORAGE_KEYS.WHATSAPP_GROUPS, []);
  const players = safeGetStorage<Player[]>(STORAGE_KEYS.PLAYERS, []);
  const attendance = safeGetStorage<Record<string, any>>(STORAGE_KEYS.ATTENDANCE, {});

  // Preferences
  const isSunMode = safeGetStorage<boolean>(STORAGE_KEYS.SUN_MODE, false);
  const isSidebarCollapsed = safeGetStorage<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  const isSimulatingOffline = safeGetStorage<boolean>(STORAGE_KEYS.OFFLINE_SIM, false);
  const isDirectorUnlocked = safeGetStorage<boolean>(STORAGE_KEYS.DIRECTOR_UNLOCKED, false);
  const directorPin = safeGetStorage<string>(STORAGE_KEYS.DIRECTOR_PIN, '1893');

  return {
    slots: Array.isArray(slots) ? slots.map(normalizeAwaySlot) : INITIAL_SESSION_SLOTS.map(normalizeAwaySlot),
    coaches: Array.isArray(coaches) ? coaches : COACHES,
    drills: Array.isArray(drills) ? drills : DRILLS,
    checklist: Array.isArray(checklist) ? checklist : INITIAL_PREP_CHECKLIST,
    availability: Array.isArray(availability) ? availability : INITIAL_COACH_AVAILABILITY,
    sectorGear: Array.isArray(sectorGear) ? sectorGear : INITIAL_SECTOR_GEAR,
    firstAid: Array.isArray(firstAid) ? firstAid : INITIAL_FIRST_AID,
    fixtures: Array.isArray(fixtures) ? fixtures : INITIAL_FIXTURES,
    customSundayTemplates: Array.isArray(customTemplates) ? customTemplates : [],
    blitzTournaments: Array.isArray(blitzTournaments) ? blitzTournaments : [],
    whatsAppGroups: Array.isArray(whatsAppGroups) ? whatsAppGroups : [],
    players: Array.isArray(players) ? players : [],
    attendance: typeof attendance === 'object' && attendance !== null ? attendance : {},
    sectors: PITCH_SECTORS,
    isSunMode: Boolean(isSunMode),
    isSidebarCollapsed: Boolean(isSidebarCollapsed),
    isSimulatingOffline: Boolean(isSimulatingOffline),
    isDirectorUnlocked: Boolean(isDirectorUnlocked),
    directorPin: String(directorPin || '1893'),
  };
}
