import React, { useState, useEffect } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  ShieldAlert,
  Play,
  Users,
  Compass,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Coach, Drill, PitchSector, SessionSlot } from '../../types';
import {
  parseTimeToMinutes,
  resolvePitchWaves,
  resolveAwayWave,
  getSlotTimeRangeMinutes,
} from '../../utils/pitchsideWaveResolver';
import { useWhistleAudio } from '../PitchSideCompanion/hooks/useWhistleAudio';

export interface PitchsideCockpitHUDProps {
  slots: SessionSlot[];
  coaches: Coach[];
  drills: Drill[];
  sectors: PitchSector[];
  selectedDate: string;
  isSunMode?: boolean;
  onSelectSlot: (slot: SessionSlot) => void;
  onOpenPitchCompanion: (slot?: SessionSlot) => void;
  onOpenEmergencyModal: (slot?: SessionSlot) => void;
  onNavigateTab: (tab: string) => void;
}

export const PitchsideCockpitHUD: React.FC<PitchsideCockpitHUDProps> = ({
  slots,
  coaches,
  drills,
  sectors,
  selectedDate,
  isSunMode = false,
  onSelectSlot,
  onOpenPitchCompanion,
  onOpenEmergencyModal,
  onNavigateTab,
}) => {
  // Real-time minute tracking
  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Simulated Time Picker / Live Now toggle
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>('10:45');

  // Audio Whistle Synthesizer
  const {
    whistleAudioEnabled,
    toggleWhistleAudio,
    playRefereeWhistle,
    whistlePlayedToast,
    whistleToastText,
  } = useWhistleAudio();

  // Tick every 30 seconds when live clock is active
  useEffect(() => {
    if (!isLiveClock) return;

    const updateClock = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, [isLiveClock]);

  // When switching simulated time
  const handleSimulatedTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSimulatedTimeStr(val);
    const parsed = parseTimeToMinutes(val);
    if (parsed > 0 || val === '00:00') {
      setCurrentMinutes(parsed);
    }
  };

  const handleToggleLiveMode = () => {
    if (!isLiveClock) {
      // Re-enable real clock
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
      setIsLiveClock(true);
    } else {
      // Enter simulation mode
      setIsLiveClock(false);
      setCurrentMinutes(parseTimeToMinutes(simulatedTimeStr));
    }
  };

  // Filter slots for selected date
  const dateSlots = slots.filter((s) => s.date === selectedDate);
  const effectiveSlots = dateSlots.length > 0 ? dateSlots : slots;

  // Resolve Milltown waves & Away isolation
  const waveResult = resolvePitchWaves(slots, currentMinutes, effectiveSlots);
  const awayResult = resolveAwayWave(effectiveSlots, currentMinutes);

  // Helper formatting for minutes to "HH:MM"
  const formatMinutesToTime = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Helper to render coach chips
  const renderCoachBadges = (coachIds: string[]) => {
    if (!coachIds || coachIds.length === 0) {
      return (
        <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> Staffing needed
        </span>
      );
    }

    const assigned = coachIds
      .map((id) => coaches.find((c) => c.id === id))
      .filter((c): c is Coach => Boolean(c));

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {assigned.map((coach, idx) => (
          <span
            key={coach.id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
              idx === 0
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-neutral-900 text-neutral-300'
            }`}
            title={coach.role}
          >
            {idx === 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            {coach.name}
            {idx === 0 && <span className="text-[9px] text-neutral-400 uppercase font-mono-data">(Lead)</span>}
          </span>
        ))}
      </div>
    );
  };

  // Helper to render drill details
  const renderDrillDetails = (drillIds: string[]) => {
    const count = drillIds ? drillIds.length : 0;
    if (count === 0) {
      return (
        <span className="text-xs text-neutral-400 italic">No drills attached yet</span>
      );
    }
    const firstDrill = drills.find((d) => d.id === drillIds[0]);
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-300">
        <span className="px-1.5 py-0.5 rounded bg-red-950/70 border border-red-800/80 text-red-300 font-mono-data text-[10px] font-bold">
          {count} {count === 1 ? 'drill' : 'drills'}
        </span>
        <span className="truncate max-w-[200px] text-neutral-200 font-medium">
          {firstDrill ? firstDrill.title : 'Attached drills ready'}
        </span>
      </div>
    );
  };

  // Helper to calculate wave progress % and remaining minutes
  const calculateWaveProgress = (slot: SessionSlot) => {
    const { startMinutes, endMinutes } = getSlotTimeRangeMinutes(slot);
    const duration = Math.max(1, endMinutes - startMinutes);
    const elapsed = Math.max(0, currentMinutes - startMinutes);
    const remaining = Math.max(0, endMinutes - currentMinutes);
    const pct = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
    return { pct, remaining, duration };
  };

  const { turfNow, turfNext, isFallback } = waveResult;
  const p1NowSlot = turfNow.pitch1[0];
  const p2NowSlot = turfNow.pitch2[0];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
        isSunMode
          ? 'bg-white border-neutral-300 text-neutral-900'
          : 'bg-neutral-950 border-neutral-800 text-white'
      }`}
    >
      {/* Toast Alert for Whistle */}
      {whistlePlayedToast && (
        <div className="bg-red-600 text-white px-4 py-2 font-black text-xs uppercase tracking-wider text-center animate-bounce">
          {whistleToastText}
        </div>
      )}

      {/* TOP COCKPIT HEADER BAR */}
      <div className="p-4 sm:p-5 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-md flex items-center justify-center">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-data font-bold uppercase tracking-wider text-red-400">
                Sunday Pitchside Cockpit
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-[11px] text-neutral-400 font-mono-data">
                {selectedDate}
              </span>
              {isFallback && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Standby / Preview
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Live Turf HUD
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-750 text-neutral-300 font-normal font-mono-data">
                Milltown AstroTurf
              </span>
            </h2>
          </div>
        </div>

        {/* CONTROLS: Clock Mode + Whistle + Emergency EAP */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pitch Clock / Simulator */}
          <div className="flex items-center bg-neutral-900 border border-neutral-750 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={handleToggleLiveMode}
              className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold font-mono-data flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isLiveClock
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
              title={isLiveClock ? 'Tracking device clock' : 'Click to resume live clock'}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isLiveClock ? 'LIVE' : 'SIMULATING'}</span>
              <span className="text-xs font-mono-data ml-1">
                {formatMinutesToTime(currentMinutes)}
              </span>
            </button>

            {!isLiveClock && (
              <input
                type="time"
                value={simulatedTimeStr}
                onChange={handleSimulatedTimeChange}
                aria-label="Simulated Sunday Time"
                className="bg-black text-white text-xs font-mono-data px-2 py-1.5 rounded-lg border border-neutral-700 min-h-[44px] focus:outline-none focus:border-red-500"
              />
            )}
          </div>

          {/* Quick Whistle Trigger */}
          <button
            type="button"
            onClick={() => playRefereeWhistle('rotation')}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            title="Blow referee whistle (double blast rotation)"
          >
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              {whistleAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </span>
            <span className="hidden sm:inline">Blow Whistle</span>
            <span className="sm:hidden">Whistle</span>
          </button>

          {/* 1-Tap Emergency EAP Button */}
          <button
            type="button"
            onClick={() => onOpenEmergencyModal(p1NowSlot || p2NowSlot || undefined)}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md border border-red-500"
            title="Open Emergency Action Plan & Pitch Defibrillator Protocol"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency EAP</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* SECTION 1: NOW ON TURF (Side-by-side Milltown Pitch 1 & Pitch 2 split) */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono-data">
                {isFallback ? 'NEXT SCHEDULED WAVE' : 'NOW ON TURF (ACTIVE WAVE)'}
              </h3>
            </div>
            {waveResult.waveStartMinutes !== null && waveResult.waveEndMinutes !== null && (
              <span className="text-xs font-mono-data text-neutral-400">
                Wave: {formatMinutesToTime(waveResult.waveStartMinutes)} –{' '}
                {formatMinutesToTime(waveResult.waveEndMinutes)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PITCH 1 (FRONT TURF) CARD */}
            <div className="bg-black border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-neutral-700 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Sector & Timing Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono-data text-xs font-black">
                      Pitch 1 (Front)
                    </span>
                    <span className="text-xs text-neutral-400 font-mono-data">
                      Pavilion End
                    </span>
                  </div>
                  {p1NowSlot && (
                    <span className="text-xs font-mono-data font-semibold text-neutral-300">
                      {p1NowSlot.timeSlot || `${p1NowSlot.startTime}–${p1NowSlot.endTime}`}
                    </span>
                  )}
                </div>

                {p1NowSlot ? (
                  <>
                    {/* Squad & Title */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-750">
                          {p1NowSlot.ageGroupId}
                        </span>
                        <span className="text-xs text-neutral-400">{p1NowSlot.pathway}</span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1.5 line-clamp-1">
                        {p1NowSlot.sessionTitle}
                      </h4>
                    </div>

                    {/* Progress Bar & Countdown */}
                    {(() => {
                      const { pct, remaining } = calculateWaveProgress(p1NowSlot);
                      return (
                        <div className="space-y-1.5 mb-4 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                          <div className="flex items-center justify-between text-[11px] font-mono-data">
                            <span className="text-neutral-400">Session Progress</span>
                            <span className="text-emerald-400 font-bold">
                              {isFallback ? 'Pending start' : `${remaining}m remaining`}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${isFallback ? 0 : pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Assigned Coaches */}
                    <div className="mb-3">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        Assigned Coaches:
                      </p>
                      {renderCoachBadges(p1NowSlot.assignedCoachIds)}
                    </div>

                    {/* Attached Drills */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        Training Curriculum:
                      </p>
                      {renderDrillDetails(p1NowSlot.attachedDrillIds || p1NowSlot.drillIds || [])}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-neutral-500">
                    <p className="text-sm font-semibold">Pitch 1 Unoccupied</p>
                    <p className="text-xs text-neutral-400 mt-1">No session scheduled on Front turf for this wave</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                {p1NowSlot && (
                  <button
                    type="button"
                    onClick={() => onOpenPitchCompanion(p1NowSlot)}
                    className="flex-1 min-h-[48px] px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch Pitchside Companion</span>
                  </button>
                )}
                {p1NowSlot && (
                  <button
                    type="button"
                    onClick={() => onSelectSlot(p1NowSlot)}
                    className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="View slot details"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* PITCH 2 (BACK TURF) CARD */}
            <div className="bg-black border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-neutral-700 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-600/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Sector & Timing Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-white border border-neutral-700 font-mono-data text-xs font-black">
                      Pitch 2 (Back)
                    </span>
                    <span className="text-xs text-neutral-400 font-mono-data">
                      School End
                    </span>
                  </div>
                  {p2NowSlot && (
                    <span className="text-xs font-mono-data font-semibold text-neutral-300">
                      {p2NowSlot.timeSlot || `${p2NowSlot.startTime}–${p2NowSlot.endTime}`}
                    </span>
                  )}
                </div>

                {p2NowSlot ? (
                  <>
                    {/* Squad & Title */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-750">
                          {p2NowSlot.ageGroupId}
                        </span>
                        <span className="text-xs text-neutral-400">{p2NowSlot.pathway}</span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1.5 line-clamp-1">
                        {p2NowSlot.sessionTitle}
                      </h4>
                    </div>

                    {/* Progress Bar & Countdown */}
                    {(() => {
                      const { pct, remaining } = calculateWaveProgress(p2NowSlot);
                      return (
                        <div className="space-y-1.5 mb-4 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                          <div className="flex items-center justify-between text-[11px] font-mono-data">
                            <span className="text-neutral-400">Session Progress</span>
                            <span className="text-emerald-400 font-bold">
                              {isFallback ? 'Pending start' : `${remaining}m remaining`}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${isFallback ? 0 : pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Assigned Coaches */}
                    <div className="mb-3">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        Assigned Coaches:
                      </p>
                      {renderCoachBadges(p2NowSlot.assignedCoachIds)}
                    </div>

                    {/* Attached Drills */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                        Training Curriculum:
                      </p>
                      {renderDrillDetails(p2NowSlot.attachedDrillIds || p2NowSlot.drillIds || [])}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-neutral-500">
                    <p className="text-sm font-semibold">Pitch 2 Unoccupied</p>
                    <p className="text-xs text-neutral-400 mt-1">No session scheduled on Back turf for this wave</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                {p2NowSlot && (
                  <button
                    type="button"
                    onClick={() => onOpenPitchCompanion(p2NowSlot)}
                    className="flex-1 min-h-[48px] px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch Pitchside Companion</span>
                  </button>
                )}
                {p2NowSlot && (
                  <button
                    type="button"
                    onClick={() => onSelectSlot(p2NowSlot)}
                    className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="View slot details"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: NEXT WAVE UP */}
        <div className="bg-black/60 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono-data flex items-center gap-2">
              <span>NEXT WAVE UP (INCOMING SQUADS)</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('timetable')}
              className="text-xs text-red-400 hover:text-white font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              <span>View Full Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {waveResult.nextSlots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {waveResult.nextSlots.map((nextSlot) => {
                const sector = sectors.find((s) => s.id === nextSlot.pitchSectorId);
                const leadCoach = coaches.find((c) => c.id === nextSlot.assignedCoachIds[0]);

                return (
                  <div
                    key={nextSlot.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectSlot(nextSlot)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSlot(nextSlot);
                      }
                    }}
                    className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all active:scale-95 select-none flex flex-col justify-between gap-2"
                    aria-label={`Upcoming session ${nextSlot.ageGroupId} ${nextSlot.sessionTitle}`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono-data font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">
                          {sector?.code || 'Turf'}
                        </span>
                        <span className="font-mono-data text-amber-400 font-bold">
                          {nextSlot.startTime || nextSlot.timeSlot}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {nextSlot.ageGroupId} — {nextSlot.sessionTitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                      <span>Lead: {leadCoach ? leadCoach.name : 'Needs coach'}</span>
                      <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                        Gear Ready ✓
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 italic py-2">
              No further waves scheduled on Milltown turf today.
            </p>
          )}
        </div>

        {/* SECTION 3: AWAY SQUADS PLAYING OFF-SITE (Away Isolation Contract) */}
        {awayResult.allAwaySlots.length > 0 && (
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono-data">
                  Away Squads Playing Off-Site (Isolated from Turf)
                </h4>
              </div>
              <span className="text-[11px] font-mono-data text-neutral-400">
                {awayResult.allAwaySlots.length} Away {awayResult.allAwaySlots.length === 1 ? 'Match' : 'Matches'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {awayResult.allAwaySlots.map((away) => {
                const leadCoach = coaches.find((c) => c.id === away.assignedCoachIds[0]);
                const isActive = awayResult.activeAwaySlots.some((a) => a.id === away.id);

                return (
                  <div
                    key={away.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectSlot(away)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSlot(away);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all active:scale-95 select-none ${
                      isActive
                        ? 'bg-sky-950/40 border-sky-800/80 text-sky-100'
                        : 'bg-black/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                    aria-label={`Away match ${away.ageGroupId} ${away.sessionTitle}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{away.ageGroupId}</span>
                      <span className="font-mono-data text-[11px] text-sky-400 font-semibold">
                        {away.startTime || away.timeSlot}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 line-clamp-1">
                      {away.sessionTitle}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between">
                      <span>Venue: {away.venueName || 'Away'}</span>
                      {leadCoach && <span>Lead: {leadCoach.name}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
