import React from 'react';
import {
  Clock,
  Plus,
  Compass,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Dumbbell,
} from 'lucide-react';
import { Coach, PitchSector, ScheduleConflict, SessionSlot } from '../../../types';

export interface TimetableMatrixGridProps {
  visibleSectors: PitchSector[];
  visiblePitch1Sectors: PitchSector[];
  visiblePitch2Sectors: PitchSector[];
  visibleOtherSectors: PitchSector[];
  timeSlots: string[];
  slots: SessionSlot[];
  coaches: Coach[];
  conflicts?: ScheduleConflict[];
  onSelectSlot: (slot: SessionSlot) => void;
  onUpdateSlotCoach: (slotId: string, coachId: string) => void;
  onAddCustomSlot: (prefill?: { timeSlot?: string; pitchSectorId?: string }) => void;
}

export const TimetableMatrixGrid: React.FC<TimetableMatrixGridProps> = ({
  visibleSectors,
  visiblePitch1Sectors,
  visiblePitch2Sectors,
  visibleOtherSectors,
  timeSlots,
  slots,
  coaches,
  conflicts = [],
  onSelectSlot,
  onUpdateSlotCoach,
  onAddCustomSlot,
}) => {
  return (
    <div className="border border-neutral-800 rounded-2xl bg-neutral-950 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          {/* Top Level Pitch Headers (Pitch 1 vs Pitch 2) */}
          <div
            className="grid border-b border-neutral-800 bg-black"
            style={{
              gridTemplateColumns: `120px repeat(${visibleSectors.length}, minmax(180px, 1fr))`,
            }}
          >
            {/* Top-Left Corner: Time Label */}
            <div className="p-3 border-r border-neutral-800 flex items-center justify-center bg-neutral-950">
              <span className="text-[10px] font-mono-data font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-500" />
                <span>TIMING</span>
              </span>
            </div>

            {/* Pitch 1 Header Span */}
            {visiblePitch1Sectors.length > 0 && (
              <div
                className="p-2.5 border-r border-neutral-800 bg-gradient-to-r from-emerald-950/40 via-neutral-950 to-emerald-950/20 text-center font-bold text-xs"
                style={{ gridColumn: `span ${visiblePitch1Sectors.length}` }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                  <span className="text-emerald-400 font-mono-data tracking-wider uppercase">
                    PITCH 1 · MAIN MILLTOWN ASTRO
                  </span>
                </div>
              </div>
            )}

            {/* Pitch 2 Header Span */}
            {visiblePitch2Sectors.length > 0 && (
              <div
                className="p-2.5 border-r border-neutral-800 last:border-r-0 bg-gradient-to-r from-sky-950/40 via-neutral-950 to-sky-950/20 text-center font-bold text-xs"
                style={{ gridColumn: `span ${visiblePitch2Sectors.length}` }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-500/30" />
                  <span className="text-sky-400 font-mono-data tracking-wider uppercase">
                    PITCH 2 · TRAINING ASTRO
                  </span>
                </div>
              </div>
            )}

            {/* Pitch 3 / Additional Sector Span */}
            {visibleOtherSectors.length > 0 && (
              <div
                className="p-2.5 border-r border-neutral-800 last:border-r-0 bg-neutral-950 text-center font-bold text-xs"
                style={{ gridColumn: `span ${visibleOtherSectors.length}` }}
              >
                <div className="flex items-center justify-center gap-2 text-neutral-400">
                  <Compass className="w-3.5 h-3.5" />
                  <span className="font-mono-data uppercase tracking-wider">
                    ADDITIONAL TRAINING ZONES
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Header Row: Individual Sectors (P1N, P1S, P2N, P2S, etc.) */}
          <div
            className="grid border-b border-neutral-800 bg-neutral-900/90 font-mono-data text-xs"
            style={{
              gridTemplateColumns: `120px repeat(${visibleSectors.length}, minmax(180px, 1fr))`,
            }}
          >
            <div className="p-2.5 border-r border-neutral-800 text-center text-neutral-500 font-semibold text-[11px] bg-neutral-950">
              SLOT
            </div>

            {visibleSectors.map((sec) => (
              <div
                key={sec.id}
                className="p-2.5 border-r border-neutral-800 last:border-r-0 text-center"
              >
                <div className="font-bold text-white flex items-center justify-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-red-400 font-bold">
                    {sec.code}
                  </span>
                  <span className="text-[11px] text-neutral-300 truncate font-sans">
                    {sec.name.replace(/Pitch \d /i, '')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {timeSlots.map((timeBand) => {
            const slotsInBand = slots.filter((s) => s.timeSlot === timeBand);

            return (
              <div
                key={timeBand}
                className="grid border-b border-neutral-800/80 last:border-b-0 min-h-[145px]"
                style={{
                  gridTemplateColumns: `120px repeat(${visibleSectors.length}, minmax(180px, 1fr))`,
                }}
              >
                {/* Time Column (Sticky feel, prominent hour) */}
                <div className="p-3 border-r border-neutral-800 bg-neutral-950 flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-mono-data font-bold text-white tracking-tight">
                    {timeBand}
                  </span>
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-mono-data">
                    75 min
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-1">
                    {slotsInBand.length} active
                  </span>
                </div>

                {/* Sector Cells */}
                {visibleSectors.map((sec) => {
                  const slot = slots.find(
                    (s) => s.timeSlot === timeBand && s.pitchSectorId === sec.id
                  );

                    if (!slot) {
                    // Empty / Vacant Turf Slot: Interactive Dotted Slot
                    return (
                      <div
                        key={sec.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          onAddCustomSlot({ timeSlot: timeBand, pitchSectorId: sec.id })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onAddCustomSlot({ timeSlot: timeBand, pitchSectorId: sec.id });
                          }
                        }}
                        className="group relative p-2.5 border-r border-neutral-800/80 last:border-r-0 bg-neutral-950/30 hover:bg-neutral-900/60 transition-all cursor-pointer flex flex-col items-center justify-center text-center active:scale-95 select-none"
                        title={`Add session at ${timeBand} on ${sec.code}`}
                      >
                        <div className="w-full h-full border-2 border-dashed border-neutral-800/80 group-hover:border-red-500/60 rounded-xl p-3 flex flex-col items-center justify-center transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-neutral-900 group-hover:bg-red-600 text-neutral-500 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500 group-hover:text-white mt-1.5 transition-colors">
                            Open Turf
                          </span>
                          <span className="text-[9px] text-neutral-600 font-mono-data">
                            Tap to schedule
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Occupied Session Slot: Action Card
                  const assignedCoaches = coaches.filter((c) =>
                    slot.assignedCoachIds.includes(c.id)
                  );
                  const slotConflicts = conflicts.filter((c) => c.slotIds.includes(slot.id));
                  const hasConflict = slotConflicts.length > 0;
                  const isReady = slot.status === 'Ready' && assignedCoaches.length > 0;

                  return (
                    <div
                      key={sec.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectSlot(slot)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectSlot(slot);
                        }
                      }}
                      className={`group relative p-2.5 border-r border-neutral-800/80 last:border-r-0 bg-neutral-900 hover:bg-neutral-850 hover:border-red-500 transition-all cursor-pointer flex flex-col justify-between active:scale-95 select-none ${
                        hasConflict ? 'ring-1 ring-amber-600/80 bg-neutral-900/95' : ''
                      }`}
                    >
                      {/* Pathway colored accent bar on top of card */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 rounded-t-sm ${
                          slot.pathway === 'Foundation'
                            ? 'bg-emerald-500'
                            : slot.pathway === 'Development'
                            ? 'bg-sky-400'
                            : 'bg-red-600'
                        }`}
                      />

                      <div>
                        {/* Card Header: Squad badge + Status / Conflict indicator */}
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${
                              slot.pathway === 'Foundation'
                                ? 'bg-neutral-950 text-emerald-300 border border-emerald-800'
                                : slot.pathway === 'Development'
                                ? 'bg-neutral-950 text-white border border-neutral-700'
                                : 'bg-red-600 text-white font-bold'
                            }`}
                          >
                            {slot.ageGroupId}
                          </span>

                          {hasConflict ? (
                            <span
                              className="flex items-center gap-1 text-[10px] font-mono-data text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/80"
                              title={slotConflicts.map((c) => c.description).join('; ')}
                            >
                              <ShieldAlert className="w-3 h-3 text-amber-400" />
                              <span>Collision</span>
                            </span>
                          ) : isReady ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono-data text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Ready</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-mono-data text-amber-400 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/60">
                              <AlertCircle className="w-3 h-3" />
                              <span>Needs Coach</span>
                            </span>
                          )}
                        </div>

                        {/* Session Title */}
                        <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors mt-1.5 line-clamp-1">
                          {slot.sessionTitle}
                        </h4>

                        {/* Drill count pill */}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                          <Dumbbell className="w-3 h-3 text-neutral-500" />
                          <span>{slot.attachedDrillIds.length} drills</span>
                          <span className="text-neutral-600">·</span>
                          <span className="truncate text-neutral-400">{slot.sessionPurpose}</span>
                        </div>
                      </div>

                      {/* Coach Chips & Quick Swap */}
                      <div
                        className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                          {assignedCoaches.length === 0 ? (
                            <span className="text-[10px] text-amber-400 font-bold italic">
                              Unassigned
                            </span>
                          ) : (
                            assignedCoaches.slice(0, 2).map((c) => (
                              <span
                                key={c.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 font-medium flex items-center gap-1 truncate max-w-[110px]"
                                title={c.name}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: c.accentColor }}
                                />
                                <span className="truncate">{c.name.split(' ')[0]}</span>
                              </span>
                            ))
                          )}
                          {assignedCoaches.length > 2 && (
                            <span className="text-[9px] text-neutral-400 font-mono-data">
                              +{assignedCoaches.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Quick coach add mini select */}
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onUpdateSlotCoach(slot.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white text-[10px] rounded px-1.5 py-1 min-h-[30px] cursor-pointer focus:outline-none focus:border-red-500 shrink-0"
                          title="Quick Assign Coach"
                        >
                          <option value="" disabled>
                            + Coach
                          </option>
                          {coaches.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                              disabled={slot.assignedCoachIds.includes(c.id)}
                            >
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
