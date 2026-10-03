import { AppSliceCreator, UiSlice, ActiveModalType } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { NotificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';

export const createUiSlice: AppSliceCreator<UiSlice> = (set, get) => ({
  selectedSlotId: null,
  activeModal: null,
  modalPayload: null,
  notifications: NotificationService.getNotifications(),
  toastMessage: null,
  mobileSidebarOpen: false,

  setSelectedSlotId: (selectedSlotId: string | null) => {
    set({ selectedSlotId });
  },

  openModal: (activeModal: ActiveModalType, modalPayload?: Record<string, unknown>) => {
    set({ activeModal, modalPayload: modalPayload || null });
  },

  closeModal: () => {
    set({ activeModal: null, modalPayload: null });
  },

  showToast: (message: string) => {
    set({ toastMessage: message });
    setTimeout(() => {
      if (get().toastMessage === message) {
        set({ toastMessage: null });
      }
    }, 3500);
  },

  clearToast: () => {
    set({ toastMessage: null });
  },

  setMobileSidebarOpen: (mobileSidebarOpen: boolean) => {
    set({ mobileSidebarOpen });
  },

  triggerNotification: (title, message, type, slotId) => {
    const newNotif = NotificationService.triggerNotification(title, message, type, slotId);
    const next = [newNotif, ...get().notifications];
    set({ notifications: next });
    persistenceAdapter.saveKey('notifications' as any, next);
  },

  markNotificationAsRead: (notificationId: string) => {
    const updated = get().notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    set({ notifications: updated });
    NotificationService.saveNotifications(updated);
  },

  markAllNotificationsRead: () => {
    const updated = NotificationService.markAllAsRead();
    set({ notifications: updated });
  },

  clearAllNotifications: () => {
    NotificationService.clearAll();
    set({ notifications: [] });
  },
});
