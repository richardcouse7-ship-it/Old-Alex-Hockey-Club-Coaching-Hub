import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';

describe('Preferences and UI State Management', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset preferences to default state
    useAppStore.setState({
      isSunMode: false,
      isSidebarCollapsed: false,
      isDirectorUnlocked: false,
      activeModal: null,
      modalPayload: null,
      selectedSlotId: null,
      toastMessage: null,
    });
  });

  it('toggles sun mode and sidebar collapse preferences', () => {
    expect(useAppStore.getState().isSunMode).toBe(false);
    useAppStore.getState().toggleSunMode();
    expect(useAppStore.getState().isSunMode).toBe(true);

    expect(useAppStore.getState().isSidebarCollapsed).toBe(false);
    useAppStore.getState().toggleSidebarCollapse();
    expect(useAppStore.getState().isSidebarCollapsed).toBe(true);
  });

  it('manages director unlocked state via lock and unlock functions without exposing secret PIN', () => {
    expect(useAppStore.getState().isDirectorUnlocked).toBe(false);

    // Test director unlock directly
    useAppStore.getState().setDirectorUnlocked(true);
    expect(useAppStore.getState().isDirectorUnlocked).toBe(true);

    useAppStore.getState().lockDirector();
    expect(useAppStore.getState().isDirectorUnlocked).toBe(false);
  });

  it('manages single-active modal state machine and associated payloads', () => {
    expect(useAppStore.getState().activeModal).toBeNull();
    expect(useAppStore.getState().modalPayload).toBeNull();

    // Open add slot modal with prefill payload
    useAppStore.getState().openModal('add_slot', {
      prefill: { timeSlot: '10:00–11:15', pitchSectorId: 'p1n' },
    });

    expect(useAppStore.getState().activeModal).toBe('add_slot');
    expect(useAppStore.getState().modalPayload).toEqual({
      prefill: { timeSlot: '10:00–11:15', pitchSectorId: 'p1n' },
    });

    // Close modal -> payload must be cleared to avoid stale data leakage
    useAppStore.getState().closeModal();
    expect(useAppStore.getState().activeModal).toBeNull();
    expect(useAppStore.getState().modalPayload).toBeNull();

    // Open sequential modal (e.g. export_hub)
    useAppStore.getState().openModal('export_hub', { initialTab: 'whatsapp' });
    expect(useAppStore.getState().activeModal).toBe('export_hub');
    expect(useAppStore.getState().modalPayload).toEqual({ initialTab: 'whatsapp' });
  });

  it('manages inspected slot in drawer and toast notification messages', () => {
    expect(useAppStore.getState().selectedSlotId).toBeNull();

    useAppStore.getState().setSelectedSlotId('slot-abc-123');
    expect(useAppStore.getState().selectedSlotId).toBe('slot-abc-123');

    useAppStore.getState().setSelectedSlotId(null);
    expect(useAppStore.getState().selectedSlotId).toBeNull();

    // Toasts
    useAppStore.getState().showToast('Test Toast Notification');
    expect(useAppStore.getState().toastMessage).toBe('Test Toast Notification');

    useAppStore.getState().clearToast();
    expect(useAppStore.getState().toastMessage).toBeNull();
  });
});
