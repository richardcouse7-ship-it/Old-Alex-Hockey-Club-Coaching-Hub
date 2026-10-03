export type Pathway = 'Foundation' | 'Development' | 'Youth Performance';

export type AgeGroup =
  | 'PEN'
  | '1st Class'
  | '2nd Class'
  | '3rd Class'
  | '4th Class'
  | '5th Class'
  | '6th Class'
  | '1st Years'
  | 'Minors'
  | 'Inters';

export interface Coach {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  accentColor: string;
  initials: string;
  isActive: boolean;
}

export interface PitchSector {
  id: string;
  code: 'P1N' | 'P1S' | 'P2N' | 'P2S' | 'Pitch 3';
  name: string;
  description: string;
  pitch: 'Pitch 1' | 'Pitch 2' | 'Pitch 3';
  side: 'North' | 'South' | 'Full';
}

export interface DrillDiagramElement {
  type: 'player' | 'defender' | 'ball' | 'cone' | 'goal' | 'ladder' | 'pass_arrow' | 'run_arrow' | 'label';
  x: number;
  y: number;
  label?: string;
  toX?: number;
  toY?: number;
  color?: string;
}

export interface Drill {
  id: string;
  title: string;
  pathway: Pathway;
  skill: string;
  durationMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  targetAgeGroups: AgeGroup[];
  setup: string;
  instructions: string;
  coachingPoints: string[];
  equipment: string[];
  diagramElements?: DrillDiagramElement[];
  diagramDescription?: string;
  animationFrames?: DrillAnimationFrame[];
}

export interface DrillAnimationFrame {
  id: string;
  frameNumber: number;
  title: string;
  description?: string;
  durationSeconds?: number;
  elements: DrillDiagramElement[];
}

export interface SessionSlot {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:45–12:00"
  startTime: string; // e.g. "10:45"
  endTime: string; // e.g. "12:00"
  pitchSectorId: string;
  ageGroupId: AgeGroup;
  pathway: Pathway;
  assignedCoachIds: string[];
  sessionTitle: string;
  sessionPurpose: string;
  coachNotes: string;
  attachedDrillIds: string[];
  drillIds?: string[];
  keyFocus?: string;
  externalPlanUrl?: string;
  externalPlanTitle?: string;
  runningOrder?: {
    activity: string;
    durationMins: number;
    notes?: string;
  }[];
  equipmentChecklist: {
    item: string;
    checked: boolean;
  }[];
  status: 'Ready' | 'Needs Coach' | 'Needs Plan' | 'Conflict';
  postSessionReflection?: {
    whatWorked: string;
    whatToChangeNextSunday: string;
    priorityForNextWeek: string;
  };
  isAway?: boolean;
  venueName?: string;
  opposition?: string;
  meetTime?: string;
  fixtureId?: string;
  transportNotes?: string;
}

export interface ScheduleConflict {
  id: string;
  type: 'COACH_DOUBLE_BOOKED' | 'PITCH_OVERBOOKED' | 'NO_COACH_ASSIGNED';
  severity: 'high' | 'medium';
  title: string;
  description: string;
  slotIds: string[];
  timeSlot: string;
  affectedCoachId?: string;
  affectedPitchSectorId?: string;
}

export interface SundayPrepChecklist {
  id: string;
  label: string;
  category: 'logistics' | 'equipment' | 'coaches' | 'drills';
  checked: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'pitch_change' | 'coach_sub' | 'schedule_update' | 'urgent';
  read: boolean;
  slotId?: string;
  date: string;
}

export interface PathwayRoadmapItem {
  ageGroup: AgeGroup;
  pathway: Pathway;
  seasonOutcome: string;
  technicalFocus: string;
  tacticalFocus: string;
  gameUnderstanding: string;
  personalHabit: string;
  checkpoint: string;
}

export type CoachAvailabilityStatus =
  | 'AVAILABLE'
  | 'MORNING_ONLY'
  | 'AFTERNOON_ONLY'
  | 'SENIOR_MATCH'
  | 'AWAY';

export interface CoachAvailability {
  id: string;
  coachId: string;
  coachName: string;
  date: string;
  status: CoachAvailabilityStatus;
  preferredAgeGroup?: AgeGroup;
  notes?: string;
  source: 'google_form' | 'direct' | 'whatsapp_link';
  submittedAt: string;
}

export interface MatchFixture {
  id: string;
  date: string;
  pushbackTime: string;
  ageGroupOrTeam: string;
  competition: string; // e.g. 'Leinster League', 'EYHL Division 1', 'Leinster Cup', 'Friendly Blitz'
  opposition: string;
  isHome: boolean;
  venue: string;
  pitchSectorId?: string; // e.g. 'p1n', 'p1s', or 'p1-full'
  leadCoachOrManager: string;
  umpires: string[];
  notes?: string;
  result?: string;
  homeScore?: number;
  awayScore?: number;
  goalscorers?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Postponed';
}

export type WhatsAppTemplateType =
  | 'full_timetable'
  | 'coach_briefing'
  | 'parent_update'
  | 'matchday_squad'
  | 'availability_callout';

export interface SectorGearAllocation {
  id: string;
  sectorId: string;
  sectorCode: string;
  assignedAgeGroup: string;
  ballBagNumber: string;
  bibColor: string;
  conesCount: number;
  miniGoalsCount: number;
  laddersCount: number;
  checkedOutBy: string;
  isReturned: boolean;
  notes?: string;
}

export interface FirstAidIncident {
  id: string;
  date: string;
  time: string;
  ageGroupId: AgeGroup;
  pitchSectorId: string;
  playerName: string;
  incidentType:
    | 'Sprain / Twist'
    | 'Stick Strike'
    | 'Ball Contact'
    | 'Cut / Abrasion'
    | 'Head Knock (HIA Precaution)'
    | 'Other';
  treatment: string;
  parentNotified: boolean;
  loggedByCoach: string;
}

export interface SundayMasterTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  pitchCoverage: string;
  focusSummary: string;
  isCustom?: boolean;
  slots: Omit<SessionSlot, 'id' | 'date'>[];
}

export interface ClubWhatsAppGroup {
  id: string;
  name: string;
  category: 'coaches' | 'parents' | 'fixtures' | 'safety' | 'general';
  ageGroupId?: AgeGroup;
  inviteLink?: string; // e.g. https://chat.whatsapp.com/...
  leadContactPhone?: string;
  leadContactName?: string;
  notes?: string;
}

export interface Player {
  id: string;
  name: string;
  ageGroupId: AgeGroup;
  parentName: string;
  parentPhone: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  ageGroupId: AgeGroup;
  playerId: string;
  status: 'present' | 'absent' | 'injured' | 'late';
  gearChecked: boolean; // mouthguard + shinguards confirmed
  notes?: string;
}

export interface BlitzTeam {
  id: string;
  name: string;
  color: string; // e.g. '#dc2626'
  coachName?: string;
}

export interface BlitzMatch {
  id: string;
  roundNumber: number;
  pitchSectorId: string; // 'sector-a', 'sector-b', etc.
  pitchSectorLabel: string; // 'Sector A (SW)', 'Sector B (NW)', etc.
  scheduledTime: string; // '10:00'
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: 'Scheduled' | 'Playing' | 'Completed';
}

export interface BlitzTournament {
  id: string;
  title: string;
  date: string;
  ageGroup: string; // e.g. '1st Class', 'Super 7s'
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  startTime: string; // '09:30'
  teams: BlitzTeam[];
  matches: BlitzMatch[];
  isCompleted: boolean;
  notes?: string;
}

export interface BlitzStanding {
  teamId: string;
  teamName: string;
  teamColor: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
export interface GoogleAuthStatus {
  isSignedIn: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
}

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

export interface HubBackupData {
  version: string;
  exportedAt: string;
  director: string;
  slots: SessionSlot[];
  drills: Drill[];
  coaches: Coach[];
  availability: CoachAvailability[];
  sectorGear: SectorGearAllocation[];
  firstAid: FirstAidIncident[];
  fixtures: MatchFixture[];
  players?: Player[];
  whatsAppGroups?: ClubWhatsAppGroup[];
  checklist?: SundayPrepChecklist[];
  blitzTournaments?: BlitzTournament[];
}
