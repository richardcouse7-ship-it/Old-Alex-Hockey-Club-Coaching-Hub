import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Users,
  X,
  Check,
  Plus,
  Trash2,
  Calendar,
  FastForward,
  Rewind,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { AgeGroup, Pathway, PitchSector, SessionSlot } from '../../types';
import { calculateEndTime } from '../../utils/timeUtils';

interface BulkTimingsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: SessionSlot[];
  sectors: PitchSector[];
  selectedDate: string;
  onSaveAllSlots: (updatedSlots: SessionSlot[]) => void;
  showToast: (msg: string) => void;
}

const ALL_AGE_GROUPS: AgeGroup[] = [
  'PEN',
  '1st Class',
  '2nd Class',
  '3rd Class',
  '4th Class',
  '5th Class',
  '6th Class',
  '1st Years',
  'Minors',
  'Inters',
];

export const BulkTimingsEditorModal: React.FC<BulkTimingsEditorModalProps> = ({
  isOpen,
  onClose,
  slots,
  sectors,
  selectedDate,
  onSaveAllSlots,
  showToast,
}) => {
  // Local editable copy of current day slots
  const [localSlots, setLocalSlots] = useState<SessionSlot[]>(() =>
    slots.filter((s) => s.date === selectedDate)
  );

  if (!isOpen) return null;

  const handleUpdateSlotField = <K extends keyof SessionSlot>(
    slotId: string,
    field: K,
    val: SessionSlot[K]
  ) => {
    setLocalSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;

        const updated = { ...s, [field]: val };

        // If startTime or endTime changed, update timeSlot
        if (field === 'startTime' || field === 'endTime') {
          const start = field === 'startTime' ? (val as string) : s.startTime;
          const end = field === 'endTime' ? (val as string) : s.endTime;
          updated.timeSlot = `${start}–${end}`;
        }

        // If ageGroupId changed, update pathway automatically if standard
        if (field === 'ageGroupId') {
          const age = val as AgeGroup;
          if (['PEN', '1st Class', '2nd Class', '3rd Class'].includes(age)) {
            updated.pathway = 'Foundation';
          } else if (['4th Class', '5th Class', '6th Class'].includes(age)) {
            updated.pathway = 'Development';
          } else {
            updated.pathway = 'Youth Performance';
          }
        }

        return updated;
      })
    );
  };

  const handleSetQuickDuration = (slotId: string, durationMinutes: number) => {
    setLocalSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        const start = s.startTime || '10:00';
        const newEnd = calculateEndTime(start, durationMinutes);
        return {
          ...s,
          endTime: newEnd,
          timeSlot: `${start}–${newEnd}`,
        };
      })
    );
  };

  const handleRemoveSlot = (slotId: string) => {
    setLocalSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const handleAddSlotInline = () => {
    const timestamp = Date.now();
    const newSlot: SessionSlot = {
      id: `slot-${timestamp}`,
      date: selectedDate,
      timeSlot: '12:00–13:15',
      startTime: '12:00',
      endTime: '13:15',
      pitchSectorId: sectors[0]?.id || 'p1n',
      ageGroupId: '4th Class',
      pathway: 'Development',
      assignedCoachIds: [],
      sessionTitle: 'Passing & Transition Drills',
      sessionPurpose: 'Improve stick speed, first touch, and positioning.',
      coachNotes: 'Standard sector setup.',
      attachedDrillIds: [],
      equipmentChecklist: [{ item: 'Standard hockey balls & cones', checked: true }],
      status: 'Needs Coach',
    };

    setLocalSlots((prev) => [...prev, newSlot]);
  };

  const handleShiftAll = (deltaMins: number) => {
    setLocalSlots((prev) =>
      prev.map((s) => {
        const newStart = calculateEndTime(s.startTime || '10:00', deltaMins);
        const newEnd = calculateEndTime(s.endTime || '11:15', deltaMins);
        return {
          ...s,
          startTime: newStart,
          endTime: newEnd,
          timeSlot: `${newStart}–${newEnd}`,
        };
      })
    );
    showToast(`Adjusted timings by ${deltaMins > 0 ? `+${deltaMins}` : deltaMins} mins.`);
  };

  const handleSave = () => {
    // Merge localSlots for this date with slots from other dates
    const slotsOtherDates = slots.filter((s) => s.date !== selectedDate);
    const merged = [...slotsOtherDates, ...localSlots];
    onSaveAllSlots(merged);
    showToast(`Saved timings & team assignments for ${localSlots.length} sessions!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Bulk Timetable Manager
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400 font-medium">📅 {selectedDate}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Edit Session Timings & Team Assignments
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

        {/* Action & Delay Bar */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Quick Delay Shift:</span>
            <button
              type="button"
              onClick={() => handleShiftAll(-15)}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white transition-colors"
            >
              -15m
            </button>
            <button
              type="button"
              onClick={() => handleShiftAll(15)}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-amber-300 transition-colors"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => handleShiftAll(30)}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-red-400 transition-colors"
            >
              +30m Frost Delay
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddSlotInline}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span>Add Session Slot</span>
          </button>
        </div>

        {/* Editable Table Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black space-y-3">
          {localSlots.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 space-y-3">
              <Clock className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-white">No sessions currently scheduled for {selectedDate}</p>
              <button
                type="button"
                onClick={handleAddSlotInline}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
              >
                + Create First Session Slot
              </button>
            </div>
          ) : (
            localSlots.map((slot, index) => (
              <div
                key={slot.id}
                className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 hover:border-neutral-700 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-950 text-red-400 font-mono-data font-bold flex items-center justify-center text-xs">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-white uppercase tracking-wider font-mono-data">
                      {slot.ageGroupId} · {slot.pathway}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Duration Buttons */}
                    <span className="text-[11px] text-neutral-400">Duration:</span>
                    {[60, 75, 90].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => handleSetQuickDuration(slot.id, dur)}
                        className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-[10px] font-mono text-neutral-300 hover:text-white"
                        title={`Set to ${dur} minutes duration`}
                      >
                        {dur}m
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="p-1 text-neutral-400 hover:text-red-400 rounded-lg transition-colors ml-2"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* Start Time */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">Start Time:</label>
                    <input
                      type="time"
                      value={slot.startTime || '10:00'}
                      onChange={(e) => handleUpdateSlotField(slot.id, 'startTime', e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">End Time:</label>
                    <input
                      type="time"
                      value={slot.endTime || '11:15'}
                      onChange={(e) => handleUpdateSlotField(slot.id, 'endTime', e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Pitch Sector */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">Pitch Sector:</label>
                    <select
                      value={slot.pitchSectorId}
                      onChange={(e) => handleUpdateSlotField(slot.id, 'pitchSectorId', e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                    >
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} ({s.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Age Group / Team */}
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">Team / Age Group:</label>
                    <select
                      value={slot.ageGroupId}
                      onChange={(e) =>
                        handleUpdateSlotField(slot.id, 'ageGroupId', e.target.value as AgeGroup)
                      }
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                    >
                      {ALL_AGE_GROUPS.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Session Title & Pathway */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-400 font-medium mb-1">Session Title:</label>
                    <input
                      type="text"
                      value={slot.sessionTitle}
                      onChange={(e) => handleUpdateSlotField(slot.id, 'sessionTitle', e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                      placeholder="e.g. 2v1 Overload Challenge & First Touch"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">Pathway:</label>
                    <select
                      value={slot.pathway}
                      onChange={(e) =>
                        handleUpdateSlotField(slot.id, 'pathway', e.target.value as Pathway)
                      }
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Foundation">Foundation</option>
                      <option value="Development">Development</option>
                      <option value="Youth Performance">Youth Performance</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3 text-xs">
          <span className="text-neutral-400">
            {localSlots.length} active sessions ready to save for {selectedDate}.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save All Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
