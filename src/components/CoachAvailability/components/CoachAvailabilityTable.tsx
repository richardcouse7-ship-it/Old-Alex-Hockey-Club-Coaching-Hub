import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Coach, CoachAvailabilityStatus, SessionSlot } from '../../../types';

export interface CoachAvailabilityItem {
  coach: Coach;
  status: CoachAvailabilityStatus;
  notes: string;
  source?: string;
  submittedAt?: string;
  assignedSlots: SessionSlot[];
}

export interface CoachAvailabilityTableProps {
  coachesWithStatus: CoachAvailabilityItem[];
  selectedCoachIds: string[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onToggleSelectAll: () => void;
  onToggleSelectCoach: (coachId: string) => void;
  onQuickStatusChange: (coachId: string, status: CoachAvailabilityStatus) => void;
  onUpdateNotes?: (coachId: string, notes: string) => void;
  onEditCoach: (coach: Coach) => void;
  onDeleteCoach: (coachId: string) => void;
}

export const CoachAvailabilityTable: React.FC<CoachAvailabilityTableProps> = ({
  coachesWithStatus,
  selectedCoachIds,
  isAllSelected,
  isSomeSelected,
  onToggleSelectAll,
  onToggleSelectCoach,
  onQuickStatusChange,
  onUpdateNotes,
  onEditCoach,
  onDeleteCoach,
}) => {
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  return (
    <div className="bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono-data border-b border-neutral-800">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                  title={isAllSelected ? 'Deselect all visible' : 'Select all visible'}
                />
              </th>
              <th className="py-3 px-4">Coach Name</th>
              <th className="py-3 px-4">Club Role</th>
              <th className="py-3 px-4">Sunday Availability</th>
              <th className="py-3 px-4">Assigned Slot(s)</th>
              <th className="py-3 px-4">Notes / Constraints</th>
              <th className="py-3 px-4 text-right">Quick Change & Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 font-mono-data">
            {coachesWithStatus.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-neutral-400 font-sans text-sm">
                  No coaches match your search or filter criteria.
                </td>
              </tr>
            ) : (
              coachesWithStatus.map(({ coach, status, notes, assignedSlots }) => {
                const isSelected = selectedCoachIds.includes(coach.id);
                const currentNoteValue =
                  editingNotes[coach.id] !== undefined ? editingNotes[coach.id] : notes;

                return (
                  <tr
                    key={coach.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-red-950/25 border-l-2 border-red-500 hover:bg-red-950/35'
                        : 'hover:bg-neutral-900/50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectCoach(coach.id)}
                        className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                        title={isSelected ? `Deselect ${coach.name}` : `Select ${coach.name}`}
                      />
                    </td>

                    <td className="py-3 px-4 font-sans font-semibold text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: coach.accentColor }}
                      />
                      <span>{coach.name}</span>
                      {coach.isActive === false && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase font-mono-data">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans text-neutral-300">{coach.role}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          status === 'AVAILABLE'
                            ? 'bg-neutral-950 text-emerald-300 border border-emerald-800/80'
                            : status === 'SENIOR_MATCH'
                            ? 'bg-red-600/20 text-red-300 border border-red-500/50'
                            : status === 'MORNING_ONLY'
                            ? 'bg-neutral-800 text-white border border-neutral-700'
                            : status === 'AFTERNOON_ONLY'
                            ? 'bg-neutral-800 text-amber-300 border border-amber-800/60'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {status === 'AVAILABLE'
                          ? 'Available'
                          : status === 'SENIOR_MATCH'
                          ? 'Senior Match'
                          : status === 'MORNING_ONLY'
                          ? 'Morning Only'
                          : status === 'AFTERNOON_ONLY'
                          ? 'Afternoon Only'
                          : 'Away'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      {assignedSlots.length === 0 ? (
                        <span className="text-neutral-500 italic">None</span>
                      ) : (
                        assignedSlots.map((s) => (
                          <span
                            key={s.id}
                            className="mr-1 text-[11px] font-bold text-white bg-red-600/20 px-1.5 py-0.5 rounded border border-red-500/40"
                          >
                            {s.ageGroupId} ({s.timeSlot})
                          </span>
                        ))
                      )}
                    </td>

                    <td className="py-2 px-4 font-sans max-w-xs">
                      <input
                        type="text"
                        value={currentNoteValue}
                        onChange={(e) =>
                          setEditingNotes((prev) => ({ ...prev, [coach.id]: e.target.value }))
                        }
                        onBlur={(e) => {
                          if (onUpdateNotes && e.target.value !== notes) {
                            onUpdateNotes(coach.id, e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder="Add notes / constraints..."
                        className="bg-transparent hover:bg-neutral-900 focus:bg-neutral-900 border border-transparent hover:border-neutral-750 focus:border-red-500 rounded px-2 py-1 text-[11px] font-sans text-neutral-300 placeholder-neutral-600 w-full truncate transition-colors focus:outline-none"
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inline status buttons */}
                        <div className="hidden xl:flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onQuickStatusChange(coach.id, 'AVAILABLE')}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                              status === 'AVAILABLE'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-750'
                            }`}
                            title="Set Available"
                          >
                            Avail
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickStatusChange(coach.id, 'SENIOR_MATCH')}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                              status === 'SENIOR_MATCH'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-750'
                            }`}
                            title="Set Senior Match"
                          >
                            Match
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickStatusChange(coach.id, 'AWAY')}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                              status === 'AWAY'
                                ? 'bg-neutral-700 text-white shadow-sm'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-750'
                            }`}
                            title="Set Away / Unavailable"
                          >
                            Away
                          </button>
                        </div>

                        {/* Dropdown status selector */}
                        <select
                          value={status}
                          onChange={(e) =>
                            onQuickStatusChange(
                              coach.id,
                              e.target.value as CoachAvailabilityStatus
                            )
                          }
                          className="bg-neutral-900 border border-neutral-750 text-white text-xs rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-red-500"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="SENIOR_MATCH">Senior Match</option>
                          <option value="MORNING_ONLY">Morning Only</option>
                          <option value="AFTERNOON_ONLY">Afternoon Only</option>
                          <option value="AWAY">Away</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => onEditCoach(coach)}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                          title={`Edit profile for ${coach.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-red-500" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${coach.name} from the Old Alex coach roster?`)) {
                              onDeleteCoach(coach.id);
                            }
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                          title={`Delete ${coach.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
