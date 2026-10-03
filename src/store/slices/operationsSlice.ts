import { AppSliceCreator, OperationsSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { PITCH_SECTORS } from '../../data/initialData';
import {
  AgeGroup,
  AttendanceRecord,
  BlitzTournament,
  ClubWhatsAppGroup,
  FirstAidIncident,
  Player,
  SectorGearAllocation,
  SundayPrepChecklist,
} from '../../types';

export const createOperationsSlice: AppSliceCreator<OperationsSlice> = (set, get) => ({
  sectors: PITCH_SECTORS,
  checklist: [],
  sectorGear: [],
  firstAid: [],
  players: [],
  attendance: {},
  blitzTournaments: [],
  whatsAppGroups: [],

  setFirstAid: (firstAid: FirstAidIncident[]) => {
    set({ firstAid });
    persistenceAdapter.saveKey('firstAid', firstAid);
  },

  setPlayers: (players: Player[]) => {
    set({ players });
    persistenceAdapter.saveKey('players', players);
  },

  setBlitzTournaments: (blitzTournaments: BlitzTournament[]) => {
    set({ blitzTournaments });
    persistenceAdapter.saveKey('blitzTournaments', blitzTournaments);
  },

  setWhatsAppGroups: (whatsAppGroups: ClubWhatsAppGroup[]) => {
    set({ whatsAppGroups });
    persistenceAdapter.saveKey('whatsAppGroups', whatsAppGroups);
  },

  toggleChecklistItem: (itemId: string) => {
    const next = get().checklist.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    set({ checklist: next });
    persistenceAdapter.saveKey('checklist', next);
  },

  setChecklist: (items: SundayPrepChecklist[]) => {
    set({ checklist: items });
    persistenceAdapter.saveKey('checklist', items);
  },

  updateGearAllocation: (updated: SectorGearAllocation[]) => {
    set({ sectorGear: updated });
    persistenceAdapter.saveKey('sectorGear', updated);
  },

  logFirstAidIncident: (incident: FirstAidIncident) => {
    const next = [incident, ...get().firstAid];
    set({ firstAid: next });
    persistenceAdapter.saveKey('firstAid', next);
  },

  addPlayer: (player: Player) => {
    const next = [...get().players, player];
    set({ players: next });
    persistenceAdapter.saveKey('players', next);
  },

  updatePlayer: (playerId: string, updates: Partial<Player>) => {
    const next = get().players.map((p) =>
      p.id === playerId ? { ...p, ...updates } : p
    );
    set({ players: next });
    persistenceAdapter.saveKey('players', next);
  },

  deletePlayer: (playerId: string) => {
    const next = get().players.filter((p) => p.id !== playerId);
    set({ players: next });
    persistenceAdapter.saveKey('players', next);
  },

  recordPlayerAttendanceStatus: (date, ageGroupId, playerId, status, notes) => {
    const currentList = get().attendance[date] || [];
    const existingIndex = currentList.findIndex((r) => r.playerId === playerId);

    let nextDateRecords: AttendanceRecord[];
    if (existingIndex >= 0) {
      nextDateRecords = currentList.map((r, i) =>
        i === existingIndex
          ? { ...r, status, notes: notes !== undefined ? notes : r.notes }
          : r
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${date}-${playerId}`,
        date,
        ageGroupId,
        playerId,
        status,
        gearChecked: true,
        notes,
      };
      nextDateRecords = [...currentList, newRecord];
    }

    const nextAttendance = { ...get().attendance, [date]: nextDateRecords };
    set({ attendance: nextAttendance });
    persistenceAdapter.saveKey('attendance', nextAttendance);
  },

  togglePlayerGearCheck: (date, ageGroupId, playerId) => {
    const currentList = get().attendance[date] || [];
    const existing = currentList.find((r) => r.playerId === playerId);

    let nextDateRecords: AttendanceRecord[];
    if (existing) {
      nextDateRecords = currentList.map((r) =>
        r.playerId === playerId ? { ...r, gearChecked: !r.gearChecked } : r
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${date}-${playerId}`,
        date,
        ageGroupId,
        playerId,
        status: 'present',
        gearChecked: true,
      };
      nextDateRecords = [...currentList, newRecord];
    }

    const nextAttendance = { ...get().attendance, [date]: nextDateRecords };
    set({ attendance: nextAttendance });
    persistenceAdapter.saveKey('attendance', nextAttendance);
  },

  markSquadPresent: (date, ageGroupId, players) => {
    const currentList = get().attendance[date] || [];
    const squadPlayerIds = players.filter((p) => p.ageGroupId === ageGroupId).map((p) => p.id);

    const updated = squadPlayerIds.map((playerId) => {
      const existing = currentList.find((r) => r.playerId === playerId);
      if (existing) {
        return { ...existing, status: 'present' as const };
      }
      return {
        id: `att-${date}-${playerId}`,
        date,
        ageGroupId,
        playerId,
        status: 'present' as const,
        gearChecked: true,
      };
    });

    const otherRecords = currentList.filter((r) => !squadPlayerIds.includes(r.playerId));
    const nextDateRecords = [...otherRecords, ...updated];
    const nextAttendance = { ...get().attendance, [date]: nextDateRecords };
    set({ attendance: nextAttendance });
    persistenceAdapter.saveKey('attendance', nextAttendance);
  },

  bulkVerifySquadGear: (date, ageGroupId, players) => {
    const currentList = get().attendance[date] || [];
    const squadPlayerIds = players.filter((p) => p.ageGroupId === ageGroupId).map((p) => p.id);

    const updated = squadPlayerIds.map((playerId) => {
      const existing = currentList.find((r) => r.playerId === playerId);
      if (existing) {
        return { ...existing, gearChecked: true };
      }
      return {
        id: `att-${date}-${playerId}`,
        date,
        ageGroupId,
        playerId,
        status: 'present' as const,
        gearChecked: true,
      };
    });

    const otherRecords = currentList.filter((r) => !squadPlayerIds.includes(r.playerId));
    const nextDateRecords = [...otherRecords, ...updated];
    const nextAttendance = { ...get().attendance, [date]: nextDateRecords };
    set({ attendance: nextAttendance });
    persistenceAdapter.saveKey('attendance', nextAttendance);
  },

  saveBlitzTournament: (tournament: BlitzTournament) => {
    const existing = get().blitzTournaments.filter((t) => t.id !== tournament.id);
    const next = [tournament, ...existing];
    set({ blitzTournaments: next });
    persistenceAdapter.saveKey('blitzTournaments', next);
  },

  updateWhatsAppGroup: (id, updates) => {
    const next = get().whatsAppGroups.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    );
    set({ whatsAppGroups: next });
    persistenceAdapter.saveKey('whatsAppGroups', next);
  },
});
