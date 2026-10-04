import React from 'react';
import { X, Play, Edit2, PenTool } from 'lucide-react';
import { Drill } from '../../../types';
import { TacticalDiagram } from '../../TacticalBoard/TacticalDiagram';

export interface DrillDetailDrawerProps {
  drill: Drill | null;
  onClose: () => void;
  onAnimateDrill: (drill: Drill) => void;
  onEditDiagram: (drill: Drill) => void;
  onEditDrill: (drill: Drill) => void;
}

export const DrillDetailDrawer: React.FC<DrillDetailDrawerProps> = ({
  drill,
  onClose,
  onAnimateDrill,
  onEditDiagram,
  onEditDrill,
}) => {
  if (!drill) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-black border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                drill.pathway === 'Foundation'
                  ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                  : drill.pathway === 'Development'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'bg-red-600/20 text-red-300 border border-red-500/50'
              }`}
            >
              {drill.pathway} Pathway
            </span>
            <h2 className="text-2xl font-bold text-white mt-1.5">{drill.title}</h2>
            <p className="text-xs text-red-400 font-mono-data mt-0.5 font-bold">
              Skill Focus: {drill.skill} · Duration: {drill.durationMinutes} mins
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagram with edit launcher */}
        <div className="relative">
          {drill.diagramElements && (
            <TacticalDiagram
              elements={drill.diagramElements}
              title={`${drill.title} Pitch Schematic`}
            />
          )}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAnimateDrill(drill)}
              className="px-3 py-1.5 text-xs font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
              title="Watch dynamic animation of this drill"
            >
              <Play className="w-3.5 h-3.5 fill-current text-red-500" />
              <span>Tactical Animation</span>
            </button>
            <button
              type="button"
              onClick={() => onEditDiagram(drill)}
              className="px-3 py-1.5 text-xs font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Whiteboard</span>
            </button>
          </div>
        </div>

        {/* Setup & Instructions */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
              Pitch & Equipment Setup
            </h4>
            <p className="text-xs text-neutral-200 mt-1 leading-relaxed">{drill.setup}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
              Drill Instructions & Rules
            </h4>
            <p className="text-xs text-neutral-200 mt-1 leading-relaxed">{drill.instructions}</p>
          </div>
        </div>

        {/* Coaching Points */}
        <div>
          <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-2">
            Key Coaching Points
          </h4>
          <ul className="space-y-1.5">
            {drill.coachingPoints.map((pt, i) => (
              <li key={i} className="text-xs text-neutral-200 flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>

        {/* Equipment list */}
        <div>
          <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-1.5">
            Required Equipment
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {drill.equipment.map((eq, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-white font-medium"
              >
                {eq}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAnimateDrill(drill)}
              className="px-3 py-1.5 text-xs font-bold bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current text-red-400" />
              <span>Tactical Animation</span>
            </button>
            <button
              type="button"
              onClick={() => onEditDiagram(drill)}
              className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <PenTool className="w-3.5 h-3.5 text-red-500" />
              <span>Edit Pitch Diagram</span>
            </button>
            <button
              type="button"
              onClick={() => onEditDrill(drill)}
              className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-750 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-red-500" />
              <span>Edit Drill Details</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
