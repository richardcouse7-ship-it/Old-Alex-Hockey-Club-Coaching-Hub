import React from 'react';
import { Clock, Users, Play, Edit2, ChevronRight, BookOpen } from 'lucide-react';
import { Drill } from '../../../types';
import { TacticalDiagram } from '../../TacticalBoard/TacticalDiagram';

export interface DrillCardGridProps {
  drills: Drill[];
  onSelectDrill: (drill: Drill) => void;
  onAnimateDrill: (drill: Drill) => void;
  onEditDiagram: (drill: Drill) => void;
}

export const DrillCardGrid: React.FC<DrillCardGridProps> = ({
  drills,
  onSelectDrill,
  onAnimateDrill,
  onEditDiagram,
}) => {
  if (drills.length === 0) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-12 text-center">
        <BookOpen className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No drills match your filter criteria</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Try resetting your search query, selecting &quot;All Skill Levels&quot;, or broadening the Leinster curriculum skill filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {drills.map((drill) => (
        <div
          key={drill.id}
          role="button"
          tabIndex={0}
          className="group bg-neutral-950 border border-neutral-800 hover:border-red-500 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg cursor-pointer active:scale-95 select-none"
          onClick={() => onSelectDrill(drill)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectDrill(drill);
            }
          }}
        >
          <div>
            {/* Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  drill.pathway === 'Foundation'
                    ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                    : drill.pathway === 'Development'
                    ? 'bg-neutral-900 text-white border border-neutral-700'
                    : 'bg-red-600/20 text-red-300 border border-red-500/50'
                }`}
              >
                {drill.pathway}
              </span>

              <div className="flex items-center gap-3 text-[11px] font-mono-data text-neutral-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-500" />
                  {drill.durationMinutes}m
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-neutral-400" />
                  {drill.minPlayers}–{drill.maxPlayers}
                </span>
              </div>
            </div>

            {/* Title & Skill */}
            <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
              {drill.title}
            </h3>
            <p className="text-xs text-red-400 font-semibold mt-0.5">{drill.skill}</p>

            {/* Pitch Diagram */}
            {drill.diagramElements && (
              <div className="mt-3 relative group/diag">
                <TacticalDiagram
                  elements={drill.diagramElements}
                  height={160}
                  title={`${drill.title}`}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnimateDrill(drill);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                    title="Watch animated drill walkthrough"
                  >
                    <Play className="w-3 h-3 fill-current text-red-400" />
                    <span>Animate</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDiagram(drill);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                    title="Open interactive tactical whiteboard"
                  >
                    <Edit2 className="w-3 h-3 text-red-400" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Short setup */}
            <p className="text-xs text-neutral-300 mt-3 line-clamp-2 leading-relaxed">
              {drill.setup}
            </p>
          </div>

          {/* Card footer */}
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnimateDrill(drill);
                }}
                className="text-neutral-400 hover:text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <Play className="w-3 h-3 fill-current text-red-500" />
                <span>Animate</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDiagram(drill);
                }}
                className="text-neutral-400 hover:text-white font-medium flex items-center gap-1 text-[11px]"
              >
                <Edit2 className="w-3 h-3 text-neutral-400" />
                <span>Edit</span>
              </button>
            </div>
            <span className="text-red-400 hover:text-red-300 font-bold group-hover:underline flex items-center gap-1">
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
