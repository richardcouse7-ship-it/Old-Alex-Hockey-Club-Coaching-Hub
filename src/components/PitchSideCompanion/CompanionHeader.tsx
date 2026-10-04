import React from 'react';
import { Clock, Volume2, VolumeX, Maximize2, Minimize2, X, Radio } from 'lucide-react';
import { PitchSector, SessionSlot } from '../../types';

export interface CompanionHeaderProps {
  slot: SessionSlot | null;
  sector?: PitchSector;
  allSlots?: SessionSlot[];
  allSectors?: PitchSector[];
  onSelectSlot?: (slot: SessionSlot) => void;
  whistleAudioEnabled: boolean;
  onToggleWhistleAudio: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export const CompanionHeader: React.FC<CompanionHeaderProps> = ({
  slot,
  sector,
  allSlots = [],
  allSectors = [],
  onSelectSlot,
  whistleAudioEnabled,
  onToggleWhistleAudio,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}) => {
  return (
    <>
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-black border-b border-neutral-850 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                Pitch-Side Companion · Live Turf Mode
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {'wakeLock' in navigator && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-400 font-mono">
                  Screen Awake ⚡
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{slot ? `${slot.ageGroupId} on Pitch` : 'Pitch Session Timer'}</span>
              {sector && (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-neutral-900 text-red-400 font-mono-data font-bold border border-red-500/30">
                  {sector.code}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Quick Header Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleWhistleAudio}
            className={`p-2.5 rounded-xl border transition-colors ${
              whistleAudioEnabled
                ? 'bg-neutral-900 text-red-400 border-red-500/30'
                : 'bg-neutral-950 text-neutral-500 border-neutral-850'
            }`}
            title={whistleAudioEnabled ? 'Whistle Sound ON' : 'Whistle Sound MUTED'}
          >
            {whistleAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
            title="Toggle Fullscreen Turf Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pitch Sector Switcher Bar (Quickly jump between P1N, P1S, P2N, P2S on turf) */}
      {allSlots.length > 0 && onSelectSlot && (
        <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-850 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono-data uppercase tracking-wider text-neutral-400 shrink-0 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-red-500" />
            <span>Sectors:</span>
          </span>
          {allSlots.map((s) => {
            const sec = allSectors.find((p) => p.id === s.pitchSectorId);
            const isSelected = slot?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSlot(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                    : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <span className="font-mono-data font-bold">{sec?.code || 'P'}</span>
                <span className="ml-1.5 opacity-90">{s.ageGroupId}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
