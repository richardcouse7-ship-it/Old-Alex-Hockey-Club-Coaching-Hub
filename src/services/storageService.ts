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
} from '../data/initialData';
import { PREBUILT_SUNDAY_TEMPLATES } from '../data/sundayMasterTemplates';
import {
  Coach,
  CoachAvailability,
  CoachAvailabilityStatus,
  Drill,
  FirstAidIncident,
  MatchFixture,
  PitchSector,
  ScheduleConflict,
  SectorGearAllocation,
  SessionSlot,
  SundayMasterTemplate,
  SundayPrepChecklist,
  ClubWhatsAppGroup,
  AgeGroup,
  Player,
  AttendanceRecord,
  BlitzTournament,
  HubBackupData,
} from '../types';

const STORAGE_KEYS = {
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
};

// Purge any old v1 placeholder data leftover in browser localStorage
function purgeLeftoverPlaceholderData(): void {
  try {
    const isPurged = localStorage.getItem('oldalex_placeholders_purged_v2');
    if (!isPurged) {
      const v1Keys = [
        'oldalex_session_slots_v1',
        'oldalex_coaches_v1',
        'oldalex_fixtures_v1',
        'oldalex_first_aid_v1',
        'oldalex_players_v1',
        'oldalex_coach_availability_v1',
        'oldalex_sector_gear_v1',
        'oldalex_attendance_v1',
        'oldalex_blitz_tournaments_v1',
      ];
      v1Keys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('oldalex_placeholders_purged_v2', 'true');
    }
  } catch {
    // LocalStorage unavailable in SSR or restricted iframe
  }
}
purgeLeftoverPlaceholderData();

// Safe JSON parse from localStorage
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

export const StorageService = {
  getSlots(): SessionSlot[] {
    return getStorage<SessionSlot[]>(STORAGE_KEYS.SLOTS, INITIAL_SESSION_SLOTS);
  },

  saveSlots(slots: SessionSlot[]): void {
    setStorage(STORAGE_KEYS.SLOTS, slots);
  },

  getDrills(): Drill[] {
    const stored = getStorage<Drill[]>(STORAGE_KEYS.DRILLS, DRILLS);
    const missing = DRILLS.filter((d) => !stored.some((s) => s.id === d.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setStorage(STORAGE_KEYS.DRILLS, merged);
      return merged;
    }
    return stored;
  },

  saveDrills(drills: Drill[]): void {
    setStorage(STORAGE_KEYS.DRILLS, drills);
  },

  getCoaches(): Coach[] {
    return getStorage<Coach[]>(STORAGE_KEYS.COACHES, COACHES);
  },

  saveCoaches(coaches: Coach[]): void {
    setStorage(STORAGE_KEYS.COACHES, coaches);
  },

  getChecklist(): SundayPrepChecklist[] {
    return getStorage<SundayPrepChecklist[]>(
      STORAGE_KEYS.CHECKLIST,
      INITIAL_PREP_CHECKLIST
    );
  },

  saveChecklist(items: SundayPrepChecklist[]): void {
    setStorage(STORAGE_KEYS.CHECKLIST, items);
  },

  getOfflineSimMode(): boolean {
    return getStorage<boolean>(STORAGE_KEYS.OFFLINE_SIM, false);
  },

  setOfflineSimMode(simulatingOffline: boolean): void {
    setStorage(STORAGE_KEYS.OFFLINE_SIM, simulatingOffline);
  },

  /**
   * Detects scheduling conflicts:
   * 1. Coach assigned to 2 different slots at the exact same time
   * 2. Pitch sector assigned to 2 different groups at the exact same time
   * 3. Slot has 0 coaches assigned
   */
  detectConflicts(slots: SessionSlot[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Group slots by timeSlot
    const slotsByTime: Record<string, SessionSlot[]> = {};
    for (const slot of slots) {
      if (!slotsByTime[slot.timeSlot]) {
        slotsByTime[slot.timeSlot] = [];
      }
      slotsByTime[slot.timeSlot].push(slot);
    }

    // 1. Check for unassigned coaches
    for (const slot of slots) {
      if (slot.assignedCoachIds.length === 0) {
        conflicts.push({
          id: `conflict-unassigned-${slot.id}`,
          type: 'NO_COACH_ASSIGNED',
          severity: 'high',
          title: `Uncovered Slot: ${slot.ageGroupId}`,
          description: `No coach assigned for ${slot.ageGroupId} at ${slot.timeSlot} on ${slot.pitchSectorId.toUpperCase()}.`,
          slotIds: [slot.id],
          timeSlot: slot.timeSlot,
          affectedPitchSectorId: slot.pitchSectorId,
        });
      }
    }

    // 2. Check for coach double-booking in the same time slot
    for (const [timeSlot, timeSlotsList] of Object.entries(slotsByTime)) {
      const coachOccurrenceMap: Record<string, string[]> = {};

      for (const slot of timeSlotsList) {
        for (const coachId of slot.assignedCoachIds) {
          if (!coachOccurrenceMap[coachId]) {
            coachOccurrenceMap[coachId] = [];
          }
          coachOccurrenceMap[coachId].push(slot.id);
        }
      }

      for (const [coachId, assignedSlotIds] of Object.entries(coachOccurrenceMap)) {
        if (assignedSlotIds.length > 1) {
          const coach = COACHES.find((c) => c.id === coachId);
          conflicts.push({
            id: `conflict-coach-${coachId}-${timeSlot}`,
            type: 'COACH_DOUBLE_BOOKED',
            severity: 'high',
            title: `Double-Booked Coach: ${coach?.name || 'Coach'}`,
            description: `${coach?.name || 'Coach'} is scheduled simultaneously for ${assignedSlotIds.length} different sessions during ${timeSlot}.`,
            slotIds: assignedSlotIds,
            timeSlot,
            affectedCoachId: coachId,
          });
        }
      }

      // 3. Check for pitch sector double-booking in the same time slot
      const sectorOccurrenceMap: Record<string, string[]> = {};
      for (const slot of timeSlotsList) {
        if (!sectorOccurrenceMap[slot.pitchSectorId]) {
          sectorOccurrenceMap[slot.pitchSectorId] = [];
        }
        sectorOccurrenceMap[slot.pitchSectorId].push(slot.id);
      }

      for (const [sectorId, assignedSlotIds] of Object.entries(sectorOccurrenceMap)) {
        if (assignedSlotIds.length > 1) {
          const sector = PITCH_SECTORS.find((p) => p.id === sectorId);
          conflicts.push({
            id: `conflict-sector-${sectorId}-${timeSlot}`,
            type: 'PITCH_OVERBOOKED',
            severity: 'high',
            title: `Pitch Sector Conflict: ${sector?.code || sectorId}`,
            description: `Multiple age groups scheduled on ${sector?.name || sectorId} at ${timeSlot}.`,
            slotIds: assignedSlotIds,
            timeSlot,
            affectedPitchSectorId: sectorId,
          });
        }
      }
    }

    return conflicts;
  },

  /**
   * Calculate pitch sector utilization
   */
  calculateUtilization(slots: SessionSlot[], sectors: PitchSector[]) {
    // Standard Sunday timetable has 4 time slots
    const totalStandardSlotsPerSector = 4;

    const sectorStats = sectors.map((sector) => {
      const occupiedSlots = slots.filter(
        (s) => s.pitchSectorId.toLowerCase() === sector.id.toLowerCase()
      ).length;

      const percentage = Math.min(
        100,
        Math.round((occupiedSlots / totalStandardSlotsPerSector) * 100)
      );

      return {
        sectorId: sector.id,
        sectorCode: sector.code,
        sectorName: sector.name,
        occupiedSlots,
        totalSlots: totalStandardSlotsPerSector,
        percentage,
      };
    });

    const totalOccupied = sectorStats.reduce((sum, s) => sum + s.occupiedSlots, 0);
    const totalPossible = sectorStats.length * totalStandardSlotsPerSector;
    const overallPercentage = Math.round((totalOccupied / totalPossible) * 100);

    return {
      sectorStats,
      totalOccupied,
      totalPossible,
      overallPercentage,
    };
  },

  /**
   * Generate clean WhatsApp formatted copy
   */
  generateWhatsAppCopy(
    dateStr: string,
    slots: SessionSlot[],
    coaches: Coach[],
    sectors: PitchSector[]
  ): string {
    const formattedDate = new Date(dateStr).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Group by time
    const timeSlots = Array.from(new Set(slots.map((s) => s.timeSlot))).sort();

    let output = `🏑 *OLD ALEX HOCKEY CLUB — SUNDAY COACHING TIMETABLE*\n`;
    output += `📅 *${formattedDate}* | Milltown Pitches\n\n`;

    for (const timeSlot of timeSlots) {
      output += `⏰ *${timeSlot}*\n`;
      const slotItems = slots.filter((s) => s.timeSlot === timeSlot);

      for (const slot of slotItems) {
        const sector = sectors.find((p) => p.id === slot.pitchSectorId);
        const assignedCoaches = slot.assignedCoachIds
          .map((id) => coaches.find((c) => c.id === id)?.name || id)
          .join(', ');

        output += `• *${sector?.code || slot.pitchSectorId}* | ${slot.ageGroupId} (${slot.pathway})\n`;
        output += `   👤 Coaches: ${assignedCoaches || '⚠️ TBC'}\n`;
        output += `   🎯 Focus: ${slot.sessionTitle}\n`;
      }
      output += `\n`;
    }

    output += `📋 *COACHING REMINDERS:*\n`;
    output += `1. Arrive 15 mins prior to slot for pitch setup & cone marking\n`;
    output += `2. Mouthguards & shinguards mandatory for all players\n`;
    output += `3. Return balls, bibs, and agility ladders to the main gear shed\n`;
    output += `4. Log your post-session notes in the Old Alex Hub\n\n`;
    output += `_Shared from Old Alex Hockey Club Coaching Hub_`;

    return output;
  },

  /**
   * Export Monthly Summary Report as CSV
   */
  exportMonthlyReportCSV(slots: SessionSlot[], coaches: Coach[], sectors: PitchSector[]): string {
    const headers = [
      'Date',
      'Time Slot',
      'Pitch Sector',
      'Age Group',
      'Pathway',
      'Assigned Coaches',
      'Session Title',
      'Status',
    ];

    const rows = slots.map((s) => {
      const sector = sectors.find((p) => p.id === s.pitchSectorId)?.name || s.pitchSectorId;
      const coachNames = s.assignedCoachIds
        .map((cid) => coaches.find((c) => c.id === cid)?.name || cid)
        .join('; ');

      return [
        `"${s.date}"`,
        `"${s.timeSlot}"`,
        `"${sector}"`,
        `"${s.ageGroupId}"`,
        `"${s.pathway}"`,
        `"${coachNames}"`,
        `"${s.sessionTitle.replace(/"/g, '""')}"`,
        `"${s.status}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  getAvailability(): CoachAvailability[] {
    return getStorage<CoachAvailability[]>(
      STORAGE_KEYS.AVAILABILITY,
      INITIAL_COACH_AVAILABILITY as unknown as CoachAvailability[]
    );
  },

  saveAvailability(list: CoachAvailability[]): void {
    setStorage(STORAGE_KEYS.AVAILABILITY, list);
  },

  getSectorGear(): SectorGearAllocation[] {
    return getStorage<SectorGearAllocation[]>(
      STORAGE_KEYS.GEAR,
      INITIAL_SECTOR_GEAR as unknown as SectorGearAllocation[]
    );
  },

  saveSectorGear(list: SectorGearAllocation[]): void {
    setStorage(STORAGE_KEYS.GEAR, list);
  },

  getFirstAid(): FirstAidIncident[] {
    return getStorage<FirstAidIncident[]>(
      STORAGE_KEYS.FIRST_AID,
      INITIAL_FIRST_AID as unknown as FirstAidIncident[]
    );
  },

  saveFirstAid(list: FirstAidIncident[]): void {
    setStorage(STORAGE_KEYS.FIRST_AID, list);
  },

  getDirectorUnlocked(): boolean {
    return getStorage<boolean>(STORAGE_KEYS.DIRECTOR_UNLOCKED, false);
  },

  setDirectorUnlocked(unlocked: boolean): void {
    setStorage(STORAGE_KEYS.DIRECTOR_UNLOCKED, unlocked);
  },

  /**
   * Parse responses pasted from Google Forms / Google Sheets CSV/TSV
   * Format typically: Timestamp | Coach Name | Availability Status | Notes
   */
  importGoogleFormResponses(rawText: string, targetDate: string): CoachAvailability[] {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const existing = this.getAvailability();
    const coaches = this.getCoaches();
    const imported: CoachAvailability[] = [];

    for (const line of lines) {
      // split by comma or tab
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length < 2) continue;

      // check if header row
      const firstCol = parts[0].toLowerCase();
      if (firstCol.includes('timestamp') || firstCol.includes('date') || firstCol.includes('name')) {
        continue;
      }

      // Handle common Google Forms columns: [Timestamp, Coach Name, Status, Notes]
      let coachName = '';
      let rawStatus = '';
      let notes = '';

      if (parts.length >= 3) {
        coachName = parts[1].replace(/["']/g, '').trim();
        rawStatus = parts[2].replace(/["']/g, '').trim();
        notes = parts[3] ? parts.slice(3).join(', ').replace(/["']/g, '').trim() : '';
      } else {
        coachName = parts[0].replace(/["']/g, '').trim();
        rawStatus = parts[1].replace(/["']/g, '').trim();
      }

      if (!coachName) continue;

      // Find matching coach from roster
      const matchedCoach = coaches.find(
        (c) =>
          c.name.toLowerCase().includes(coachName.toLowerCase()) ||
          coachName.toLowerCase().includes(c.name.toLowerCase())
      );

      // Determine status
      let status: CoachAvailabilityStatus = 'AVAILABLE';
      const sLower = rawStatus.toLowerCase();
      if (sLower.includes('away') || sLower.includes('no') || sLower.includes('unavail')) {
        status = 'AWAY';
      } else if (sLower.includes('match') || sLower.includes('senior') || sLower.includes('eyhl') || sLower.includes('league')) {
        status = 'SENIOR_MATCH';
      } else if (sLower.includes('morning') || sLower.includes('partial') || sLower.includes('early')) {
        status = 'MORNING_ONLY';
      }

      const record: CoachAvailability = {
        id: `form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        coachId: matchedCoach?.id || `coach-guest-${Date.now()}`,
        coachName: matchedCoach?.name || coachName,
        date: targetDate,
        status,
        notes: notes || (matchedCoach ? undefined : 'New coach registered via form'),
        source: 'google_form',
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      imported.push(record);
    }

    // Merge by coachId and date (overwrite older)
    const merged = [...existing];
    for (const imp of imported) {
      const idx = merged.findIndex((m) => m.coachId === imp.coachId && m.date === imp.date);
      if (idx >= 0) {
        merged[idx] = imp;
      } else {
        merged.push(imp);
      }
    }

    this.saveAvailability(merged);
    return merged;
  },

  getFixtures(): MatchFixture[] {
    return getStorage<MatchFixture[]>(STORAGE_KEYS.FIXTURES, INITIAL_FIXTURES);
  },

  saveFixtures(fixtures: MatchFixture[]): void {
    setStorage(STORAGE_KEYS.FIXTURES, fixtures);
  },

  getBlitzTournaments(): BlitzTournament[] {
    return getStorage<BlitzTournament[]>(STORAGE_KEYS.BLITZ_TOURNAMENTS, INITIAL_BLITZ_TOURNAMENTS);
  },

  saveBlitzTournaments(tournaments: BlitzTournament[]): void {
    setStorage(STORAGE_KEYS.BLITZ_TOURNAMENTS, tournaments);
  },

  getDirectorPin(): string {
    return getStorage<string>(STORAGE_KEYS.DIRECTOR_PIN, '1893');
  },

  setDirectorPin(pin: string): void {
    setStorage(STORAGE_KEYS.DIRECTOR_PIN, pin);
  },

  getSunMode(): boolean {
    return getStorage<boolean>(STORAGE_KEYS.SUN_MODE, false);
  },

  saveSunMode(val: boolean): void {
    setStorage(STORAGE_KEYS.SUN_MODE, val);
  },

  getSidebarCollapsed(): boolean {
    return getStorage<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  },

  saveSidebarCollapsed(val: boolean): void {
    setStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, val);
  },

  /**
   * Group-Specific WhatsApp Template: Coach Briefing
   */
  generateCoachBriefingWhatsApp(
    slot: SessionSlot,
    coaches: Coach[],
    sector: PitchSector,
    drills: Drill[]
  ): string {
    const assignedCoaches = coaches
      .filter((c) => slot.assignedCoachIds.includes(c.id))
      .map((c) => c.name)
      .join(' & ') || 'Unassigned';

    const slotDrillIds = slot.drillIds || slot.attachedDrillIds || [];
    const attachedDrillTitles = drills
      .filter((d) => slotDrillIds.includes(d.id))
      .map((d) => `• ${d.title} (${d.durationMinutes}m - ${d.skill})`)
      .join('\n');

    return `🏑 *OLD ALEX HC — COACH BRIEFING* 🏑
📅 *Date:* ${slot.date}
⏰ *Time:* ${slot.timeSlot}
📍 *Pitch Sector:* ${sector.name} (${sector.code})
👥 *Age Group:* ${slot.ageGroupId} (${slot.pathway} Pathway)
🧢 *Coaches Assigned:* ${assignedCoaches}

📋 *Session Title:* ${slot.sessionTitle}
🎯 *Session Purpose:* ${slot.sessionPurpose || 'Technical and tactical progression'}
⭐ *Key Coaching Focus:* ${slot.keyFocus || slot.coachNotes || 'Soft hands, scanning & high intensity'}

📚 *Drills Attached:*
${attachedDrillTitles || '• Refer to Sunday Coaching Pack in Hub'}

🎒 *Arrival Reminder:* Please arrive at Milltown 15 mins prior to slot to collect gear bags from the Shed. Ensure mouthguards & shinguards are checked.
`;
  },

  /**
   * Group-Specific WhatsApp Template: Parent / Player Group Update
   */
  generateParentUpdateWhatsApp(
    slot: SessionSlot,
    sector: PitchSector,
    date: string
  ): string {
    return `📢 *OLD ALEX JUNIOR HOCKEY — SUNDAY NOTICE* 📢
📅 *Date:* ${date}
👧 *Age Group:* ${slot.ageGroupId}
⏰ *Session Time:* ${slot.timeSlot}
📍 *Pitch Allocation:* ${sector.name} (${sector.code}) — Milltown

🚪 *Drop-off & Collection:*
• Entrance via Pavilion Main Gate.
• Please arrive 10 minutes before pushback (${slot.timeSlot.split('–')[0]?.trim() || slot.timeSlot}).
• Coaches will meet players at the sector dugout.

⚠️ *MANDATORY SAFETY GEAR:*
• Strictly required: *Mouthguard (Gumshield)* & *Shinguards*. Players without gumshields cannot participate for safety reasons.
• Footwear: Astro turf runners only (NO metal studs or blades).
• Water bottle & warm club layer/waterproof.

Let’s have a fantastic session! Go Alex! 💜💛
`;
  },

  /**
   * Group-Specific WhatsApp Template: Match Day Squad Notice
   */
  generateMatchdaySquadWhatsApp(fixture: MatchFixture): string {
    return `🏑 *OLD ALEX HC — MATCHDAY SQUAD NOTICE* 🏑
🏆 *Competition:* ${fixture.competition}
👥 *Squad:* ${fixture.ageGroupOrTeam}
⚔️ *Opposition:* vs ${fixture.opposition}
📅 *Date:* ${fixture.date}
⏰ *Pushback Time:* ${fixture.pushbackTime} (Meet 45 mins prior)
📍 *Venue:* ${fixture.venue} ${fixture.isHome ? '(Home - Milltown)' : '(Away)'}

🎽 *Kit:* ${fixture.isHome ? 'Home Kit (Old Alex Purple & Gold)' : 'Check opposition colors (Bring both Purple & White)'}
🧢 *Lead Coach/Manager:* ${fixture.leadCoachOrManager}
🚩 *Umpires:* ${fixture.umpires.join(', ')}

${fixture.notes ? `📝 *Notes:* ${fixture.notes}\n` : ''}
Please confirm player availability via your squad manager ASAP. Go Alex! 💜
`;
  },

  /**
   * Group-Specific WhatsApp Template: Coaches Availability Callout
   */
  generateAvailabilityCalloutWhatsApp(date: string, totalCount?: number): string {
    return `📢 *ATTENTION ALL OLD ALEX COACHES* 📢
📅 *Sunday Availability Check — ${date}*

Hi team! Please submit your coaching availability for this coming Sunday at Milltown.
We have 10 youth age groups across Pitches 1, 2 & 3 needing lead coaches & apprentices!

👉 *Submit in 10 seconds via our Coach Portal:*
Select your name and tap your status (Available / Morning / Senior EYHL Match / Away).
If you already use the Google Form, your responses sync automatically to the Coaching Hub!

Thank you for your commitment to Old Alex Youth Hockey! 💜💛
— Richard Couse (Director of Coaching / Head of Youth)
`;
  },

  /**
   * Sunday Master Templates (Pre-built + Custom Saved)
   */
  getSundayTemplates(): SundayMasterTemplate[] {
    const customTemplates = getStorage<SundayMasterTemplate[]>(
      STORAGE_KEYS.CUSTOM_TEMPLATES,
      []
    );
    return [...PREBUILT_SUNDAY_TEMPLATES, ...customTemplates];
  },

  saveCustomSundayTemplate(template: SundayMasterTemplate): void {
    const existing = getStorage<SundayMasterTemplate[]>(
      STORAGE_KEYS.CUSTOM_TEMPLATES,
      []
    );
    const updated = [
      template,
      ...existing.filter((t) => t.id !== template.id),
    ];
    setStorage(STORAGE_KEYS.CUSTOM_TEMPLATES, updated);
  },

  deleteCustomSundayTemplate(templateId: string): void {
    const existing = getStorage<SundayMasterTemplate[]>(
      STORAGE_KEYS.CUSTOM_TEMPLATES,
      []
    );
    const updated = existing.filter((t) => t.id !== templateId);
    setStorage(STORAGE_KEYS.CUSTOM_TEMPLATES, updated);
  },

  /**
   * Instantiate fresh SessionSlots from a SundayMasterTemplate for a given date
   */
  instantiateSlotsFromTemplate(
    template: SundayMasterTemplate,
    targetDate: string
  ): SessionSlot[] {
    const timestamp = Date.now();
    return template.slots.map((s, idx) => ({
      ...s,
      id: `slot-${timestamp}-${idx + 1}`,
      date: targetDate,
      status: s.assignedCoachIds.length > 0 ? ('Ready' as const) : ('Needs Coach' as const),
      attachedDrillIds: s.attachedDrillIds || [],
      equipmentChecklist: s.equipmentChecklist || [
        { item: 'Standard hockey balls & cones', checked: true },
      ],
      runningOrder: s.runningOrder || [
        { activity: 'Warmup & dynamic stretches', durationMins: 10 },
        { activity: 'Main skill drill', durationMins: 25 },
        { activity: 'Small-sided conditioned game', durationMins: 25 },
      ],
    }));
  },

  /**
   * Duplicate / Copy all slots from sourceDate to targetDate
   */
  copySlotsToDate(sourceDate: string, targetDate: string): SessionSlot[] {
    const allSlots = this.getSlots();
    const sourceSlots = allSlots.filter((s) => s.date === sourceDate);
    const slotsWithoutTarget = allSlots.filter((s) => s.date !== targetDate);
    const timestamp = Date.now();

    const clonedSlots: SessionSlot[] = sourceSlots.map((s, idx) => ({
      ...s,
      id: `slot-${timestamp}-${idx + 1}`,
      date: targetDate,
    }));

    const nextSlots = [...slotsWithoutTarget, ...clonedSlots];
    this.saveSlots(nextSlots);
    return nextSlots;
  },

  /**
   * Shift all session timings on a given date by deltaMinutes (+15, +30, -15, etc.)
   */
  shiftSlotTimings(date: string, deltaMinutes: number): SessionSlot[] {
    const allSlots = this.getSlots();
    const nextSlots = allSlots.map((slot) => {
      if (slot.date !== date) return slot;

      // Extract current start/end times
      const times = slot.timeSlot.includes('–')
        ? slot.timeSlot.split('–').map((t) => t.trim())
        : slot.timeSlot.includes('-')
        ? slot.timeSlot.split('-').map((t) => t.trim())
        : [slot.startTime || '10:00', slot.endTime || '11:15'];

      const newStart = addMinutesToTime(times[0] || '10:00', deltaMinutes);
      const newEnd = addMinutesToTime(times[1] || '11:15', deltaMinutes);

      return {
        ...slot,
        startTime: newStart,
        endTime: newEnd,
        timeSlot: `${newStart}–${newEnd}`,
      };
    });

    this.saveSlots(nextSlots);
    return nextSlots;
  },

  /**
   * Delete / Clear all slots for a specific date
   */
  deleteSlotsByDate(date: string): SessionSlot[] {
    const allSlots = this.getSlots();
    const nextSlots = allSlots.filter((s) => s.date !== date);
    this.saveSlots(nextSlots);
    return nextSlots;
  },

  /**
   * Helper to calculate end time from start time and minutes
   */
  calculateEndTime(startTime: string, durationMinutes: number): string {
    return addMinutesToTime(startTime, durationMinutes);
  },

  /**
   * Club WhatsApp Groups Directory
   */
  getWhatsAppGroups(): ClubWhatsAppGroup[] {
    const custom = getStorage<ClubWhatsAppGroup[]>(STORAGE_KEYS.WHATSAPP_GROUPS, []);
    if (!custom || custom.length === 0) {
      return DEFAULT_WHATSAPP_GROUPS;
    }
    const customIds = new Set(custom.map((g) => g.id));
    const missingDefaults = DEFAULT_WHATSAPP_GROUPS.filter((d) => !customIds.has(d.id));
    return [...custom, ...missingDefaults];
  },

  saveWhatsAppGroups(groups: ClubWhatsAppGroup[]): void {
    setStorage(STORAGE_KEYS.WHATSAPP_GROUPS, groups);
  },

  updateWhatsAppGroup(id: string, updates: Partial<ClubWhatsAppGroup>): ClubWhatsAppGroup[] {
    const current = this.getWhatsAppGroups();
    const updated = current.map((g) => (g.id === id ? { ...g, ...updates } : g));
    this.saveWhatsAppGroups(updated);
    return updated;
  },

  getGroupByAgeGroup(ageGroup?: AgeGroup): ClubWhatsAppGroup | undefined {
    if (!ageGroup) return undefined;
    const groups = this.getWhatsAppGroups();
    return groups.find((g) => g.ageGroupId === ageGroup);
  },

  /**
   * Player Directory & Welfare Roster
   */
  getPlayers(): Player[] {
    return getStorage<Player[]>(STORAGE_KEYS.PLAYERS, DEFAULT_PLAYERS);
  },

  savePlayers(players: Player[]): void {
    setStorage(STORAGE_KEYS.PLAYERS, players);
  },

  addPlayer(player: Player): Player[] {
    const current = this.getPlayers();
    const updated = [player, ...current];
    this.savePlayers(updated);
    return updated;
  },

  updatePlayer(id: string, updates: Partial<Player>): Player[] {
    const current = this.getPlayers();
    const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
    this.savePlayers(updated);
    return updated;
  },

  deletePlayer(id: string): Player[] {
    const current = this.getPlayers();
    const updated = current.filter((p) => p.id !== id);
    this.savePlayers(updated);
    return updated;
  },

  /**
   * Sunday Pitchside Attendance & Safety Checks
   */
  getAttendance(date: string): AttendanceRecord[] {
    const all = getStorage<Record<string, AttendanceRecord[]>>(STORAGE_KEYS.ATTENDANCE, {});
    return all[date] || [];
  },

  saveAttendance(date: string, records: AttendanceRecord[]): void {
    const all = getStorage<Record<string, AttendanceRecord[]>>(STORAGE_KEYS.ATTENDANCE, {});
    all[date] = records;
    setStorage(STORAGE_KEYS.ATTENDANCE, all);
  },

  recordPlayerStatus(
    date: string,
    ageGroupId: AgeGroup,
    playerId: string,
    status: AttendanceRecord['status']
  ): AttendanceRecord[] {
    const records = this.getAttendance(date);
    const existingIdx = records.findIndex((r) => r.playerId === playerId);
    let next: AttendanceRecord[];
    if (existingIdx >= 0) {
      next = records.map((r, idx) => (idx === existingIdx ? { ...r, status } : r));
    } else {
      next = [
        ...records,
        {
          id: `att-${Date.now()}-${playerId}`,
          date,
          ageGroupId,
          playerId,
          status,
          gearChecked: true,
        },
      ];
    }
    this.saveAttendance(date, next);
    return next;
  },

  toggleGearCheck(date: string, ageGroupId: AgeGroup, playerId: string): AttendanceRecord[] {
    const records = this.getAttendance(date);
    const existingIdx = records.findIndex((r) => r.playerId === playerId);
    let next: AttendanceRecord[];
    if (existingIdx >= 0) {
      next = records.map((r, idx) =>
        idx === existingIdx ? { ...r, gearChecked: !r.gearChecked } : r
      );
    } else {
      next = [
        ...records,
        {
          id: `att-${Date.now()}-${playerId}`,
          date,
          ageGroupId,
          playerId,
          status: 'present',
          gearChecked: true,
        },
      ];
    }
    this.saveAttendance(date, next);
    return next;
  },

  markAllSquadPresent(date: string, ageGroupId: AgeGroup, players: Player[]): AttendanceRecord[] {
    const squadPlayers = players.filter((p) => p.ageGroupId === ageGroupId);
    const records = this.getAttendance(date);
    const otherRecords = records.filter((r) => !squadPlayers.some((p) => p.id === r.playerId));
    const updatedSquadRecords: AttendanceRecord[] = squadPlayers.map((p) => {
      const existing = records.find((r) => r.playerId === p.id);
      return {
        id: existing?.id || `att-${Date.now()}-${p.id}`,
        date,
        ageGroupId,
        playerId: p.id,
        status: 'present',
        gearChecked: existing?.gearChecked ?? true,
      };
    });
    const combined = [...otherRecords, ...updatedSquadRecords];
    this.saveAttendance(date, combined);
    return combined;
  },

  bulkVerifySquadGear(date: string, ageGroupId: AgeGroup, players: Player[]): AttendanceRecord[] {
    const squadPlayers = players.filter((p) => p.ageGroupId === ageGroupId);
    const records = this.getAttendance(date);
    const otherRecords = records.filter((r) => !squadPlayers.some((p) => p.id === r.playerId));
    const updatedSquadRecords: AttendanceRecord[] = squadPlayers.map((p) => {
      const existing = records.find((r) => r.playerId === p.id);
      return {
        id: existing?.id || `att-${Date.now()}-${p.id}`,
        date,
        ageGroupId,
        playerId: p.id,
        status: existing?.status || 'present',
        gearChecked: true,
      };
    });
    const combined = [...otherRecords, ...updatedSquadRecords];
    this.saveAttendance(date, combined);
    return combined;
  },

  /**
   * Complete reset: purges all leftover placeholder data and loads
   * the official Old Alex 15-squad master schedule and 31 real coaches.
   */
  resetToCleanOfficialMaster() {
    this.saveSlots(INITIAL_SESSION_SLOTS);
    this.saveCoaches(COACHES);
    this.saveAvailability([]);
    this.saveSectorGear(INITIAL_SECTOR_GEAR);
    this.saveFirstAid([]);
    this.saveFixtures(INITIAL_FIXTURES);
    this.savePlayers([]);
    this.saveChecklist(INITIAL_PREP_CHECKLIST);
    this.saveBlitzTournaments(INITIAL_BLITZ_TOURNAMENTS);

    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      director: 'Richard Couse',
      slots: INITIAL_SESSION_SLOTS,
      drills: this.getDrills(),
      coaches: COACHES,
      availability: [],
      sectorGear: INITIAL_SECTOR_GEAR,
      firstAid: [],
      fixtures: INITIAL_FIXTURES,
      players: [],
      whatsAppGroups: this.getWhatsAppGroups(),
      checklist: INITIAL_PREP_CHECKLIST,
      blitzTournaments: INITIAL_BLITZ_TOURNAMENTS,
    };
  },

  /**
   * Generates a complete snapshot of all active club data for backup and cloud sync
   */
  createFullBackupData(): HubBackupData {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      director: 'Richard Couse',
      slots: this.getSlots(),
      drills: this.getDrills(),
      coaches: this.getCoaches(),
      availability: this.getAvailability(),
      sectorGear: this.getSectorGear(),
      firstAid: this.getFirstAid(),
      fixtures: this.getFixtures(),
      players: this.getPlayers(),
      whatsAppGroups: this.getWhatsAppGroups(),
      checklist: this.getChecklist(),
      blitzTournaments: this.getBlitzTournaments(),
    };
  },

  /**
   * Restores all club data from a valid HubBackupData object into browser storage
   */
  restoreFromBackupData(parsed: Partial<HubBackupData> | Record<string, unknown>): boolean {
    if (!parsed || typeof parsed !== 'object') return false;
    if (Array.isArray(parsed.slots)) this.saveSlots(parsed.slots);
    if (Array.isArray(parsed.drills)) this.saveDrills(parsed.drills);
    if (Array.isArray(parsed.coaches)) this.saveCoaches(parsed.coaches);
    if (Array.isArray(parsed.availability)) this.saveAvailability(parsed.availability);
    if (Array.isArray(parsed.sectorGear)) this.saveSectorGear(parsed.sectorGear);
    if (Array.isArray(parsed.firstAid)) this.saveFirstAid(parsed.firstAid);
    if (Array.isArray(parsed.fixtures)) this.saveFixtures(parsed.fixtures);
    if (Array.isArray(parsed.players)) this.savePlayers(parsed.players);
    if (Array.isArray(parsed.whatsAppGroups)) this.saveWhatsAppGroups(parsed.whatsAppGroups);
    if (Array.isArray(parsed.checklist)) this.saveChecklist(parsed.checklist);
    if (Array.isArray(parsed.blitzTournaments)) this.saveBlitzTournaments(parsed.blitzTournaments);
    return true;
  },
};

export const DEFAULT_WHATSAPP_GROUPS: ClubWhatsAppGroup[] = [
  {
    id: 'grp-coaches-all',
    name: 'Old Alex Coaches (Verified Roster)',
    category: 'coaches',
    notes: 'Primary club coaching roster channel for weekly availability & director Sunday master plan.',
  },
  {
    id: 'grp-lead-coaches',
    name: 'Sunday Morning Lead Coaches',
    category: 'coaches',
    notes: 'Pitch 1 & 2 Head coaches and sector leads.',
  },
  {
    id: 'grp-pen-parents',
    name: 'PEN & Tots Parents (Milltown)',
    category: 'parents',
    ageGroupId: 'PEN',
    notes: 'Sunday morning drop-off, stick & gumshield reminders.',
  },
  {
    id: 'grp-1st-class-parents',
    name: '1st Class Parents & Players',
    category: 'parents',
    ageGroupId: '1st Class',
    notes: 'Sunday 09:00 Pitch 1 South parent announcements.',
  },
  {
    id: 'grp-2nd-class-parents',
    name: '2nd Class Parents & Players',
    category: 'parents',
    ageGroupId: '2nd Class',
    notes: 'Sunday 09:00 Pitch 2 North parent circular.',
  },
  {
    id: 'grp-3rd-class-parents',
    name: '3rd Class Parents & Players',
    category: 'parents',
    ageGroupId: '3rd Class',
    notes: 'Sunday 09:00 Pitch 2 South announcements.',
  },
  {
    id: 'grp-4th-class-parents',
    name: '4th Class Parents & Players',
    category: 'parents',
    ageGroupId: '4th Class',
    notes: 'Sunday 10:15 Pitch 1 North parent group.',
  },
  {
    id: 'grp-5th-class-parents',
    name: '5th Class Parents & Players',
    category: 'parents',
    ageGroupId: '5th Class',
    notes: 'Sunday 10:15 Pitch 1 South parent group.',
  },
  {
    id: 'grp-6th-class-parents',
    name: '6th Class Parents & Players',
    category: 'parents',
    ageGroupId: '6th Class',
    notes: 'Sunday 10:15 Pitch 2 North parent group.',
  },
  {
    id: 'grp-minor-parents',
    name: 'Minor Squad (1st Year) Parents',
    category: 'parents',
    ageGroupId: '1st Years',
    notes: 'Sunday 11:30 Pitch 1 North & League Fixtures.',
  },
  {
    id: 'grp-junior-parents',
    name: 'Junior Squad (2nd Year) Parents',
    category: 'parents',
    ageGroupId: 'Minors',
    notes: 'Sunday 11:30 Pitch 1 South & League Fixtures.',
  },
  {
    id: 'grp-inters-parents',
    name: 'Inters / Senior Youth Parents',
    category: 'parents',
    ageGroupId: 'Inters',
    notes: 'Sunday 11:30 Pitch 2 North & Leinster Cup.',
  },
  {
    id: 'grp-kitshed-safety',
    name: 'Kit Shed & Pitch Safety Team',
    category: 'safety',
    notes: 'Defibrillator, first-aid kit restock, and ball bag returns.',
  },
];

export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const parts = timeStr.split(':');
  let h = parseInt(parts[0] || '0', 10);
  let m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) h = 10;
  if (isNaN(m)) m = 0;

  let totalMinutes = h * 60 + m + minutesToAdd;
  if (totalMinutes < 0) totalMinutes = 0;
  if (totalMinutes >= 24 * 60) totalMinutes = 23 * 60 + 59;

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH < 10 ? '0' : ''}${newH}:${newM < 10 ? '0' : ''}${newM}`;
}

export const DEFAULT_PLAYERS: Player[] = [];

export const INITIAL_BLITZ_TOURNAMENTS: BlitzTournament[] = [
  {
    id: 'blitz-sep-13-super7s',
    title: 'Old Alex Super 7s Sunday Blitz Festival',
    date: '2026-09-13',
    ageGroup: '2nd & 5th Class',
    matchDurationMinutes: 12,
    breakDurationMinutes: 3,
    startTime: '11:50',
    teams: [
      { id: 'team-red', name: 'Red Robins', color: '#dc2626', coachName: 'Hannah Fox' },
      { id: 'team-white', name: 'White Tigers', color: '#f8fafc', coachName: 'Katie Mullan' },
      { id: 'team-dodder', name: 'Dodder Hawks', color: '#0284c7', coachName: 'John Walsh' },
      { id: 'team-milltown', name: 'Milltown Foxes', color: '#ea580c', coachName: 'Ben McInerney' },
    ],
    matches: [
      {
        id: 'm-1-1',
        roundNumber: 1,
        pitchSectorId: 'sector-a',
        pitchSectorLabel: 'Sector A (SW Turf)',
        scheduledTime: '11:50',
        homeTeamId: 'team-red',
        awayTeamId: 'team-milltown',
        status: 'Scheduled',
      },
      {
        id: 'm-1-2',
        roundNumber: 1,
        pitchSectorId: 'sector-b',
        pitchSectorLabel: 'Sector B (NW Turf)',
        scheduledTime: '11:50',
        homeTeamId: 'team-white',
        awayTeamId: 'team-dodder',
        status: 'Scheduled',
      },
      {
        id: 'm-2-1',
        roundNumber: 2,
        pitchSectorId: 'sector-a',
        pitchSectorLabel: 'Sector A (SW Turf)',
        scheduledTime: '12:05',
        homeTeamId: 'team-red',
        awayTeamId: 'team-dodder',
        status: 'Scheduled',
      },
      {
        id: 'm-2-2',
        roundNumber: 2,
        pitchSectorId: 'sector-b',
        pitchSectorLabel: 'Sector B (NW Turf)',
        scheduledTime: '12:05',
        homeTeamId: 'team-milltown',
        awayTeamId: 'team-white',
        status: 'Scheduled',
      },
      {
        id: 'm-3-1',
        roundNumber: 3,
        pitchSectorId: 'sector-a',
        pitchSectorLabel: 'Sector A (SW Turf)',
        scheduledTime: '12:20',
        homeTeamId: 'team-red',
        awayTeamId: 'team-white',
        status: 'Scheduled',
      },
      {
        id: 'm-3-2',
        roundNumber: 3,
        pitchSectorId: 'sector-b',
        pitchSectorLabel: 'Sector B (NW Turf)',
        scheduledTime: '12:20',
        homeTeamId: 'team-dodder',
        awayTeamId: 'team-milltown',
        status: 'Scheduled',
      },
    ],
    isCompleted: false,
    notes: 'Mini cross-pitch festival goals on Sectors A & B. Pitch manager: Ben McInerney.',
  },
];


