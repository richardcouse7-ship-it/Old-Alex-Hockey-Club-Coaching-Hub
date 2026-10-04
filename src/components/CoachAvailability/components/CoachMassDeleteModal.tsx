import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Coach } from '../../../types';

export interface CoachMassDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCoachIds: string[];
  coaches: Coach[];
  onToggleSelectCoach: (coachId: string) => void;
  onConfirmMassDelete: () => void;
}

export const CoachMassDeleteModal: React.FC<CoachMassDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedCoachIds,
  coaches,
  onToggleSelectCoach,
  onConfirmMassDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mass Deletion</h3>
              <p className="text-xs text-neutral-400">
                Delete {selectedCoachIds.length} selected coach profiles
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

        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-red-950/30 border border-red-800/50 rounded-2xl text-xs text-red-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-white mb-0.5 font-semibold">
                Warning: Irreversible deletion
              </strong>
              You are about to remove <strong>{selectedCoachIds.length} coaches</strong> from the Old Alex Coaching roster.
              They will be unassigned from any Sunday timetable slots and their availability records will be purged.
            </div>
          </div>

          <div>
            <span className="text-[11px] font-mono-data text-neutral-400 font-semibold uppercase tracking-wider block mb-2">
              Selected Coaches to Remove:
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-black border border-neutral-800 rounded-xl">
              {selectedCoachIds.map((id) => {
                const coach = coaches.find((c) => c.id === id);
                if (!coach) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-neutral-900/70 rounded-lg border border-neutral-800"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: coach.accentColor }}
                      />
                      <span className="font-semibold text-white">{coach.name}</span>
                      <span className="text-neutral-400 text-[11px]">({coach.role})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSelectCoach(id)}
                      className="text-[11px] text-neutral-400 hover:text-red-400 p-0.5 transition-colors"
                      title="Remove from selection"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-800 bg-black flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-750 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirmMassDelete}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Mass Deletion ({selectedCoachIds.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
