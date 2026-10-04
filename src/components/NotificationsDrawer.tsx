import React from 'react';
import { Bell, X, CheckCheck, Trash2, Clock, AlertTriangle, User, MapPin } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onOpenBroadcastModal: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onOpenBroadcastModal,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Staff Pitch Alerts"
    >
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className="relative w-screen max-w-md bg-black border-l border-neutral-800 shadow-2xl flex flex-col pointer-events-auto cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Staff Pitch Alerts</h3>
                <p className="text-[11px] text-neutral-400">Real-time schedule and turf updates</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-all active:scale-95 cursor-pointer"
              aria-label="Close pitch alerts"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action bar */}
          <div className="px-5 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onOpenBroadcastModal}
              className="font-bold text-red-500 hover:text-red-400 transition-all active:scale-95 cursor-pointer min-h-[36px] flex items-center"
            >
              + Broadcast New Alert
            </button>
            <div className="flex items-center gap-3 text-neutral-400">
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="hover:text-white transition-all active:scale-95 cursor-pointer min-h-[36px] flex items-center"
                title="Mark all as read"
              >
                Mark read
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="hover:text-red-400 transition-all active:scale-95 cursor-pointer min-h-[36px] flex items-center"
                title="Clear all notifications"
              >
                Clear
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-black">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-xs">
                No recent pitch alerts. You are completely up to date!
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-colors ${
                    notif.read
                      ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                      : 'bg-neutral-950 border-red-500 shadow-sm text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {notif.type === 'pitch_change' && (
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      {notif.type === 'coach_sub' && (
                        <User className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                      {notif.type === 'schedule_update' && (
                        <Clock className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                      )}
                      {notif.type === 'urgent' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-mono-data text-neutral-400 whitespace-nowrap">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-neutral-300 mt-1.5 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
