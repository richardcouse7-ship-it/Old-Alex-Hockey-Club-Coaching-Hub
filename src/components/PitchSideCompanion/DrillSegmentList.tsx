import React from 'react';
import { FileText } from 'lucide-react';
import { DrillSegment } from './types';

export interface DrillSegmentListProps {
  segments: DrillSegment[];
  activeSegmentIndex: number;
  totalSessionMinutes: number;
  isSessionMode: boolean;
  onSelectSegment: (index: number) => void;
}

export const DrillSegmentList: React.FC<DrillSegmentListProps> = ({
  segments,
  activeSegmentIndex,
  totalSessionMinutes,
  isSessionMode,
  onSelectSegment,
}) => {
  return (
    <div className="space-y-2 flex-1">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-500" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Drill Running Order
          </h4>
        </div>
        <span className="text-[11px] font-mono-data text-neutral-400">
          {totalSessionMinutes} mins
        </span>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {segments.map((seg, idx) => {
          const isActive = idx === activeSegmentIndex && isSessionMode;
          return (
            <button
              key={seg.id}
              type="button"
              onClick={() => onSelectSegment(idx)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                isActive
                  ? 'bg-neutral-900 border-red-500 shadow-md text-white'
                  : seg.completed
                  ? 'bg-black border-neutral-850 text-neutral-500 line-through opacity-70'
                  : 'bg-black border-neutral-850 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md text-[11px] font-mono-data font-bold flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : seg.completed
                      ? 'bg-neutral-900 text-neutral-400 border border-neutral-750'
                      : 'bg-neutral-900 text-neutral-300'
                  }`}
                >
                  {seg.completed ? '✓' : idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {seg.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 capitalize">
                    {seg.category}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono-data text-red-400 shrink-0 font-bold">
                {seg.durationMinutes}m
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
