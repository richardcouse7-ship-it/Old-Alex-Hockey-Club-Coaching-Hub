import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, SkipForward } from 'lucide-react';
import { DrillDiagramElement } from '../../types';

interface TacticalDiagramProps {
  elements?: DrillDiagramElement[];
  width?: number;
  height?: number;
  interactive?: boolean;
  title?: string;
  enableAnimation?: boolean;
}

export const TacticalDiagram: React.FC<TacticalDiagramProps> = ({
  elements = [],
  width = 460,
  height = 240,
  title,
  enableAnimation = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Check if there are movement vectors (pass or run arrows)
  const hasAnimationVectors = elements.some(
    (el) => (el.type === 'pass_arrow' || el.type === 'run_arrow') && el.toX !== undefined
  );

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setProgress((prev) => {
        const next = prev + dt * 0.45 * playbackSpeed;
        if (next >= 1) {
          // Advance phase or loop
          setPhase((currentPhase) => {
            if (currentPhase === 1) return 2;
            if (currentPhase === 2) return 3;
            setIsPlaying(false);
            return 3;
          });
          return 1;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleTogglePlay = () => {
    if (phase === 3 && progress >= 1) {
      // restart from phase 1
      setPhase(1);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPhase(1);
    setProgress(0);
  };

  const handleSetPhase = (targetPhase: 1 | 2 | 3) => {
    setIsPlaying(false);
    setPhase(targetPhase);
    setProgress(targetPhase === 1 ? 0 : targetPhase === 2 ? 0.5 : 1);
  };

  // Find primary pass and run vectors
  const passVector = elements.find(
    (el) => el.type === 'pass_arrow' && el.toX !== undefined && el.toY !== undefined
  );
  const runVector = elements.find(
    (el) => el.type === 'run_arrow' && el.toX !== undefined && el.toY !== undefined
  );

  // Calculate animated position along vector
  const getInterpolatedPos = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    t: number
  ) => {
    const clampedT = Math.max(0, Math.min(1, t));
    return {
      x: startX + (endX - startX) * clampedT,
      y: startY + (endY - startY) * clampedT,
    };
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-inner">
      {/* Turf surface background with field lines */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none block"
        style={{ maxHeight: '280px' }}
      >
        <defs>
          <pattern
            id="turf-pattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="20" height="20" fill="#0f172a" />
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
          </pattern>
          <marker
            id="arrowhead-pass"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
          </marker>
          <marker
            id="arrowhead-run"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#ec4899" />
          </marker>
          <marker
            id="arrowhead-action"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
          </marker>
        </defs>

        {/* Pitch Turf Background */}
        <rect width={width} height={height} fill="url(#turf-pattern)" />

        {/* Pitch boundary line */}
        <rect
          x="15"
          y="15"
          width={width - 30}
          height={height - 30}
          fill="none"
          stroke="#334155"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Center / 23m Division line */}
        <line
          x1={width / 2}
          y1="15"
          x2={width / 2}
          y2={height - 15}
          stroke="#334155"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* Render elements */}
        {elements.map((el, idx) => {
          if (el.type === 'ladder') {
            return (
              <g key={`ladder-${idx}`} transform={`translate(${el.x}, ${el.y})`}>
                <rect
                  x="0"
                  y="0"
                  width="130"
                  height="30"
                  fill="#1e293b"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  rx="4"
                />
                {[20, 40, 60, 80, 100].map((rx, rIdx) => (
                  <line
                    key={rIdx}
                    x1={rx}
                    y1="0"
                    x2={rx}
                    y2="30"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                  />
                ))}
                <text
                  x="65"
                  y="19"
                  fill="#f8fafc"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Agility Ladder
                </text>
              </g>
            );
          }

          if (el.type === 'goal') {
            return (
              <g key={`goal-${idx}`} transform={`translate(${el.x - 15}, ${el.y - 12})`}>
                <rect
                  x="0"
                  y="0"
                  width="30"
                  height="24"
                  fill="#0284c7"
                  fillOpacity="0.2"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  rx="3"
                />
                <text
                  x="15"
                  y="15"
                  fill="#38bdf8"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {el.label || 'GOAL'}
                </text>
              </g>
            );
          }

          if (el.type === 'pass_arrow' && el.toX !== undefined && el.toY !== undefined) {
            return (
              <line
                key={`pass-${idx}`}
                x1={el.x}
                y1={el.y}
                x2={el.toX}
                y2={el.toY}
                stroke={el.color || '#38bdf8'}
                strokeWidth="2.5"
                markerEnd="url(#arrowhead-pass)"
                opacity={phase === 1 ? 0.4 : 1}
              />
            );
          }

          if (el.type === 'run_arrow' && el.toX !== undefined && el.toY !== undefined) {
            return (
              <line
                key={`run-${idx}`}
                x1={el.x}
                y1={el.y}
                x2={el.toX}
                y2={el.toY}
                stroke={el.color || '#ec4899'}
                strokeWidth="2"
                strokeDasharray="4 3"
                markerEnd="url(#arrowhead-run)"
                opacity={phase === 1 ? 0.4 : 1}
              />
            );
          }

          if (el.type === 'cone') {
            return (
              <g key={`cone-${idx}`} transform={`translate(${el.x}, ${el.y})`}>
                <polygon
                  points="0,-8 7,6 -7,6"
                  fill={el.color || '#f97316'}
                  stroke="#ea580c"
                  strokeWidth="1"
                />
              </g>
            );
          }

          // Animated or static ball
          if (el.type === 'ball') {
            let ballPos = { x: el.x, y: el.y };
            if (passVector && passVector.toX !== undefined && passVector.toY !== undefined && progress > 0) {
              ballPos = getInterpolatedPos(
                passVector.x,
                passVector.y,
                passVector.toX,
                passVector.toY,
                progress
              );
            }

            return (
              <g
                key={`ball-${idx}`}
                transform={`translate(${ballPos.x}, ${ballPos.y})`}
                className="transition-transform duration-75"
              >
                <circle cx="0" cy="0" r="5.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="-1.5" cy="-1.5" r="1.5" fill="#cbd5e1" />
                {isPlaying && (
                  <circle
                    cx="0"
                    cy="0"
                    r="8"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}
              </g>
            );
          }

          // Animated or static player
          if (el.type === 'player') {
            let playerPos = { x: el.x, y: el.y };
            // If there is an active runVector and this player is at the start, animate along path
            if (
              runVector &&
              runVector.toX !== undefined &&
              runVector.toY !== undefined &&
              Math.hypot(el.x - runVector.x, el.y - runVector.y) < 25 &&
              progress > 0
            ) {
              playerPos = getInterpolatedPos(
                runVector.x,
                runVector.y,
                runVector.toX,
                runVector.toY,
                progress
              );
            }

            return (
              <g
                key={`player-${idx}`}
                transform={`translate(${playerPos.x}, ${playerPos.y})`}
                className="transition-transform duration-75"
              >
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill="#7e22ce"
                  stroke="#c084fc"
                  strokeWidth="2"
                  className="filter drop-shadow-sm"
                />
                <text
                  x="0"
                  y="4"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {el.label || 'P'}
                </text>
              </g>
            );
          }

          if (el.type === 'defender') {
            return (
              <g key={`def-${idx}`} transform={`translate(${el.x}, ${el.y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="12"
                  fill="#dc2626"
                  stroke="#fca5a5"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="4"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {el.label || 'D'}
                </text>
              </g>
            );
          }

          if (el.type === 'label') {
            return (
              <text
                key={`lbl-${idx}`}
                x={el.x}
                y={el.y}
                fill="#94a3b8"
                fontSize="11"
                fontWeight="600"
              >
                {el.label}
              </text>
            );
          }

          return null;
        })}
      </svg>

      {/* Animation Playback Bar */}
      {enableAnimation && hasAnimationVectors && (
        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`p-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors ${
                isPlaying
                  ? 'bg-amber-600 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
              title={isPlaying ? 'Pause drill animation' : 'Play drill animation in motion'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Motion'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900"
              title="Reset to starting positions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Step Phases Buttons */}
            <div className="hidden sm:flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
              <button
                type="button"
                onClick={() => handleSetPhase(1)}
                className={`px-2 py-0.5 rounded font-mono-data ${
                  phase === 1 ? 'bg-red-950 text-red-200 border border-red-800 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Phase 1: Setup
              </button>
              <button
                type="button"
                onClick={() => handleSetPhase(2)}
                className={`px-2 py-0.5 rounded font-mono-data ${
                  phase === 2 ? 'bg-red-950 text-red-200 border border-red-800 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Phase 2: Action
              </button>
              <button
                type="button"
                onClick={() => handleSetPhase(3)}
                className={`px-2 py-0.5 rounded font-mono-data ${
                  phase === 3 ? 'bg-red-950 text-red-200 border border-red-800 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Phase 3: Outcome
              </button>
            </div>
          </div>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 0.6 : 1))}
            className="px-2 py-1 text-[11px] font-mono-data rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          >
            {playbackSpeed}x Speed
          </button>
        </div>
      )}

      {/* Legend pill */}
      <div className="flex flex-wrap items-center justify-between border-t border-neutral-800 bg-black px-3 py-1.5 text-[11px] text-neutral-400">
        <span className="font-medium text-neutral-300">{title || 'Tactical Sector Layout'}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="inline-block h-2 w-2 rounded-full bg-red-600" /> Attacker (Red)
          </span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="inline-block h-2 w-2 rounded-full bg-white ring-1 ring-neutral-400" /> Defender (White)
          </span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Cone
          </span>
          <span className="flex items-center gap-1.5 text-neutral-300">
            <span className="inline-block h-1.5 w-3 bg-red-400" /> Pass
          </span>
        </div>
      </div>
    </div>
  );
};
