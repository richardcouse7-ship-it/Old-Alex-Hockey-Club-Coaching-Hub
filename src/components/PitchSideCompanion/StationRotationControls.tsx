import React from 'react';

export interface StationRotationControlsProps {
  currentStation: number;
  totalStations: number;
  autoAdvanceStation: boolean;
  onSetAutoAdvanceStation: (autoAdvance: boolean) => void;
  onPrevStation: () => void;
  onNextStation: () => void;
}

export const StationRotationControls: React.FC<StationRotationControlsProps> = ({
  currentStation,
  totalStations,
  autoAdvanceStation,
  onSetAutoAdvanceStation,
  onPrevStation,
  onNextStation,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono-data text-neutral-400">
        <span className="uppercase tracking-wider text-red-400 font-bold">
          Station Circuit
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
          <input
            type="checkbox"
            checked={autoAdvanceStation}
            onChange={(e) => onSetAutoAdvanceStation(e.target.checked)}
            className="rounded accent-red-600 w-3.5 h-3.5"
          />
          <span>Auto-Advance Station</span>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Station {currentStation} of {totalStations}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevStation}
            className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onNextStation}
            className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
