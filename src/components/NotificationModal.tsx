import React, { useState } from 'react';
import { Bell, AlertTriangle, X, Send, CheckCircle2, Volume2 } from 'lucide-react';
import { NotificationService } from '../services/notificationService';
import { PitchSector, SessionSlot } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendAlert: (
    title: string,
    message: string,
    type: 'pitch_change' | 'coach_sub' | 'schedule_update' | 'urgent',
    slotId?: string
  ) => void;
  sectors: PitchSector[];
  slots: SessionSlot[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onSendAlert,
  sectors,
  slots,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'pitch_change' | 'coach_sub' | 'schedule_update' | 'urgent'>('pitch_change');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    NotificationService.getPermissionStatus()
  );

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermissionStatus(res);
  };

  const handlePresetSelect = (presetTitle: string, presetMessage: string, presetType: typeof type) => {
    setTitle(presetTitle);
    setMessage(presetMessage);
    setType(presetType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onSendAlert(title, message, type, selectedSlotId || undefined);
    onClose();
    setTitle('');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Broadcast Pitch & Schedule Alert
              </h2>
              <p className="text-xs text-neutral-400">
                Pushes instant notification to all Old Alex coaching staff devices.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Status Banner */}
        {permissionStatus !== 'granted' && (
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-200">
              <Volume2 className="w-4 h-4 text-red-500 shrink-0" />
              <span>Enable native browser push notifications for real pitch buzzers</span>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl whitespace-nowrap shadow-sm transition-colors"
            >
              Enable Push
            </button>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2 font-mono-data">
            Quick Incident Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                handlePresetSelect(
                  'Pitch 2 South Waterlogged',
                  'Heavy rain on south goal. 3rd Class session relocated to Pitch 1 South immediately.',
                  'pitch_change'
                )
              }
              className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 rounded-xl text-neutral-200"
            >
              🌧️ P2S Waterlogged
            </button>
            <button
              type="button"
              onClick={() =>
                handlePresetSelect(
                  'Coach Substitution Notice',
                  'Emma Heffernan stepping in to lead 6th Class press session alongside Alex.',
                  'coach_sub'
                )
              }
              className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 rounded-xl text-neutral-200"
            >
              👤 Coach Cover
            </button>
            <button
              type="button"
              onClick={() =>
                handlePresetSelect(
                  '15-Minute Turf Schedule Shift',
                  'Due to earlier senior match extra time, all morning slots shifted by 15 mins.',
                  'schedule_update'
                )
              }
              className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 rounded-xl text-neutral-200"
            >
              ⏰ Schedule Shift
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Alert Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="pitch_change">Pitch Sector Change</option>
                <option value="coach_sub">Coach Substitution</option>
                <option value="schedule_update">Schedule Update</option>
                <option value="urgent">Urgent Safety / Weather</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Target Slot (Optional)
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="">All Sunday Sessions</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.timeSlot} — {s.ageGroupId} ({s.pitchSectorId.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Alert Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Pitch Sector Reassignment: P2 North"
              className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Message & Guidance
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="State clear instruction for affected coaches and players..."
              className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-neutral-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-400">
              Plays acoustic alert chime & updates staff banner
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Push</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
