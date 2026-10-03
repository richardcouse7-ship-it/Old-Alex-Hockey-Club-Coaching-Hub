import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Repeat,
  CheckCircle,
  HelpCircle,
  Eye,
  Activity,
  Layers,
  Award,
} from 'lucide-react';
import { DrillAnimationFrame, DrillDiagramElement } from '../../types';
import { ANIMATED_TACTICAL_PLAYS, AnimatedPlay } from '../../data/animatedDrillTemplates';

interface TacticalDrillAnimatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayId?: string;
  customFrames?: DrillAnimationFrame[];
  drillTitle?: string;
}

export const TacticalDrillAnimator: React.FC<TacticalDrillAnimatorProps> = ({
  isOpen,
  onClose,
  initialPlayId = 'play-2v1-overload',
  customFrames,
  drillTitle,
}) => {
  const [selectedPlayId, setSelectedPlayId] = useState<string>(initialPlayId);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 0.5x, 1x, 1.5x
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [progressInFrame, setProgressInFrame] = useState<number>(0); // 0.0 to 1.0
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Active play selection
  const activePlay: AnimatedPlay = ANIMATED_TACTICAL_PLAYS.find((p) => p.id === selectedPlayId) ||
    ANIMATED_TACTICAL_PLAYS[0];

  const frames: DrillAnimationFrame[] =
    customFrames && customFrames.length > 0 ? customFrames : activePlay.frames;

  const currentFrame = frames[currentFrameIndex] || frames[0];
  const nextFrame = frames[(currentFrameIndex + 1) % frames.length] || currentFrame;

  const frameDurationMs = ((currentFrame?.durationSeconds || 3.0) * 1000) / playbackSpeed;

  // Animation Loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimestampRef.current;
      const progressDelta = elapsed / frameDurationMs;

      setProgressInFrame((prev) => {
        const next = prev + progressDelta;
        if (next >= 1.0) {
          // Advance to next frame
          if (currentFrameIndex < frames.length - 1) {
            setCurrentFrameIndex((idx) => idx + 1);
            return 0;
          } else if (isLooping) {
            setCurrentFrameIndex(0);
            return 0;
          } else {
            setIsPlaying(false);
            return 1.0;
          }
        }
        return next;
      });

      lastTimestampRef.current = timestamp;
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, isLooping, frameDurationMs, currentFrameIndex, frames.length]);

  if (!isOpen) return null;

  // Interpolate coordinates between currentFrame and nextFrame based on element matching (label or type index)
  const interpolateElements = (): DrillDiagramElement[] => {
    if (!currentFrame || !nextFrame) return [];
    const t = Math.min(1.0, Math.max(0, progressInFrame));
    // Easing function for smooth organic hockey movement (ease-in-out)
    const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    return currentFrame.elements.map((currEl, idx) => {
      // Find matching element in next frame
      let nextEl = nextFrame.elements.find(
        (n) => n.label && currEl.label && n.label === currEl.label
      );
      if (!nextEl) {
        nextEl = nextFrame.elements.find((n) => n.type === currEl.type && idx === nextFrame.elements.indexOf(n));
      }

      if (!nextEl) return currEl;

      const interpX = currEl.x + (nextEl.x - currEl.x) * easedT;
      const interpY = currEl.y + (nextEl.y - currEl.y) * easedT;

      let interpToX = currEl.toX;
      let interpToY = currEl.toY;
      if (currEl.toX !== undefined && nextEl.toX !== undefined) {
        interpToX = currEl.toX + (nextEl.toX - currEl.toX) * easedT;
      }
      if (currEl.toY !== undefined && nextEl.toY !== undefined) {
        interpToY = currEl.toY + (nextEl.toY - currEl.toY) * easedT;
      }

      return {
        ...currEl,
        x: Math.round(interpX),
        y: Math.round(interpY),
        toX: interpToX !== undefined ? Math.round(interpToX) : undefined,
        toY: interpToY !== undefined ? Math.round(interpToY) : undefined,
      };
    });
  };

  const interpolatedElements = interpolateElements();

  const handleStepPrev = () => {
    setIsPlaying(false);
    setProgressInFrame(0);
    setCurrentFrameIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    setProgressInFrame(0);
    setCurrentFrameIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    setProgressInFrame(0);
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

  const PITCH_WIDTH = 600;
  const PITCH_HEIGHT = 340;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex items-center justify-center ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-5'
      }`}
    >
      <div className="bg-neutral-950 border-2 border-red-600/60 rounded-3xl w-full max-w-5xl shadow-2xl shadow-red-950/40 overflow-hidden flex flex-col">
        {/* Top Header & Tactical Title */}
        <div className="p-4 sm:p-5 bg-black border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-purple-700 text-white flex items-center justify-center font-bold shadow-lg shadow-red-600/30 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data uppercase tracking-wider text-red-400 font-extrabold bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                  Old Alex Tactical Animator · Pitchside Dugout
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{drillTitle || activePlay.title}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
              title="Fullscreen Dugout Mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tactical Play Selector Carousel (Pre-built Old Alex Tactics) */}
        {!customFrames && (
          <div className="px-4 py-2.5 bg-neutral-900/50 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-mono-data uppercase tracking-wider text-neutral-400 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>Plays:</span>
            </span>
            {ANIMATED_TACTICAL_PLAYS.map((play) => {
              const isSelected = play.id === selectedPlayId;
              return (
                <button
                  key={play.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayId(play.id);
                    setCurrentFrameIndex(0);
                    setProgressInFrame(0);
                    setIsPlaying(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span>{play.title.split(':')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Pitch Animation Canvas */}
        <div className="p-4 sm:p-6 bg-black flex flex-col items-center justify-center relative">
          <div className="w-full max-w-4xl relative rounded-2xl overflow-hidden border-2 border-emerald-900/60 shadow-2xl bg-[#0d4722]">
            <svg
              viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}
              className="w-full h-auto select-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #15803d 0%, #14532d 75%, #052e16 100%)',
              }}
            >
              <defs>
                {/* Marker for Pass Arrows */}
                <marker
                  id="pass-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                </marker>
                {/* Marker for Run Arrows */}
                <marker
                  id="run-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
                </marker>
                {/* Marker for Score Finish */}
                <marker
                  id="finish-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
                </marker>
              </defs>

              {/* Pitch Markings */}
              {/* Outer Boundary */}
              <rect
                x="20"
                y="20"
                width="560"
                height="300"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2.5"
              />

              {/* Halfway Line */}
              <line
                x1="300"
                y1="20"
                x2="300"
                y2="320"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />

              {/* Centre Spot */}
              <circle cx="300" cy="170" r="4" fill="rgba(255,255,255,0.6)" />

              {/* Left 23m Line */}
              <line
                x1="160"
                y1="20"
                x2="160"
                y2="320"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />

              {/* Right 23m Line */}
              <line
                x1="440"
                y1="20"
                x2="440"
                y2="320"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />

              {/* Right Shooting Circle (D) */}
              <path
                d="M 580 90 A 80 80 0 0 0 580 250"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2"
              />

              {/* Left Shooting Circle (D) */}
              <path
                d="M 20 90 A 80 80 0 0 1 20 250"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />

              {/* Penalty Stroke Spots */}
              <circle cx="516" cy="170" r="3" fill="rgba(255,255,255,0.6)" />
              <circle cx="84" cy="170" r="3" fill="rgba(255,255,255,0.6)" />

              {/* Goals */}
              <rect
                x="576"
                y="145"
                width="16"
                height="50"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <rect
                x="8"
                y="145"
                width="16"
                height="50"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Render Animated Dynamic Elements */}
              {interpolatedElements.map((el, i) => {
                if (el.type === 'pass_arrow' && el.toX !== undefined && el.toY !== undefined) {
                  return (
                    <line
                      key={i}
                      x1={el.x}
                      y1={el.y}
                      x2={el.toX}
                      y2={el.toY}
                      stroke={el.color || '#38bdf8'}
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                      markerEnd={el.color === '#10b981' ? 'url(#finish-arrowhead)' : 'url(#pass-arrowhead)'}
                    />
                  );
                }

                if (el.type === 'run_arrow' && el.toX !== undefined && el.toY !== undefined) {
                  return (
                    <line
                      key={i}
                      x1={el.x}
                      y1={el.y}
                      x2={el.toX}
                      y2={el.toY}
                      stroke={el.color || '#f59e0b'}
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      markerEnd="url(#run-arrowhead)"
                    />
                  );
                }

                if (el.type === 'player') {
                  return (
                    <g key={i} className="transition-transform duration-100 ease-linear">
                      <circle
                        cx={el.x}
                        cy={el.y}
                        r="14"
                        fill={el.color || '#9333ea'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="shadow-lg"
                      />
                      {el.label && (
                        <text
                          x={el.x}
                          y={el.y + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {el.label}
                        </text>
                      )}
                    </g>
                  );
                }

                if (el.type === 'defender') {
                  return (
                    <g key={i} className="transition-transform duration-100 ease-linear">
                      <circle
                        cx={el.x}
                        cy={el.y}
                        r="14"
                        fill={el.color || '#dc2626'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {el.label && (
                        <text
                          x={el.x}
                          y={el.y + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {el.label}
                        </text>
                      )}
                    </g>
                  );
                }

                if (el.type === 'ball') {
                  return (
                    <g key={i} className="transition-transform duration-75 ease-linear">
                      <circle
                        cx={el.x}
                        cy={el.y}
                        r="7"
                        fill="#fbbf24"
                        stroke="#000000"
                        strokeWidth="1.5"
                        className="animate-spin"
                      />
                      <circle cx={el.x - 2} cy={el.y - 2} r="1.5" fill="#ffffff" />
                    </g>
                  );
                }

                if (el.type === 'cone') {
                  return (
                    <polygon
                      key={i}
                      points={`${el.x},${el.y - 10} ${el.x - 7},${el.y + 7} ${el.x + 7},${el.y + 7}`}
                      fill={el.color || '#f97316'}
                      stroke="#000000"
                      strokeWidth="1"
                    />
                  );
                }

                return null;
              })}
            </svg>

            {/* In-pitch Phase Banner Overlay */}
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-neutral-700/60 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide font-mono-data">
                Phase {currentFrameIndex + 1} of {frames.length}: {currentFrame.title}
              </span>
            </div>
          </div>
        </div>

        {/* Phase Timeline & Progress Scrubber */}
        <div className="px-6 py-3 bg-neutral-900/60 border-t border-b border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-mono-data font-bold text-red-400">
              {currentFrame.title}
            </span>
            <span className="font-mono-data text-neutral-400">
              {playbackSpeed}x Speed · {Math.round(progressInFrame * 100)}% Phase Progress
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {frames.map((frame, idx) => {
              const isActive = idx === currentFrameIndex;
              const isPast = idx < currentFrameIndex;
              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(idx);
                    setProgressInFrame(0);
                  }}
                  className={`h-2 rounded-full overflow-hidden transition-all ${
                    isActive
                      ? 'bg-neutral-800'
                      : isPast
                      ? 'bg-red-600'
                      : 'bg-neutral-800/60'
                  }`}
                  title={frame.title}
                >
                  {isActive && (
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-75"
                      style={{ width: `${progressInFrame * 100}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {currentFrame.description && (
            <p className="text-xs text-neutral-300 leading-snug bg-black/50 p-2.5 rounded-xl border border-neutral-850">
              💡 <strong className="text-white">Coaching Step:</strong> {currentFrame.description}
            </p>
          )}
        </div>

        {/* Interactive Playback Control Bar */}
        <div className="p-4 sm:p-5 bg-black flex flex-wrap items-center justify-between gap-3">
          {/* Main Controls: Reset, Step Prev, Play/Pause, Step Next */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
              title="Reset to Phase 1"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleStepPrev}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
              title="Previous Phase"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-6 py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center gap-2.5 shadow-xl transition-transform active:scale-95 border ${
                isPlaying
                  ? 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700'
                  : 'bg-red-600 hover:bg-red-500 border-red-500 shadow-red-600/30'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>PAUSE ANIMATION</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>PLAY ANIMATION</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStepNext}
              className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
              title="Next Phase"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-3 rounded-2xl border transition-colors ${
                isLooping
                  ? 'bg-neutral-900 text-red-400 border-red-500/40 shadow-sm'
                  : 'bg-neutral-950 text-neutral-600 border-neutral-850'
              }`}
              title={isLooping ? 'Looping ON' : 'Looping OFF'}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Controls: 0.5x, 1x, 1.5x */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-850">
            <span className="text-[10px] font-mono-data text-neutral-400 uppercase tracking-wider px-2">
              Speed:
            </span>
            {[0.5, 1.0, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all ${
                  playbackSpeed === speed
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Key Habits Box */}
          {activePlay.coachingKeyHabits && (
            <div className="w-full pt-2 border-t border-neutral-850 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono-data text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Old Alex Coaching Habits:</span>
              </span>
              {activePlay.coachingKeyHabits.map((habit, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-200 border border-neutral-800"
                >
                  ✓ {habit}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TacticalDrillAnimator;
