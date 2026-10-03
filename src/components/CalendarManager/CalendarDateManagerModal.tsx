import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Copy,
  ChevronRight,
  Trash2,
  Sparkles,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  FastForward,
  Rewind,
  CalendarDays,
} from 'lucide-react';
import { SessionSlot } from '../../types';
import { useAppStore } from '../../store';
import { SEASON_SUNDAYS } from '../../data/seasonCalendar';

interface CalendarDateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  allSlots: SessionSlot[];
  onUpdateSlots: (slots: SessionSlot[]) => void;
  onOpenTemplatesModal?: () => void;
  showToast: (msg: string) => void;
}

export const CalendarDateManagerModal: React.FC<CalendarDateManagerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onChangeDate,
  allSlots,
  onUpdateSlots,
  onOpenTemplatesModal,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'season_calendar' | 'duplicate' | 'shift'>(
    'season_calendar'
  );

  const duplicateSchedule = useAppStore((s) => s.duplicateSchedule);
  const shiftTimings = useAppStore((s) => s.shiftTimings);
  const deleteSlotsByDate = useAppStore((s) => s.deleteSlotsByDate);

  // Custom date picker state
  const [customDateInput, setCustomDateInput] = useState(selectedDate);

  // Duplicate state
  const [duplicateTargetDate, setDuplicateTargetDate] = useState('2026-09-20');

  if (!isOpen) return null;

  const currentDaySlots = allSlots.filter((s) => s.date === selectedDate);

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Handle jump to custom date
  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDateInput) {
      onChangeDate(customDateInput);
      showToast(`Calendar switched to ${customDateInput}`);
      onClose();
    }
  };

  // Handle duplicate schedule
  const handleExecuteDuplicate = () => {
    if (!duplicateTargetDate) return;
    if (duplicateTargetDate === selectedDate) {
      alert('Source and target dates must be different.');
      return;
    }

    duplicateSchedule(selectedDate, duplicateTargetDate);
    onChangeDate(duplicateTargetDate);
    showToast(
      `Successfully copied ${currentDaySlots.length} sessions to ${duplicateTargetDate}!`
    );
    onClose();
  };

  // Handle timing shift
  const handleExecuteShift = (deltaMinutes: number) => {
    shiftTimings(selectedDate, deltaMinutes);
    showToast(
      `Shifted all sessions for ${selectedDate} by ${deltaMinutes > 0 ? `+${deltaMinutes}` : deltaMinutes} minutes!`
    );
  };

  // Handle clear date
  const handleClearCurrentDate = () => {
    if (
      window.confirm(
        `Are you sure you want to clear all ${currentDaySlots.length} sessions scheduled for ${selectedDate}?`
      )
    ) {
      deleteSlotsByDate(selectedDate);
      showToast(`Cleared all sessions for ${selectedDate}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Old Alex Calendar Controls
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400 font-medium">Director Schedule Manager</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Calendar & Timetable Operations
              </h2>
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

        {/* Current Active Date Ribbon */}
        <div className="px-6 py-3 bg-red-950/30 border-b border-red-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-300">
            <Calendar className="w-4 h-4 text-red-400" />
            <span>
              Currently viewing: <strong className="text-white">{formattedSelectedDate}</strong>
            </span>
          </div>
          <span className="font-mono-data text-xs px-2.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-200">
            {currentDaySlots.length} Session{currentDaySlots.length === 1 ? '' : 's'} on Pitch
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('season_calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'season_calendar'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2026/2027 Season Dates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('duplicate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'duplicate'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span>Clone / Duplicate Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('shift')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'shift'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Shift Timings (+/- Mins)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-black space-y-5">
          {/* TAB 1: SEASON SUNDAYS CALENDAR & CUSTOM PICKER */}
          {activeSubTab === 'season_calendar' && (
            <div className="space-y-4">
              {/* Custom Date Jump Form */}
              <form
                onSubmit={handleApplyCustomDate}
                className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <label className="block text-white font-semibold mb-1">
                    Select Any Date (Training, Match, or Blitz):
                  </label>
                  <p className="text-[11px] text-neutral-400">
                    Jump directly to any date across the hockey calendar.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateInput}
                    onChange={(e) => setCustomDateInput(e.target.value)}
                    className="bg-black border border-neutral-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
                  >
                    Go to Date
                  </button>
                </div>
              </form>

              {/* Full 2026/2027 Season Sundays Directory */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono-data tracking-wider">
                    Official 2026/2027 Sunday Fixture Calendar
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Click any Sunday to open its timetable
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {SEASON_SUNDAYS.map((sun) => {
                    const isCurrent = sun.date === selectedDate;
                    const sessionCount = allSlots.filter((s) => s.date === sun.date).length;

                    return (
                      <button
                        key={sun.date}
                        type="button"
                        onClick={() => {
                          onChangeDate(sun.date);
                          showToast(`Loaded ${sun.label}`);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'bg-red-950/60 border-red-500 text-white shadow-md'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{sun.label}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">{sun.note}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-[10px] font-mono-data px-2 py-0.5 rounded ${
                              sessionCount > 0
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-bold'
                                : 'bg-neutral-900 text-neutral-400'
                            }`}
                          >
                            {sessionCount > 0 ? `${sessionCount} slots` : 'Empty'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUPLICATE / CLONE SCHEDULE */}
          {activeSubTab === 'duplicate' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>Clone Sunday Schedule to Another Date</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Avoid re-typing sessions! Easily duplicate all {currentDaySlots.length} sessions from{' '}
                  <strong className="text-white">{selectedDate}</strong> (including all pitch sectors,
                  assigned coaches, and drill links) onto any upcoming Sunday.
                </p>
              </div>

              <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs text-neutral-400 font-mono-data uppercase block mb-1">
                      Source Date (Current)
                    </span>
                    <div className="p-3 bg-black border border-neutral-800 rounded-xl text-xs text-white font-bold">
                      📅 {selectedDate} ({currentDaySlots.length} sessions)
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-center pt-5">
                    <ArrowRight className="w-5 h-5 text-red-500" />
                  </div>

                  <div className="flex-1">
                    <span className="text-xs text-neutral-400 font-mono-data uppercase block mb-1">
                      Target Date to Duplicate Into
                    </span>
                    <select
                      value={duplicateTargetDate}
                      onChange={(e) => setDuplicateTargetDate(e.target.value)}
                      className="w-full p-2.5 bg-black border border-neutral-700 text-white rounded-xl text-xs focus:outline-none focus:border-red-500"
                    >
                      {SEASON_SUNDAYS.filter((s) => s.date !== selectedDate).map((sun) => (
                        <option key={sun.date} value={sun.date}>
                          {sun.label} — {sun.note}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleExecuteDuplicate}
                    disabled={currentDaySlots.length === 0}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Duplicate {currentDaySlots.length} Sessions to New Sunday</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMING SHIFTS & EMERGENCY CONTROLS */}
          {activeSubTab === 'shift' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Weather Delay & Timing Shift Engine</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  If early morning turf inspection causes a frost delay or pitch pushback is delayed, shift all
                  sessions for <strong className="text-white">{selectedDate}</strong> forward or backward with 1 tap.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleExecuteShift(-30)}
                  className="p-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-center space-y-1 transition-all"
                >
                  <Rewind className="w-4 h-4 text-neutral-400 mx-auto" />
                  <span className="block text-xs font-bold text-white">-30 Mins</span>
                  <span className="text-[10px] text-neutral-400 block">Move earlier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteShift(-15)}
                  className="p-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-center space-y-1 transition-all"
                >
                  <Rewind className="w-4 h-4 text-neutral-400 mx-auto" />
                  <span className="block text-xs font-bold text-white">-15 Mins</span>
                  <span className="text-[10px] text-neutral-400 block">Move earlier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteShift(15)}
                  className="p-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500 rounded-xl text-center space-y-1 transition-all"
                >
                  <FastForward className="w-4 h-4 text-amber-400 mx-auto" />
                  <span className="block text-xs font-bold text-white">+15 Mins</span>
                  <span className="text-[10px] text-amber-300 block">Frost delay</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteShift(30)}
                  className="p-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500 rounded-xl text-center space-y-1 transition-all"
                >
                  <FastForward className="w-4 h-4 text-red-400 mx-auto" />
                  <span className="block text-xs font-bold text-white">+30 Mins</span>
                  <span className="text-[10px] text-red-300 block">Major delay</span>
                </button>
              </div>

              {/* Clear Day Option */}
              <div className="p-4 bg-neutral-950 border border-red-950/60 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-red-400">Clear All Sessions for this Date</h4>
                  <p className="text-[11px] text-neutral-400">
                    Empties the timetable for {selectedDate} so you can apply a fresh blueprint template.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCurrentDate}
                  disabled={currentDaySlots.length === 0}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 disabled:opacity-40 transition-colors"
                >
                  Clear Schedule
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="text-neutral-400">Old Alex HC · Director Coaching Hub</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
