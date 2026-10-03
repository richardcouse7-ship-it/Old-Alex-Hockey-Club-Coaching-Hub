import { StateCreator } from 'zustand';
import {
  AgeGroup,
  AppNotification,
  AttendanceRecord,
  BlitzTournament,
  ClubWhatsAppGroup,
  Coach,
  CoachAvailability,
  Drill,
  FirstAidIncident,
  MatchFixture,
  PitchSector,
  Player,
  ScheduleConflict,
  SectorGearAllocation,
  SessionSlot,
  SundayMasterTemplate,
  SundayPrepChecklist,
} from '../types';

export type ActiveModalType =
  | 'add_slot'
  | 'report'
  | 'broadcast'
  | 'notifications_drawer'
  | 'tactical_studio'
  | 'tactical_animator'
  | 'director_pack'
  | 'pitch_companion'
  | 'export_hub'
  | 'calendar_manager'
  | 'emergency_safety'
  | 'schedule_import'
  | 'google_sync'
  | 'quick_score'
  | 'bulk_timings'
  | 'master_templates'
  | 'whatsapp_export'
  | null;

// ==========================================
// 1. SLOTS SLICE
// ==========================================
export interface SlotsSlice {
  slots: SessionSlot[];
  customSundayTemplates: SundayMasterTemplate[];

  // Domain Actions
  addSlot: (slot: SessionSlot) => void;
  updateSlot: (slot: SessionSlot) => void;
  deleteSlot: (slotId: string) => void;
  assignCoachToSlot: (slotId: string, coachId: string) => void;
  removeCoachFromSlot: (slotId: string, coachId: string) => void;
  shiftTimings: (date: string, deltaMinutes: number) => void;
  duplicateSchedule: (sourceDate: string, targetDate: string) => void;
  deleteSlotsByDate: (date: string) => void;
  applyMasterTemplate: (newSlots: SessionSlot[]) => void;
  setSlots: (slots: SessionSlot[]) => void;
  saveCustomTemplate: (template: SundayMasterTemplate) => void;
  deleteCustomTemplate: (templateId: string) => void;
}

// ==========================================
// 2. COACHES SLICE
// ==========================================
export interface CoachesSlice {
  coaches: Coach[];
  availability: CoachAvailability[];

  // Domain Actions
  setCoaches: (coaches: Coach[]) => void;
  addCoach: (coach: Coach) => void;
  updateCoach: (coach: Coach) => void;
  deleteCoaches: (coachIds: string[]) => void;
  setAvailability: (availability: CoachAvailability[]) => void;
  updateAvailabilityStatus: (
    coachId: string,
    date: string,
    status: CoachAvailability['status'],
    notes?: string
  ) => void;
  importAvailabilityFromForm: (rawText: string, targetDate: string) => void;
  autoAssignCoachesToDate: (date: string) => number;
}

// ==========================================
// 3. DRILLS SLICE
// ==========================================
export interface DrillsSlice {
  drills: Drill[];

  // Domain Actions
  setDrills: (drills: Drill[]) => void;
  addDrill: (drill: Drill) => void;
  updateDrill: (drill: Drill) => void;
  deleteDrill: (drillId: string) => void;
}

// ==========================================
// 4. FIXTURES SLICE
// ==========================================
export interface FixturesSlice {
  fixtures: MatchFixture[];

  // Domain Actions
  setFixtures: (fixtures: MatchFixture[]) => void;
  addFixture: (fixture: MatchFixture) => void;
  updateFixture: (fixture: MatchFixture) => void;
  recordMatchResult: (
    fixtureId: string,
    homeScore: number,
    awayScore: number,
    scorers?: string
  ) => void;
}

// ==========================================
// 5. OPERATIONS SLICE (Players, Attendance, Gear, First Aid, Blitz, Checklist, Groups)
// ==========================================
export interface OperationsSlice {
  sectors: PitchSector[];
  checklist: SundayPrepChecklist[];
  sectorGear: SectorGearAllocation[];
  firstAid: FirstAidIncident[];
  players: Player[];
  attendance: Record<string, AttendanceRecord[]>;
  blitzTournaments: BlitzTournament[];
  whatsAppGroups: ClubWhatsAppGroup[];

  // Domain Actions
  setFirstAid: (firstAid: FirstAidIncident[]) => void;
  setPlayers: (players: Player[]) => void;
  setBlitzTournaments: (tournaments: BlitzTournament[]) => void;
  setWhatsAppGroups: (groups: ClubWhatsAppGroup[]) => void;
  toggleChecklistItem: (itemId: string) => void;
  setChecklist: (items: SundayPrepChecklist[]) => void;
  updateGearAllocation: (updated: SectorGearAllocation[]) => void;
  logFirstAidIncident: (incident: FirstAidIncident) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  deletePlayer: (playerId: string) => void;
  recordPlayerAttendanceStatus: (
    date: string,
    ageGroupId: AgeGroup,
    playerId: string,
    status: AttendanceRecord['status'],
    notes?: string
  ) => void;
  togglePlayerGearCheck: (
    date: string,
    ageGroupId: AgeGroup,
    playerId: string
  ) => void;
  markSquadPresent: (
    date: string,
    ageGroupId: AgeGroup,
    players: Player[]
  ) => void;
  bulkVerifySquadGear: (
    date: string,
    ageGroupId: AgeGroup,
    players: Player[]
  ) => void;
  saveBlitzTournament: (tournament: BlitzTournament) => void;
  updateWhatsAppGroup: (
    id: string,
    updates: Partial<ClubWhatsAppGroup>
  ) => void;
}

// ==========================================
// 6. NAVIGATION SLICE
// ==========================================
export interface NavigationSlice {
  currentTab: string;
  selectedDate: string;

  // Domain Actions
  setCurrentTab: (tab: string) => void;
  setSelectedDate: (date: string) => void;
}

// ==========================================
// 7. UI & MODAL SLICE
// ==========================================
export interface UiSlice {
  selectedSlotId: string | null;
  activeModal: ActiveModalType;
  modalPayload: Record<string, unknown> | null;
  notifications: AppNotification[];
  toastMessage: string | null;
  mobileSidebarOpen: boolean;

  // Domain Actions
  setSelectedSlotId: (slotId: string | null) => void;
  openModal: (modal: ActiveModalType, payload?: Record<string, unknown>) => void;
  closeModal: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  triggerNotification: (
    title: string,
    message: string,
    type: AppNotification['type'],
    slotId?: string
  ) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
}

// ==========================================
// 8. PREFERENCES SLICE
// ==========================================
export interface PreferencesSlice {
  isSunMode: boolean;
  isSidebarCollapsed: boolean;
  isSimulatingOffline: boolean;
  isDirectorUnlocked: boolean;
  directorPin: string;

  // Domain Actions
  toggleSunMode: () => void;
  toggleSidebarCollapse: () => void;
  toggleOfflineSim: () => void;
  unlockDirector: (pin: string) => boolean;
  lockDirector: () => void;
  setDirectorUnlocked: (unlocked: boolean) => void;
  setDirectorPin: (newPin: string) => void;
}

// ==========================================
// FULL APPLICATION STORE TYPE
// ==========================================
export type AppState = SlotsSlice &
  CoachesSlice &
  DrillsSlice &
  FixturesSlice &
  OperationsSlice &
  NavigationSlice &
  UiSlice &
  PreferencesSlice;

export type AppSliceCreator<T> = StateCreator<AppState, [], [], T>;
