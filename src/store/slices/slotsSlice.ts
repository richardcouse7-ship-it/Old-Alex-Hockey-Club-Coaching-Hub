import { AppSliceCreator, SlotsSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { SessionSlot, SundayMasterTemplate } from '../../types';
import { normalizeAwaySlot, syncAwayFixturesToSlots } from '../../utils/awayFixtureUtils';
import { addMinutesToTime } from '../../services/storageService';

export const createSlotsSlice: AppSliceCreator<SlotsSlice> = (set, get) => ({
  slots: [],
  customSundayTemplates: [],

  addSlot: (slot: SessionSlot) => {
    const normalized = normalizeAwaySlot(slot);
    const nextSlots = [normalized, ...get().slots];
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  updateSlot: (slot: SessionSlot) => {
    const normalized = normalizeAwaySlot(slot);
    const nextSlots = get().slots.map((s) => (s.id === slot.id ? normalized : s));
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  deleteSlot: (slotId: string) => {
    const nextSlots = get().slots.filter((s) => s.id !== slotId);
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  assignCoachToSlot: (slotId: string, coachId: string) => {
    const nextSlots = get().slots.map((s) => {
      if (s.id === slotId && !s.assignedCoachIds.includes(coachId)) {
        return {
          ...s,
          assignedCoachIds: [...s.assignedCoachIds, coachId],
          status: 'Ready' as const,
        };
      }
      return s;
    });
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  removeCoachFromSlot: (slotId: string, coachId: string) => {
    const nextSlots = get().slots.map((s) => {
      if (s.id === slotId) {
        const nextCoaches = s.assignedCoachIds.filter((id) => id !== coachId);
        return {
          ...s,
          assignedCoachIds: nextCoaches,
          status: (nextCoaches.length === 0 ? 'Needs Coach' : 'Ready') as SessionSlot['status'],
        };
      }
      return s;
    });
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  shiftTimings: (date: string, deltaMinutes: number) => {
    const nextSlots = get().slots.map((slot: SessionSlot) => {
      if (slot.date !== date) return slot;
      const times = slot.timeSlot.includes('–')
        ? slot.timeSlot.split('–').map((t) => t.trim())
        : slot.timeSlot.includes('-')
        ? slot.timeSlot.split('-').map((t) => t.trim())
        : [slot.startTime || '10:00', slot.endTime || '11:15'];

      const newStart = addMinutesToTime(times[0] || '10:00', deltaMinutes);
      const newEnd = addMinutesToTime(times[1] || '11:15', deltaMinutes);

      return normalizeAwaySlot({
        ...slot,
        startTime: newStart,
        endTime: newEnd,
        timeSlot: `${newStart}–${newEnd}`,
      });
    });
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  duplicateSchedule: (sourceDate: string, targetDate: string) => {
    const sourceSlots = get().slots.filter((s) => s.date === sourceDate);
    const otherDateSlots = get().slots.filter((s) => s.date !== targetDate);
    const duplicated: SessionSlot[] = sourceSlots.map((s, idx) => ({
      ...s,
      id: `slot-copy-${Date.now()}-${idx}`,
      date: targetDate,
    }));
    const nextSlots = [...otherDateSlots, ...duplicated];
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  deleteSlotsByDate: (date: string) => {
    const nextSlots = get().slots.filter((s) => s.date !== date);
    set({ slots: nextSlots });
    persistenceAdapter.saveKey('slots', nextSlots);
  },

  applyMasterTemplate: (newSlots: SessionSlot[]) => {
    const normalized = newSlots.map(normalizeAwaySlot);
    set({ slots: normalized });
    persistenceAdapter.saveKey('slots', normalized);
  },

  setSlots: (slots: SessionSlot[]) => {
    const normalized = slots.map(normalizeAwaySlot);
    set({ slots: normalized });
    persistenceAdapter.saveKey('slots', normalized);
  },

  saveCustomTemplate: (template: SundayMasterTemplate) => {
    const existing = get().customSundayTemplates.filter((t) => t.id !== template.id);
    const next = [...existing, template];
    set({ customSundayTemplates: next });
    persistenceAdapter.saveKey('customSundayTemplates', next);
  },

  deleteCustomTemplate: (templateId: string) => {
    const next = get().customSundayTemplates.filter((t) => t.id !== templateId);
    set({ customSundayTemplates: next });
    persistenceAdapter.saveKey('customSundayTemplates', next);
  },

  generateAwaySlotsFromFixtures: (options?: {
    targetDate?: string;
    fixtureIds?: string[];
  }) => {
    const currentSlots = get().slots;
    const fixtures = get().fixtures;
    const coaches = get().coaches;

    const { updatedSlots, createdCount, updatedCount, skippedCount } = syncAwayFixturesToSlots(
      currentSlots,
      fixtures,
      coaches,
      options
    );

    set({ slots: updatedSlots });
    persistenceAdapter.saveKey('slots', updatedSlots);

    const totalAwaySlots = updatedSlots.filter((s) => s.isAway || s.pitchSectorId === 'away').length;

    return {
      createdCount,
      updatedCount,
      skippedCount,
      totalAwaySlots,
    };
  },
});
