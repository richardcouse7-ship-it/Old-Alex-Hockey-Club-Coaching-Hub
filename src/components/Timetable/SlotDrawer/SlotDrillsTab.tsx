import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { Drill, SessionSlot } from '../../../types';
import { TacticalDiagram } from '../../TacticalBoard/TacticalDiagram';

export interface SlotDrillsTabProps {
  slot: SessionSlot;
  allDrills: Drill[];
  onUpdateSlot: (updatedSlot: SessionSlot) => void;
  onSetWhiteboardDrill: (drill: Drill) => void;
}

export const SlotDrillsTab: React.FC<SlotDrillsTabProps> = ({
  slot,
  allDrills,
  onUpdateSlot,
  onSetWhiteboardDrill,
}) => {
  const [showAttachDrillModal, setShowAttachDrillModal] = useState(false);
  const [selectedDrillToAttach, setSelectedDrillToAttach] = useState<string>('');

  const attachedDrillIds =
    slot.drillIds || (slot as unknown as { attachedDrillIds?: string[] }).attachedDrillIds || [];
  const attachedDrills = allDrills.filter((d) => attachedDrillIds.includes(d.id));

  const handleAttachDrill = () => {
    if (!selectedDrillToAttach) return;
    if (slot.attachedDrillIds.includes(selectedDrillToAttach)) return;
    const updated = {
      ...slot,
      attachedDrillIds: [...slot.attachedDrillIds, selectedDrillToAttach],
    };
    onUpdateSlot(updated);
    setSelectedDrillToAttach('');
    setShowAttachDrillModal(false);
  };

  const handleRemoveDrill = (drillId: string) => {
    const updated = {
      ...slot,
      attachedDrillIds: slot.attachedDrillIds.filter((id) => id !== drillId),
    };
    onUpdateSlot(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-300">
          Drills attached to this {slot.ageGroupId} Sunday session.
        </p>
        <button
          type="button"
          onClick={() => setShowAttachDrillModal(true)}
          className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Attach Drill
        </button>
      </div>

      {attachedDrills.length === 0 ? (
        <div className="text-center py-10 bg-neutral-950 rounded-2xl border border-neutral-800">
          <p className="text-sm text-neutral-300">No drills attached yet.</p>
          <button
            type="button"
            onClick={() => setShowAttachDrillModal(true)}
            className="mt-3 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-bold hover:underline"
          >
            Attach from Old Alex Drill Library
          </button>
        </div>
      ) : (
        attachedDrills.map((drill) => (
          <div
            key={drill.id}
            className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono-data text-red-400 bg-black px-2 py-0.5 rounded border border-neutral-800 font-bold">
                    {drill.durationMinutes} Mins
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {drill.minPlayers}–{drill.maxPlayers} Players
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">{drill.title}</h4>
                <p className="text-xs text-neutral-300">{drill.skill}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDrill(drill.id)}
                className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                title="Detach drill"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Tactical diagram for this drill */}
            {drill.diagramElements && (
              <div className="relative group/slotdiag">
                <TacticalDiagram
                  elements={drill.diagramElements}
                  title={`${drill.title} Pitch Setup`}
                />
                <button
                  type="button"
                  onClick={() => onSetWhiteboardDrill(drill)}
                  className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                  title="Customize tactical diagram on whiteboard"
                >
                  <Edit2 className="w-3 h-3 text-red-500" />
                  <span>Edit Diagram</span>
                </button>
              </div>
            )}

            {/* Coaching points */}
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Key Coaching Points
              </h5>
              <ul className="space-y-1">
                {drill.coachingPoints.map((pt, pIdx) => (
                  <li
                    key={pIdx}
                    className="text-xs text-neutral-200 flex items-start gap-2"
                  >
                    <span className="text-red-500 font-bold">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}

      {/* Attach Drill Modal */}
      {showAttachDrillModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-neutral-800 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white">Attach Drill to Slot</h4>
              <button
                type="button"
                onClick={() => setShowAttachDrillModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <select
              value={selectedDrillToAttach}
              onChange={(e) => setSelectedDrillToAttach(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-sm text-white mb-4 focus:outline-none focus:border-red-500"
            >
              <option value="">Select a drill...</option>
              {allDrills
                .filter((d) => !slot.attachedDrillIds.includes(d.id))
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.pathway} · {d.durationMinutes}m)
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAttachDrillModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttachDrill}
                disabled={!selectedDrillToAttach}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors"
              >
                Confirm Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
