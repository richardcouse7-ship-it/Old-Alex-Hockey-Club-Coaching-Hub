import { AppSliceCreator, CoachesSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { StorageService } from '../../services/storageService';
import { Coach, CoachAvailability } from '../../types';
import { COACHES } from '../../data/initialData';
import { syncWithMasterRoster } from '../persistence/migration';

export const createCoachesSlice: AppSliceCreator<CoachesSlice> = (set, get) => ({
  coaches: [],
  availability: [],

  setCoaches: (coaches: Coach[]) => {
    set({ coaches });
    persistenceAdapter.saveKey('coaches', coaches);
  },

  addCoach: (coach: Coach) => {
    const nextCoaches = [...get().coaches, coach];
    set({ coaches: nextCoaches });
    persistenceAdapter.saveKey('coaches', nextCoaches);
  },

  updateCoach: (coach: Coach) => {
    const nextCoaches = get().coaches.map((c) => (c.id === coach.id ? coach : c));
    set({ coaches: nextCoaches });
    persistenceAdapter.saveKey('coaches', nextCoaches);
  },

  deleteCoaches: (coachIds: string[]) => {
    const nextCoaches = get().coaches.filter((c) => !coachIds.includes(c.id));
    // Clean up availability for deleted coaches
    const nextAv = get().availability.filter((a) => !coachIds.includes(a.coachId));
    // Also clean up assigned slots
    const nextSlots = get().slots.map((s) => ({
      ...s,
      assignedCoachIds: s.assignedCoachIds.filter((id) => !coachIds.includes(id)),
      status: (s.assignedCoachIds.filter((id) => !coachIds.includes(id)).length === 0
        ? 'Needs Coach'
        : s.status) as typeof s.status,
    }));

    set({ coaches: nextCoaches, availability: nextAv, slots: nextSlots });
    persistenceAdapter.saveKey('coaches', nextCoaches);
    persistenceAdapter.saveKey('availability', nextAv);
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  setAvailability: (availability: CoachAvailability[]) => {
    set({ availability });
    persistenceAdapter.saveKey('availability', availability);
  },

  updateAvailabilityStatus: (coachId, date, status, notes) => {
    const existing = get().availability.find(
      (a) => a.coachId === coachId && a.date === date
    );
    let next: CoachAvailability[];
    if (existing) {
      next = get().availability.map((a) =>
        a.id === existing.id
          ? { ...a, status, notes: notes !== undefined ? notes : a.notes, submittedAt: new Date().toISOString() }
          : a
      );
    } else {
      const coach = get().coaches.find((c) => c.id === coachId);
      const newRecord: CoachAvailability = {
        id: `av-${Date.now()}-${coachId}`,
        coachId,
        coachName: coach?.name || 'Coach',
        date,
        status,
        notes,
        source: 'direct',
        submittedAt: new Date().toISOString(),
      };
      next = [...get().availability, newRecord];
    }
    set({ availability: next });
    persistenceAdapter.saveKey('availability', next);
  },

  importAvailabilityFromForm: (rawText: string, targetDate: string) => {
    const parsed = StorageService.importGoogleFormResponses(rawText, targetDate);
    set({ availability: parsed });
    persistenceAdapter.saveKey('availability', parsed);
  },

  autoAssignCoachesToDate: (date: string) => {
    const dateSlots = get().slots.filter((s) => s.date === date);
    const availableCoachIds = get()
      .availability.filter((a) => a.date === date && a.status === 'AVAILABLE')
      .map((a) => a.coachId);

    let assignedCount = 0;
    const nextSlots = get().slots.map((slot) => {
      if (slot.date === date && slot.assignedCoachIds.length === 0 && availableCoachIds.length > 0) {
        // Find an available coach not already working in this time slot
        const busyInTimeSlot = dateSlots
          .filter((s) => s.timeSlot === slot.timeSlot)
          .flatMap((s) => s.assignedCoachIds);

        const freeCoachId = availableCoachIds.find((id) => !busyInTimeSlot.includes(id));
        if (freeCoachId) {
          assignedCount++;
          return {
            ...slot,
            assignedCoachIds: [freeCoachId],
            status: 'Ready' as const,
          };
        }
      }
      return slot;
    });

    if (assignedCount > 0) {
      set({ slots: nextSlots });
      persistenceAdapter.saveKey('slots', nextSlots);
    }
    return assignedCount;
  },

  syncMasterRoster: () => {
    const currentCoaches = get().coaches;
    const merged = syncWithMasterRoster(currentCoaches, COACHES);
    const addedCount = merged.length - currentCoaches.length;

    if (addedCount > 0) {
      set({ coaches: merged });
      persistenceAdapter.saveKey('coaches', merged);
    }

    return { total: merged.length, addedCount };
  },
});
