import React from 'react';
import { Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Coach, PitchSector, ScheduleConflict, SessionSlot } from '../../../types';

export interface TimetableTimelineViewProps {
  timeSlots: string[];
  slots: SessionSlot[];
  sectors: PitchSector[];
  coaches: Coach[];
  conflicts: ScheduleConflict[];
  onSelectSlot: (slot: SessionSlot) => void;
  onUpdateSlotCoach: (slotId: string, coachId: string) => void;
}

export const TimetableTimelineView: React.FC<TimetableTimelineViewProps> = ({
  timeSlots,
  slots,
  sectors,
  coaches,
  conflicts,
  onSelectSlot,
  onUpdateSlotCoach,
}) => {
  return (
    <div className="space-y-4">
      {timeSlots.map((timeBand) => {
        const slotsInBand = slots.filter((s) => s.timeSlot === timeBand);
        if (slotsInBand.length === 0) return null;

        return (
          <div
            key={timeBand}
            className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
          >
            {/* Time slot header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-mono-data tracking-tight">
                    {timeBand}
                  </h2>
                  <span className="text-[11px] text-neutral-400">
                    {slotsInBand.length} Age Groups Training Simultaneously
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono-data text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
                75 Min Slot
              </span>
            </div>

            {/* Slots Grid within this time band */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {slotsInBand.map((slot) => {
                const sector = sectors.find((sec) => sec.id === slot.pitchSectorId);
                const slotConflicts = conflicts.filter((c) => c.slotIds.includes(slot.id));
                const assignedCoaches = coaches.filter((c) =>
                  slot.assignedCoachIds.includes(c.id)
                );

                return (
                  <div
                    key={slot.id}
                    role="button"
                    tabIndex={0}
                    className={`group relative rounded-xl border p-4 transition-all hover:border-red-500 hover:bg-neutral-900 cursor-pointer active:scale-95 select-none ${
                      slotConflicts.length > 0
                        ? 'border-amber-700/80 bg-neutral-900'
                        : 'border-neutral-800 bg-black'
                    }`}
                    onClick={() => onSelectSlot(slot)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSlot(slot);
                      }
                    }}
                  >
                    {/* Top bar of card */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono-data text-white bg-red-600 px-2.5 py-0.5 rounded-md">
                          {sector?.code || slot.pitchSectorId}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            slot.pathway === 'Foundation'
                              ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                              : slot.pathway === 'Development'
                              ? 'bg-neutral-900 text-white border border-neutral-700'
                              : 'bg-red-600/20 text-red-300 border border-red-500/50'
                          }`}
                        >
                          {slot.ageGroupId}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono-data uppercase px-2 py-0.5 rounded font-bold ${
                          slot.status === 'Ready'
                            ? 'text-emerald-300 bg-neutral-900 border border-emerald-800/60'
                            : 'text-amber-300 bg-neutral-900 border border-amber-800/60'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>

                    {/* Session title & Purpose */}
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      {slot.sessionTitle}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {slot.sessionPurpose}
                    </p>

                    {/* Inline Coach Assignment Dropdown */}
                    <div
                      className="mt-4 pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-neutral-400 font-semibold">
                          Coaches:
                        </span>
                        {assignedCoaches.length === 0 ? (
                          <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> None
                          </span>
                        ) : (
                          assignedCoaches.map((c) => (
                            <span
                              key={c.id}
                              className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-750 text-white font-medium flex items-center gap-1"
                            >
                              <span
                                className="w-2 h-2 rounded-full ring-1 ring-white/30"
                                style={{ backgroundColor: c.accentColor }}
                              />
                              {c.name}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Quick assign coach inline dropdown */}
                      <div className="relative">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onUpdateSlotCoach(slot.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs rounded-lg px-2.5 py-1.5 min-h-[36px] cursor-pointer focus:outline-none focus:border-red-500"
                          title="Assign another coach to this slot"
                        >
                          <option value="" disabled className="bg-neutral-900 text-neutral-400">
                            + Assign Coach...
                          </option>
                          {coaches.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                              disabled={slot.assignedCoachIds.includes(c.id)}
                            >
                              {c.name} {slot.assignedCoachIds.includes(c.id) ? '(Assigned)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Card footer details */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 font-mono-data">
                      <span>{slot.attachedDrillIds.length} Drills Attached</span>
                      <span className="flex items-center gap-1 text-red-400 group-hover:text-red-300 group-hover:underline font-medium">
                        Open Inspector <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
