import { AppNotification } from '../types';

const NOTIFICATIONS_KEY = 'oldalex_notifications_list_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    timestamp: '09:15 AM',
    date: '2026-09-13',
    title: 'Pitch 2 North Ready',
    message: 'Surface swept and goals anchored for 2nd Class & 6th Class sessions.',
    type: 'pitch_change',
    read: false,
  },
  {
    id: 'notif-2',
    timestamp: '08:45 AM',
    date: '2026-09-13',
    title: 'Coach Assignment Updated',
    message: 'Jessica Walsh assigned as Lead for 1st Class (10:45) and 5th Class (12:00).',
    type: 'coach_sub',
    read: true,
  },
  {
    id: 'notif-3',
    timestamp: 'Yesterday',
    date: '2026-09-12',
    title: 'Sunday Preparation Briefing',
    message: 'Please review updated 2v1 and Counterpress drill attachments in the library.',
    type: 'schedule_update',
    read: true,
  },
];

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay restrictions can be ignored safely
  }
}

export const NotificationService = {
  getNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (!stored) return INITIAL_NOTIFICATIONS;
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(list: AppNotification[]): void {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Failed saving notifications', err);
    }
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return 'default';
    }
  },

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  triggerNotification(
    title: string,
    message: string,
    type: 'pitch_change' | 'coach_sub' | 'schedule_update' | 'urgent' = 'schedule_update',
    slotId?: string
  ): AppNotification {
    playNotificationChime();

    // Trigger browser native push if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Old Alex Hockey: ${title}`, {
          body: message,
          icon: '/favicon.ico',
          tag: 'old-alex-hockey-update',
        });
      } catch (err) {
        console.warn('Browser push error:', err);
      }
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      title,
      message,
      type,
      read: false,
      slotId,
    };

    const current = this.getNotifications();
    const updated = [newNotif, ...current];
    this.saveNotifications(updated);
    return newNotif;
  },

  markAllAsRead(): AppNotification[] {
    const current = this.getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    this.saveNotifications(updated);
    return updated;
  },

  clearAll(): void {
    this.saveNotifications([]);
  },
};
