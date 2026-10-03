import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Clock,
  Users,
  ShieldAlert,
  Flame,
  FileText,
  Timer,
  Activity,
  Plus,
  Radio,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { Coach, Drill, PitchSector, SessionSlot } from '../../types';

interface PitchSideCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: SessionSlot | null;
  coaches: Coach[];
  sector?: PitchSector;
  allDrills: Drill[];
  allSlots?: SessionSlot[];
  allSectors?: PitchSector[];
  onSelectSlot?: (slot: SessionSlot) => void;
  onLogIncidentPrompt?: (sectorCode: string, ageGroup: string) => void;
}

export type TimerMode = 'station' | 'match' | 'session';

interface DrillSegment {
  id: string;
  name: string;
  durationMinutes: number;
  category: 'warmup' | 'technical' | 'tactical' | 'game' | 'debrief';
  notes?: string;
  completed: boolean;
}

export const PitchSideCompanionModal: React.FC<PitchSideCompanionModalProps> = ({
  isOpen,
  onClose,
  slot,
  coaches,
  sector,
  allDrills,
  allSlots = [],
  allSectors = [],
  onSelectSlot,
  onLogIncidentPrompt,
}) => {
  // Timer Mode: Station Rotation vs Match Half vs Session Plan
  const [timerMode, setTimerMode] = useState<TimerMode>('station');

  // Station Rotation State
  const [currentStation, setCurrentStation] = useState(1);
  const [totalStations, setTotalStations] = useState(4);
  const [autoAdvanceStation, setAutoAdvanceStation] = useState(true);

  // Match Half State
  const [matchPeriod, setMatchPeriod] = useState<'1st Half' | '2nd Half' | 'Half-Time Break'>('1st Half');

  // Build segments from attached drills or standard structure
  const buildSegments = (currentSlot: SessionSlot | null): DrillSegment[] => {
    const slotDrillIds = currentSlot ? currentSlot.drillIds || currentSlot.attachedDrillIds || [] : [];
    if (currentSlot && slotDrillIds.length > 0) {
      const attached = slotDrillIds
        .map((id: string) => allDrills.find((d) => d.id === id))
        .filter(Boolean) as Drill[];

      return [
        {
          id: 'seg-warmup',
          name: 'Dynamic Warmup & Agility Ladders',
          durationMinutes: 8,
          category: 'warmup',
          notes: 'High knees, lateral bounds, stick carry through ladders',
          completed: false,
        },
        ...attached.map((d, idx) => ({
          id: `seg-drill-${idx}`,
          name: d.title,
          durationMinutes: d.durationMinutes || 15,
          category: (idx % 2 === 0 ? 'technical' : 'tactical') as DrillSegment['category'],
          notes: d.coachingPoints.slice(0, 2).join(' · '),
          completed: false,
        })),
        {
          id: 'seg-game',
          name: 'Conditioned Small Sided Game',
          durationMinutes: 20,
          category: 'game',
          notes: '3-pass minimum before circle entry',
          completed: false,
        },
        {
          id: 'seg-debrief',
          name: 'Cool Down & Coaching Debrief',
          durationMinutes: 5,
          category: 'debrief',
          notes: 'Praise effort, review key learning habits',
          completed: false,
        },
      ];
    }

    return [
      {
        id: 'seg-1',
        name: 'Dynamic Warm-Up & Ladder Footwork',
        durationMinutes: 8,
        category: 'warmup',
        notes: 'Raise heart rate, mobilize hips and wrists',
        completed: false,
      },
      {
        id: 'seg-2',
        name: 'Stick Skills & Elimination (1v1)',
        durationMinutes: 10,
        category: 'technical',
        notes: 'Soft hands, head up scanning, 3D lift',
        completed: false,
      },
      {
        id: 'seg-3',
        name: '2v1 Overload & Passing Channel',
        durationMinutes: 12,
        category: 'tactical',
        notes: 'Commit defender before releasing the ball',
        completed: false,
      },
      {
        id: 'seg-4',
        name: 'Small Sided Match Play',
        durationMinutes: 20,
        category: 'game',
        notes: 'Full pitch width, quick transitions',
        completed: false,
      },
      {
        id: 'seg-5',
        name: 'Debrief & Equipment Collection',
        durationMinutes: 5,
        category: 'debrief',
        notes: 'Ball count check into sector bag',
        completed: false,
      },
    ];
  };

  const [segments, setSegments] = useState<DrillSegment[]>(() => buildSegments(slot));
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Time tracking
  const [secondsRemaining, setSecondsRemaining] = useState(10 * 60); // default 10m
  const [isRunning, setIsRunning] = useState(false);
  const [whistleAudioEnabled, setWhistleAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pitchNotes, setPitchNotes] = useState<string[]>([]);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [whistlePlayedToast, setWhistlePlayedToast] = useState(false);
  const [whistleToastText, setWhistleToastText] = useState('WHISTLE BLOWN! 🏑');
  const [visualStrobeActive, setVisualStrobeActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

  // Sync segments when slot changes
  useEffect(() => {
    if (!isRunning) {
      const newSegments = buildSegments(slot);
      setSegments(newSegments);
      setActiveSegmentIndex(0);
      if (timerMode === 'session') {
        setSecondsRemaining((newSegments[0]?.durationMinutes || 10) * 60);
      }
    }
  }, [slot?.id]);

  // Screen Wake Lock API — keeps phone / iPad screen awake on turf
  useEffect(() => {
    const acquireWakeLock = async () => {
      if ('wakeLock' in navigator && isRunning) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Wake lock rejected or not supported on this platform
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // ignore
        }
        wakeLockRef.current = null;
      }
    };

    if (isRunning) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isRunning]);

  // Sound synthesizer for realistic referee whistle with FM modulation (pea flutter)
  const playRefereeWhistle = (type: 'short' | 'rotation' | 'fulltime' = 'rotation') => {
    if (!whistleAudioEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const blowBlast = (delay: number, duration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Modulator for realistic referee whistle trill/flutter
        const modOsc = ctx.createOscillator();
        const modGain = ctx.createGain();

        modOsc.frequency.setValueAtTime(26, ctx.currentTime + delay);
        modGain.gain.setValueAtTime(140, ctx.currentTime + delay);
        modOsc.connect(osc.frequency);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.03);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay + duration - 0.04);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        modOsc.start(ctx.currentTime + delay);
        osc.start(ctx.currentTime + delay);

        modOsc.stop(ctx.currentTime + delay + duration);
        osc.stop(ctx.currentTime + delay + duration);
      };

      if (type === 'short') {
        blowBlast(0, 0.22, 2800);
        setWhistleToastText('ATTENTION / RESTART! 🏑');
      } else if (type === 'fulltime') {
        blowBlast(0, 0.18, 2750);
        blowBlast(0.24, 0.18, 2750);
        blowBlast(0.48, 0.7, 2600);
        setWhistleToastText('FULL TIME / SESSION STOP! 🏑');
      } else {
        blowBlast(0, 0.2, 2800);
        blowBlast(0.28, 0.35, 2750);
        setWhistleToastText('ROTATE STATIONS! 🏑');
      }

      setWhistlePlayedToast(true);
      setTimeout(() => setWhistlePlayedToast(false), 2400);
    } catch {
      // Audio fallback silent
    }
  };

  // Timer interval with visual strobe and auto-advancement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Time expired! Trigger whistle & visual strobe
            setVisualStrobeActive(true);
            setTimeout(() => setVisualStrobeActive(false), 3500);

            if (timerMode === 'station') {
              playRefereeWhistle('rotation');
              if (autoAdvanceStation && currentStation < totalStations) {
                setCurrentStation((s) => s + 1);
                // Reset to default station length (e.g. 10m)
                return 10 * 60;
              } else {
                setIsRunning(false);
                return 0;
              }
            } else if (timerMode === 'match') {
              playRefereeWhistle('fulltime');
              setIsRunning(false);
              return 0;
            } else {
              // Session mode
              const isLast = activeSegmentIndex === segments.length - 1;
              playRefereeWhistle(isLast ? 'fulltime' : 'rotation');

              setSegments((curr) =>
                curr.map((seg, idx) => (idx === activeSegmentIndex ? { ...seg, completed: true } : seg))
              );

              if (!isLast) {
                const nextIdx = activeSegmentIndex + 1;
                setActiveSegmentIndex(nextIdx);
                return (segments[nextIdx]?.durationMinutes || 10) * 60;
              } else {
                setIsRunning(false);
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, autoAdvanceStation, currentStation, totalStations, activeSegmentIndex, segments]);

  // Presets
  const setPresetMinutes = (mins: number) => {
    setIsRunning(false);
    setSecondsRemaining(mins * 60);
  };

  const addTimeSeconds = (secs: number) => {
    setSecondsRemaining((prev) => Math.max(0, prev + secs));
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerMode === 'session') {
      setSecondsRemaining((segments[activeSegmentIndex]?.durationMinutes || 10) * 60);
    } else if (timerMode === 'station') {
      setSecondsRemaining(10 * 60);
    } else {
      setSecondsRemaining(20 * 60);
    }
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;
    const timeStr = new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
    const context =
      timerMode === 'station'
        ? `Station ${currentStation}`
        : timerMode === 'match'
        ? matchPeriod
        : segments[activeSegmentIndex]?.name || 'Pitch';

    setPitchNotes((prev) => [`[${timeStr} - ${context}]: ${quickNoteText.trim()}`, ...prev]);
    setQuickNoteText('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isWarningTime = secondsRemaining <= 30 && secondsRemaining > 0 && isRunning;

  const assignedCoachNames = slot
    ? coaches
        .filter((c) => slot.assignedCoachIds.includes(c.id))
        .map((c) => c.name)
        .join(', ') || 'Unassigned Coaches'
    : 'Lead Coach';

  const totalSessionMinutes = segments.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex flex-col transition-colors duration-200 ${
        visualStrobeActive ? 'bg-red-950 animate-pulse' : ''
      } ${isFullscreen ? 'p-0' : 'p-2 sm:p-5'}`}
    >
      <div
        className={`bg-neutral-950 border-2 rounded-3xl w-full max-w-5xl mx-auto my-auto shadow-2xl flex flex-col overflow-hidden transition-all ${
          visualStrobeActive
            ? 'border-red-500 shadow-red-600/50'
            : isWarningTime
            ? 'border-amber-500/80 shadow-amber-500/20'
            : 'border-neutral-800'
        }`}
      >
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
              onClick={() => setWhistleAudioEnabled(!whistleAudioEnabled)}
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
              onClick={toggleFullscreen}
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

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 bg-black border-b border-neutral-800 text-center text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTimerMode('station');
              setIsRunning(false);
              setSecondsRemaining(10 * 60);
            }}
            className={`py-3.5 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              timerMode === 'station'
                ? 'border-red-500 text-white bg-neutral-900/50'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-red-500" />
            <span>Station Rotation (Drills)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTimerMode('match');
              setIsRunning(false);
              setSecondsRemaining(20 * 60);
            }}
            className={`py-3.5 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              timerMode === 'match'
                ? 'border-red-500 text-white bg-neutral-900/50'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4 text-amber-500" />
            <span>Match Play & Halves</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTimerMode('session');
              setIsRunning(false);
              setSecondsRemaining((segments[activeSegmentIndex]?.durationMinutes || 10) * 60);
            }}
            className={`py-3.5 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              timerMode === 'session'
                ? 'border-red-500 text-white bg-neutral-900/50'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Session Plan ({totalSessionMinutes}m)</span>
          </button>
        </div>

        {/* Main Pitch Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          {/* Left Column: Big Timer Display & Controls (7 Cols) */}
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-6 bg-black">
            {/* Active Mode Status Header */}
            <div>
              {timerMode === 'station' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono-data text-neutral-400">
                    <span className="uppercase tracking-wider text-red-400 font-bold">
                      Station Circuit
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={autoAdvanceStation}
                        onChange={(e) => setAutoAdvanceStation(e.target.checked)}
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
                        onClick={() => setCurrentStation((s) => Math.max(1, s - 1))}
                        className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentStation((s) => Math.min(totalStations, s + 1))}
                        className="px-2.5 py-1 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {timerMode === 'match' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono-data text-amber-400 font-bold uppercase tracking-wider">
                    <span>Fixture Match Clock</span>
                    <span className="text-neutral-400 font-normal">Add stoppage time below</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['1st Half', 'Half-Time Break', '2nd Half'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          setMatchPeriod(period);
                          setIsRunning(false);
                          if (period === 'Half-Time Break') {
                            setSecondsRemaining(5 * 60);
                          } else {
                            setSecondsRemaining(20 * 60);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          matchPeriod === period
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {timerMode === 'session' && (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-data text-neutral-400 mb-1">
                    <span className="uppercase tracking-wider">
                      Phase {activeSegmentIndex + 1} of {segments.length} ·{' '}
                      {segments[activeSegmentIndex]?.category}
                    </span>
                    <span>Target: {segments[activeSegmentIndex]?.durationMinutes} mins</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {segments[activeSegmentIndex]?.name}
                  </h3>
                  {segments[activeSegmentIndex]?.notes && (
                    <p className="text-xs text-neutral-200 mt-1 font-medium bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                      🎯 Focus: {segments[activeSegmentIndex]?.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Giant Digital Stopwatch Display with Strobe Alert */}
            <div
              className={`bg-neutral-950 border-2 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl transition-all ${
                visualStrobeActive
                  ? 'border-red-500 bg-red-950/60'
                  : isWarningTime
                  ? 'border-amber-500/90 shadow-amber-500/20'
                  : 'border-neutral-850'
              }`}
            >
              <div
                className={`text-6xl sm:text-8xl md:text-9xl font-extrabold font-mono-data tracking-tight ${
                  visualStrobeActive
                    ? 'text-white animate-bounce'
                    : isWarningTime
                    ? 'text-amber-400 animate-pulse'
                    : isRunning
                    ? 'text-white'
                    : 'text-neutral-400'
                }`}
              >
                {formattedTime}
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-400">
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${
                    isRunning ? 'bg-red-500 animate-ping' : 'bg-neutral-600'
                  }`}
                />
                <span>
                  {isRunning ? 'Turf Clock Ticking' : 'Clock Paused — Ready to Resume'}
                </span>
              </div>

              {/* Whistle Toast / Visual Flash Overlay */}
              {(whistlePlayedToast || visualStrobeActive) && (
                <div className="absolute inset-0 bg-red-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white text-xl sm:text-2xl font-black animate-in fade-in duration-100 z-10">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Flame className="w-8 h-8 animate-bounce" />
                    <span>{whistleToastText}</span>
                  </div>
                  <span className="text-xs font-normal text-neutral-300">
                    High-Visibility Turf Strobe
                  </span>
                </div>
              )}
            </div>

            {/* Quick Presets Bar (Glove-Friendly Touch Targets) */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono-data uppercase tracking-wider text-neutral-400">
                Quick 1-Tap Presets
              </span>
              <div className="grid grid-cols-6 gap-2">
                {[5, 8, 10, 12, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPresetMinutes(mins)}
                    className="py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-white font-mono-data font-bold text-xs transition-all active:scale-95"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Match Stoppage Time / Extra Adders (for Match Play Mode) */}
            {timerMode === 'match' && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-xs font-mono-data text-amber-400 font-bold">Stoppage Time:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addTimeSeconds(30)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-750 text-xs font-bold text-white hover:bg-neutral-850 transition-colors"
                  >
                    +30s
                  </button>
                  <button
                    type="button"
                    onClick={() => addTimeSeconds(60)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-750 text-xs font-bold text-white hover:bg-neutral-850 transition-colors"
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    onClick={() => addTimeSeconds(120)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-750 text-xs font-bold text-white hover:bg-neutral-850 transition-colors"
                  >
                    +2m
                  </button>
                </div>
              </div>
            )}

            {/* Main Playback & Large Controls (Glove Friendly) */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (timerMode === 'session' && activeSegmentIndex > 0) {
                      setActiveSegmentIndex((i) => i - 1);
                      setSecondsRemaining((segments[activeSegmentIndex - 1]?.durationMinutes || 10) * 60);
                      setIsRunning(false);
                    } else if (timerMode === 'station') {
                      setCurrentStation((s) => Math.max(1, s - 1));
                    }
                  }}
                  className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-all active:scale-95"
                  title="Previous"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 max-w-sm py-4 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 border ${
                    isRunning
                      ? 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700'
                      : 'bg-red-600 hover:bg-red-500 border-red-500 shadow-red-600/30'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-6 h-6 fill-current" />
                      <span>PAUSE CLOCK</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 fill-current" />
                      <span>START TIMER</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playRefereeWhistle('rotation');
                    if (timerMode === 'session' && activeSegmentIndex < segments.length - 1) {
                      setActiveSegmentIndex((i) => i + 1);
                      setSecondsRemaining((segments[activeSegmentIndex + 1]?.durationMinutes || 10) * 60);
                      setIsRunning(false);
                    } else if (timerMode === 'station') {
                      setCurrentStation((s) => Math.min(totalStations, s + 1));
                    }
                  }}
                  className="p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-all active:scale-95"
                  title="Next (blows whistle)"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Sub controls: +1 Min, Reset */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => addTimeSeconds(60)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition-colors"
                >
                  +1 Minute
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Clock</span>
                </button>
              </div>
            </div>

            {/* On-Demand Whistle Blast Bar */}
            <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-2xl space-y-2">
              <span className="text-[11px] font-mono-data uppercase tracking-wider text-neutral-400">
                Manual Referee Whistle Blasts
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => playRefereeWhistle('short')}
                  className="py-2 px-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>1 Tweet (Foul)</span>
                </button>
                <button
                  type="button"
                  onClick={() => playRefereeWhistle('rotation')}
                  className="py-2 px-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>2 Tweets (Rotate)</span>
                </button>
                <button
                  type="button"
                  onClick={() => playRefereeWhistle('fulltime')}
                  className="py-2 px-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  <span>3 Blasts (Stop)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Running Order, Squad Details & Pitch Notes (5 Cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-neutral-950">
            {/* Squad & Assigned Coaches Card */}
            <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 uppercase tracking-wider font-mono-data text-[10px]">
                  Pitch Sector & Squad
                </span>
                <span className="text-red-400 font-bold font-mono-data">
                  {sector?.code || 'Pitch'}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white">
                {slot?.ageGroupId || 'Youth Squad'}
              </h4>
              <p className="text-xs text-neutral-300 flex items-center gap-1.5 pt-0.5">
                <Users className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{assignedCoachNames}</span>
              </p>
            </div>

            {/* Running Order List */}
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
                  const isActive = idx === activeSegmentIndex && timerMode === 'session';
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => {
                        setTimerMode('session');
                        setActiveSegmentIndex(idx);
                        setSecondsRemaining(seg.durationMinutes * 60);
                        setIsRunning(false);
                      }}
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

            {/* Pitch-Side Notes & Debrief Logger */}
            <div className="space-y-2 pt-2 border-t border-neutral-850">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>Pitch Observations & Debrief</span>
              </h4>

              <form onSubmit={handleAddQuickNote} className="flex gap-2">
                <input
                  type="text"
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Quick turf note (e.g. reverse sweep progress)..."
                  className="flex-1 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!quickNoteText.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                >
                  Save
                </button>
              </form>

              {pitchNotes.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto bg-black p-2.5 rounded-xl border border-neutral-850">
                  {pitchNotes.map((note, idx) => (
                    <p key={idx} className="text-[11px] text-neutral-200 leading-snug">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Quick First Aid / Kit Shed Alert Button */}
            <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-200">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>Need ice pack, first aid, or ball bag?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onLogIncidentPrompt && sector) {
                    onLogIncidentPrompt(sector.code, slot?.ageGroupId || 'Youth');
                  }
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shrink-0"
              >
                Kit Shed / Ice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchSideCompanionModal;
