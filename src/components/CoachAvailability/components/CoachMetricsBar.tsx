import React from 'react';

export interface CoachMetricsBarProps {
  totalRoster: number;
  countAvailable: number;
  countAssigned: number;
  countUnassigned: number;
  countSeniorMatch: number;
  countMorningOnly: number;
  countAway: number;
}

export const CoachMetricsBar: React.FC<CoachMetricsBarProps> = ({
  totalRoster,
  countAvailable,
  countAssigned,
  countUnassigned,
  countSeniorMatch,
  countMorningOnly,
  countAway,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {/* 1. Total Roster */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-neutral-400 font-semibold">Total Coaches</span>
        <div className="text-2xl font-bold text-white font-mono-data mt-1">{totalRoster}</div>
        <span className="text-[10px] text-neutral-400">Old Alex Roster</span>
      </div>

      {/* 2. Available for Sunday */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-emerald-400 font-semibold">Available</span>
        <div className="text-2xl font-bold text-emerald-400 font-mono-data mt-1">
          {countAvailable}
        </div>
        <span className="text-[10px] text-neutral-400">Ready for pitch slots</span>
      </div>

      {/* 3. Assigned to Pitch */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-cyan-400 font-semibold">Assigned to Pitch</span>
        <div className="text-2xl font-bold text-cyan-400 font-mono-data mt-1">
          {countAssigned}
        </div>
        <span className="text-[10px] text-neutral-400">Active on Sunday schedule</span>
      </div>

      {/* 4. Unassigned / Float */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-amber-400 font-semibold">Unassigned / Float</span>
        <div className="text-2xl font-bold text-amber-400 font-mono-data mt-1">
          {countUnassigned}
        </div>
        <span className="text-[10px] text-neutral-400">Available reserve pool</span>
      </div>

      {/* 5. Senior Match Duty */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-red-400 font-semibold">Senior Match Duty</span>
        <div className="text-2xl font-bold text-red-400 font-mono-data mt-1">
          {countSeniorMatch}
        </div>
        <span className="text-[10px] text-neutral-400">EYHL / Leinster League</span>
      </div>

      {/* 6. Morning Only */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-white font-semibold">Morning Only</span>
        <div className="text-2xl font-bold text-white font-mono-data mt-1">
          {countMorningOnly}
        </div>
        <span className="text-[10px] text-neutral-400">10:45 slot only</span>
      </div>

      {/* 7. Away / Unavailable */}
      <div className="bg-black border border-neutral-800 p-4 rounded-xl">
        <span className="text-xs text-neutral-400 font-semibold">Away / Unavail</span>
        <div className="text-2xl font-bold text-neutral-400 font-mono-data mt-1">{countAway}</div>
        <span className="text-[10px] text-neutral-400">Study / Work / Travel</span>
      </div>
    </div>
  );
};
