import React from 'react';
import { Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import { Coach } from '../../../types';
import { CoachAvailabilityItem } from './CoachAvailabilityTable';

export interface CoachDirectoryGridProps {
  coachesWithStatus: CoachAvailabilityItem[];
  selectedCoachIds: string[];
  onToggleSelectCoach: (coachId: string) => void;
  onEditCoach: (coach: Coach) => void;
  onDeleteCoach: (coachId: string) => void;
}

export const CoachDirectoryGrid: React.FC<CoachDirectoryGridProps> = ({
  coachesWithStatus,
  selectedCoachIds,
  onToggleSelectCoach,
  onEditCoach,
  onDeleteCoach,
}) => {
  if (coachesWithStatus.length === 0) {
    return (
      <div className="bg-black border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
        <p className="text-sm">No coaches match your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {coachesWithStatus.map(({ coach, status, notes, assignedSlots }) => {
        const isSelected = selectedCoachIds.includes(coach.id);
        return (
          <div
            key={coach.id}
            className={`border rounded-2xl p-4 space-y-3 transition-all shadow-sm flex flex-col justify-between ${
              isSelected
                ? 'bg-neutral-950 border-red-500 ring-1 ring-red-500/60 shadow-red-950/40'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectCoach(coach.id)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 shrink-0"
                    title={isSelected ? `Deselect ${coach.name}` : `Select ${coach.name}`}
                  />
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0"
                    style={{ backgroundColor: coach.accentColor }}
                  >
                    {coach.initials || coach.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm leading-tight truncate">
                      {coach.name}
                    </h4>
                    <p className="text-[11px] text-neutral-300 mt-0.5 truncate font-medium">
                      {coach.role}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    coach.isActive !== false
                      ? 'bg-neutral-900 text-emerald-300 border border-emerald-800/60'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  {coach.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact Information & WhatsApp link */}
              <div className="space-y-1.5 text-xs text-neutral-200 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <a
                    href={`https://wa.me/${coach.phone?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 truncate font-mono-data"
                    title="Open WhatsApp chat"
                  >
                    {coach.phone || 'No phone recorded'}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate text-neutral-400">
                    {coach.email || 'No email recorded'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <p className="text-[11px] text-neutral-300 italic bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                  "{notes}"
                </p>
              )}

              {/* Assigned Sunday Slots */}
              {assignedSlots.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono-data font-semibold block mb-1">
                    Assigned Sessions:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedSlots.map((s) => (
                      <span
                        key={s.id}
                        className="text-[10px] font-bold text-white bg-red-600/20 px-1.5 py-0.5 rounded border border-red-500/40"
                      >
                        {s.ageGroupId} ({s.timeSlot})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions & Sunday Status */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs mt-3">
              <span className="text-[11px] text-neutral-300">
                Sunday:{' '}
                <strong
                  className={`font-semibold ${
                    status === 'AVAILABLE'
                      ? 'text-emerald-400'
                      : status === 'SENIOR_MATCH'
                      ? 'text-red-400'
                      : status === 'MORNING_ONLY'
                      ? 'text-white'
                      : 'text-neutral-400'
                  }`}
                >
                  {status}
                </strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditCoach(coach)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold flex items-center gap-1 transition-colors border border-neutral-750"
                >
                  <Edit2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Edit Profile</span>
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
            </div>
          </div>
        );
      })}
    </div>
  );
};
