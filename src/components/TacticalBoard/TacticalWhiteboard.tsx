import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Circle,
  Flag,
  Goal,
  ArrowRight,
  RotateCcw,
  Trash2,
  Save,
  X,
  Plus,
  Move,
  Download,
  Check,
  Sparkles,
} from 'lucide-react';
import { DrillDiagramElement } from '../../types';

interface TacticalWhiteboardProps {
  initialElements?: DrillDiagramElement[];
  onSave: (elements: DrillDiagramElement[]) => void;
  onClose: () => void;
  title?: string;
}

type ToolMode =
  | 'select'
  | 'player'
  | 'defender'
  | 'ball'
  | 'cone'
  | 'goal'
  | 'ladder'
  | 'pass_arrow'
  | 'run_arrow';

export const TacticalWhiteboard: React.FC<TacticalWhiteboardProps> = ({
  initialElements = [],
  onSave,
  onClose,
  title = 'Design Field Hockey Tactical Diagram',
}) => {
  const [elements, setElements] = useState<DrillDiagramElement[]>(() =>
    initialElements.length > 0 ? JSON.parse(JSON.stringify(initialElements)) : []
  );
  const [history, setHistory] = useState<DrillDiagramElement[][]>([]);
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedConeColor, setSelectedConeColor] = useState<string>('#f97316');
  const [playerLabelInput, setPlayerLabelInput] = useState<string>('P1');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const PITCH_WIDTH = 600;
  const PITCH_HEIGHT = 340;

  // Convert screen coordinates to SVG viewBox coordinates
  const getSvgCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();

    if ('touches' in e && e.touches.length > 0) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else if ('clientX' in e) {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.round(Math.max(10, Math.min(PITCH_WIDTH - 10, transformed.x))),
      y: Math.round(Math.max(10, Math.min(PITCH_HEIGHT - 10, transformed.y))),
    };
  };

  const pushHistory = (newElements: DrillDiagramElement[]) => {
    setHistory((prev) => [...prev.slice(-15), elements]);
    setElements(newElements);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setElements(previous);
    setSelectedId(null);
  };

  // Handle pointer down on SVG background or items
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getSvgCoordinates(e);

    if (activeTool === 'pass_arrow' || activeTool === 'run_arrow') {
      setArrowStart(coords);
      setCurrentMousePos(coords);
      return;
    }

    if (activeTool === 'player') {
      const next: DrillDiagramElement[] = [
        ...elements,
        { type: 'player', x: coords.x, y: coords.y, label: playerLabelInput || 'P' },
      ];
      pushHistory(next);
      return;
    }

    if (activeTool === 'defender') {
      const next: DrillDiagramElement[] = [
        ...elements,
        { type: 'defender', x: coords.x, y: coords.y, label: 'D' },
      ];
      pushHistory(next);
      return;
    }

    if (activeTool === 'ball') {
      const next: DrillDiagramElement[] = [
        ...elements,
        { type: 'ball', x: coords.x, y: coords.y },
      ];
      pushHistory(next);
      return;
    }

    if (activeTool === 'cone') {
      const next: DrillDiagramElement[] = [
        ...elements,
        { type: 'cone', x: coords.x, y: coords.y, color: selectedConeColor },
      ];
      pushHistory(next);
      return;
    }

    if (activeTool === 'goal') {
      const next: DrillDiagramElement[] = [
        ...elements,
        { type: 'goal', x: coords.x, y: coords.y, label: 'GOAL' },
      ];
      pushHistory(next);
      return;
    }

    if (activeTool === 'ladder') {
      const next: DrillDiagramElement[] = [
        ...elements,
        { type: 'ladder', x: coords.x - 65, y: coords.y - 15, label: 'Agility Ladder' },
      ];
      pushHistory(next);
      return;
    }

    // Select mode: clicking on blank background clears selection
    setSelectedId(null);
  };

  // Handle pointer move for drag or arrow drawing
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getSvgCoordinates(e);
    setCurrentMousePos(coords);

    if (draggedIdx !== null && activeTool === 'select') {
      const updated = elements.map((item, idx) => {
        if (idx !== draggedIdx) return item;

        // If arrow, move both start and end together
        if ((item.type === 'pass_arrow' || item.type === 'run_arrow') && item.toX !== undefined && item.toY !== undefined) {
          const dx = coords.x - item.x;
          const dy = coords.y - item.y;
          return {
            ...item,
            x: coords.x,
            y: coords.y,
            toX: item.toX + dx,
            toY: item.toY + dy,
          };
        }

        return { ...item, x: coords.x, y: coords.y };
      });
      setElements(updated);
    }
  };

  // Handle pointer up
  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if ((activeTool === 'pass_arrow' || activeTool === 'run_arrow') && arrowStart) {
      const coords = getSvgCoordinates(e);
      const dist = Math.hypot(coords.x - arrowStart.x, coords.y - arrowStart.y);

      // Require minimal line drag length
      if (dist > 15) {
        const next: DrillDiagramElement[] = [
          ...elements,
          {
            type: activeTool,
            x: arrowStart.x,
            y: arrowStart.y,
            toX: coords.x,
            toY: coords.y,
            color: activeTool === 'pass_arrow' ? '#38bdf8' : '#ec4899',
          },
        ];
        pushHistory(next);
      }
      setArrowStart(null);
      return;
    }

    if (draggedIdx !== null) {
      setHistory((prev) => [...prev.slice(-15), elements]);
      setDraggedIdx(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedId === null) return;
    const next = elements.filter((_, idx) => idx !== selectedId);
    pushHistory(next);
    setSelectedId(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all elements from the tactical whiteboard?')) {
      pushHistory([]);
      setSelectedId(null);
    }
  };

  const handleSave = () => {
    onSave(elements);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  // Quick Preset Formations
  const handleLoadPreset = (type: '2v1' | 'passing_grid' | 'circle_entry') => {
    if (type === '2v1') {
      const preset: DrillDiagramElement[] = [
        { type: 'goal', x: 70, y: 170, label: 'Goal' },
        { type: 'player', x: 440, y: 120, label: 'Att 1' },
        { type: 'player', x: 440, y: 220, label: 'Att 2' },
        { type: 'defender', x: 260, y: 170, label: 'Def' },
        { type: 'ball', x: 420, y: 125 },
        { type: 'pass_arrow', x: 420, y: 130, toX: 285, toY: 165, color: '#38bdf8' },
        { type: 'run_arrow', x: 430, y: 220, toX: 180, toY: 200, color: '#ec4899' },
        { type: 'cone', x: 120, y: 100, color: '#f97316' },
        { type: 'cone', x: 120, y: 240, color: '#f97316' },
      ];
      pushHistory(preset);
    } else if (type === 'passing_grid') {
      const preset: DrillDiagramElement[] = [
        { type: 'cone', x: 140, y: 90, color: '#eab308' },
        { type: 'cone', x: 460, y: 90, color: '#eab308' },
        { type: 'cone', x: 460, y: 250, color: '#eab308' },
        { type: 'cone', x: 140, y: 250, color: '#eab308' },
        { type: 'player', x: 140, y: 90, label: 'P1' },
        { type: 'player', x: 460, y: 90, label: 'P2' },
        { type: 'player', x: 460, y: 250, label: 'P3' },
        { type: 'player', x: 140, y: 250, label: 'P4' },
        { type: 'ball', x: 160, y: 95 },
        { type: 'pass_arrow', x: 160, y: 90, toX: 430, toY: 90, color: '#38bdf8' },
        { type: 'run_arrow', x: 155, y: 100, toX: 435, toY: 235, color: '#ec4899' },
      ];
      pushHistory(preset);
    } else if (type === 'circle_entry') {
      const preset: DrillDiagramElement[] = [
        { type: 'goal', x: 540, y: 170, label: 'GK' },
        { type: 'player', x: 120, y: 170, label: 'CM' },
        { type: 'player', x: 260, y: 80, label: 'Wing' },
        { type: 'player', x: 340, y: 170, label: 'Striker' },
        { type: 'defender', x: 380, y: 150, label: 'CB' },
        { type: 'pass_arrow', x: 140, y: 170, toX: 250, toY: 95, color: '#38bdf8' },
        { type: 'run_arrow', x: 260, y: 85, toX: 430, toY: 105, color: '#ec4899' },
        { type: 'pass_arrow', x: 430, y: 105, toX: 490, toY: 165, color: '#38bdf8' },
      ];
      pushHistory(preset);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-black border border-neutral-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                Old Alex Tactical Studio
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-400">Interactive Pitch Whiteboard</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-2 text-neutral-400 hover:text-white disabled:opacity-30 rounded-xl hover:bg-neutral-900 transition-colors"
              title="Undo last change"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {selectedId !== null && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-2.5 py-1.5 text-xs text-red-300 bg-red-950/80 hover:bg-red-900 border border-red-800 rounded-xl flex items-center gap-1 transition-colors"
                title="Delete selected item"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-neutral-900 transition-colors"
              title="Clear entire whiteboard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Save Diagram'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Bar */}
        <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tool selector buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'select'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Select & Drag</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('player')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'player'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
              <span>Attacker</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('defender')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'defender'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-900" />
              <span>Defender</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('ball')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'ball'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-neutral-900" />
              <span>Ball</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('cone')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'cone'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>Cone</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('pass_arrow')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'pass_arrow'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5 text-red-400" />
              <span>Pass Line</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('run_arrow')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'run_arrow'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span className="text-white font-bold">- - &gt;</span>
              <span>Run Line</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('goal')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'goal'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Goal className="w-3.5 h-3.5 text-white" />
              <span>Goal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('ladder')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                activeTool === 'ladder'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span className="font-mono font-bold text-neutral-200">#</span>
              <span>Ladder</span>
            </button>
          </div>

          {/* Quick Formations Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400">Presets:</span>
            <button
              type="button"
              onClick={() => handleLoadPreset('2v1')}
              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-[11px] rounded-lg text-white border border-neutral-750"
            >
              2v1 Overload
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('passing_grid')}
              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-[11px] rounded-lg text-white border border-neutral-750"
            >
              Gate Box
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('circle_entry')}
              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-[11px] rounded-lg text-white border border-neutral-750"
            >
              Circle Entry
            </button>
          </div>
        </div>

        {/* Active Tool Modifier Sub-bar */}
        <div className="px-4 py-2 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-3">
            {activeTool === 'player' && (
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">Player Label:</span>
                <input
                  type="text"
                  maxLength={6}
                  value={playerLabelInput}
                  onChange={(e) => setPlayerLabelInput(e.target.value)}
                  className="bg-black border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white w-20 focus:outline-none focus:border-red-500 font-mono-data"
                />
                <span className="text-[10px] text-neutral-400">
                  (Click anywhere on pitch to drop player)
                </span>
              </div>
            )}
            {activeTool === 'cone' && (
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">Cone Colour:</span>
                {['#f97316', '#eab308', '#22c55e', '#ef4444'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedConeColor(color)}
                    className={`w-4 h-4 rounded-full border ${
                      selectedConeColor === color ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            {(activeTool === 'pass_arrow' || activeTool === 'run_arrow') && (
              <span className="text-red-400 font-medium">
                Click and drag to draw an arrow from starting position to destination.
              </span>
            )}
            {activeTool === 'select' && (
              <span>Click any player, ball, or cone to select and drag around the turf.</span>
            )}
          </div>
          <span className="font-mono-data text-[11px]">
            {elements.length} elements on turf
          </span>
        </div>

        {/* Pitch Interactive Canvas */}
        <div className="p-4 sm:p-6 bg-slate-950 flex items-center justify-center select-none overflow-hidden">
          <div className="w-full max-w-3xl aspect-[600/340] relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-900 cursor-crosshair">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`}
              className="w-full h-full block"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              <defs>
                <pattern
                  id="whiteboard-turf"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="20" height="20" fill="#0b1120" />
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                </pattern>
                <marker
                  id="wb-arrow-pass"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                </marker>
                <marker
                  id="wb-arrow-run"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#ec4899" />
                </marker>
              </defs>

              {/* Turf Background */}
              <rect width={PITCH_WIDTH} height={PITCH_HEIGHT} fill="url(#whiteboard-turf)" />

              {/* Pitch Boundary Lines */}
              <rect
                x="25"
                y="20"
                width={PITCH_WIDTH - 50}
                height={PITCH_HEIGHT - 40}
                fill="none"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* Half-Way Line */}
              <line
                x1={PITCH_WIDTH / 2}
                y1="20"
                x2={PITCH_WIDTH / 2}
                y2={PITCH_HEIGHT - 20}
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Center Spot */}
              <circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} r="4" fill="#475569" />

              {/* Left Shooting Circle (D) */}
              <path
                d="M 25 100 A 70 70 0 0 1 25 240"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Right Shooting Circle (D) */}
              <path
                d="M 575 100 A 70 70 0 0 0 575 240"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Live line preview while drawing */}
              {arrowStart && currentMousePos && (
                <line
                  x1={arrowStart.x}
                  y1={arrowStart.y}
                  x2={currentMousePos.x}
                  y2={currentMousePos.y}
                  stroke={activeTool === 'pass_arrow' ? '#38bdf8' : '#ec4899'}
                  strokeWidth="2.5"
                  strokeDasharray={activeTool === 'run_arrow' ? '4 3' : 'none'}
                  markerEnd={activeTool === 'pass_arrow' ? 'url(#wb-arrow-pass)' : 'url(#wb-arrow-run)'}
                  opacity="0.8"
                />
              )}

              {/* Render Diagram Elements */}
              {elements.map((el, idx) => {
                const isSelected = selectedId === idx;

                if (el.type === 'ladder') {
                  return (
                    <g
                      key={`el-${idx}`}
                      transform={`translate(${el.x}, ${el.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                        if (activeTool === 'select') setDraggedIdx(idx);
                      }}
                      className="cursor-move"
                    >
                      <rect
                        x="0"
                        y="0"
                        width="130"
                        height="30"
                        fill="#1e293b"
                        stroke={isSelected ? '#c084fc' : '#94a3b8'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
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
                    <g
                      key={`el-${idx}`}
                      transform={`translate(${el.x - 18}, ${el.y - 15})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                        if (activeTool === 'select') setDraggedIdx(idx);
                      }}
                      className="cursor-move"
                    >
                      <rect
                        x="0"
                        y="0"
                        width="36"
                        height="30"
                        fill="#0284c7"
                        fillOpacity="0.25"
                        stroke={isSelected ? '#c084fc' : '#38bdf8'}
                        strokeWidth={isSelected ? '3' : '2'}
                        rx="4"
                      />
                      <text
                        x="18"
                        y="19"
                        fill="#38bdf8"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {el.label || 'GOAL'}
                      </text>
                    </g>
                  );
                }

                if (
                  (el.type === 'pass_arrow' || el.type === 'run_arrow') &&
                  el.toX !== undefined &&
                  el.toY !== undefined
                ) {
                  return (
                    <g
                      key={`el-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                      }}
                    >
                      <line
                        x1={el.x}
                        y1={el.y}
                        x2={el.toX}
                        y2={el.toY}
                        stroke={isSelected ? '#c084fc' : el.color || '#38bdf8'}
                        strokeWidth={isSelected ? '4' : '2.5'}
                        strokeDasharray={el.type === 'run_arrow' ? '4 3' : 'none'}
                        markerEnd={
                          el.type === 'pass_arrow' ? 'url(#wb-arrow-pass)' : 'url(#wb-arrow-run)'
                        }
                        className="cursor-pointer"
                      />
                    </g>
                  );
                }

                if (el.type === 'cone') {
                  return (
                    <g
                      key={`el-${idx}`}
                      transform={`translate(${el.x}, ${el.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                        if (activeTool === 'select') setDraggedIdx(idx);
                      }}
                      className="cursor-move"
                    >
                      <polygon
                        points="0,-10 9,8 -9,8"
                        fill={el.color || '#f97316'}
                        stroke={isSelected ? '#ffffff' : '#ea580c'}
                        strokeWidth={isSelected ? '2' : '1'}
                      />
                    </g>
                  );
                }

                if (el.type === 'ball') {
                  return (
                    <g
                      key={`el-${idx}`}
                      transform={`translate(${el.x}, ${el.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                        if (activeTool === 'select') setDraggedIdx(idx);
                      }}
                      className="cursor-move"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="6.5"
                        fill="#f8fafc"
                        stroke={isSelected ? '#c084fc' : '#0f172a'}
                        strokeWidth={isSelected ? '3' : '1.5'}
                      />
                    </g>
                  );
                }

                if (el.type === 'player') {
                  return (
                    <g
                      key={`el-${idx}`}
                      transform={`translate(${el.x}, ${el.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                        if (activeTool === 'select') setDraggedIdx(idx);
                      }}
                      className="cursor-move"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="14"
                        fill="#7e22ce"
                        stroke={isSelected ? '#ffffff' : '#c084fc'}
                        strokeWidth={isSelected ? '3' : '2'}
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="4.5"
                        fill="#ffffff"
                        fontSize="9.5"
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
                    <g
                      key={`el-${idx}`}
                      transform={`translate(${el.x}, ${el.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(idx);
                        if (activeTool === 'select') setDraggedIdx(idx);
                      }}
                      className="cursor-move"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="14"
                        fill="#dc2626"
                        stroke={isSelected ? '#ffffff' : '#fca5a5'}
                        strokeWidth={isSelected ? '3' : '2'}
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="4.5"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {el.label || 'D'}
                      </text>
                    </g>
                  );
                }

                return null;
              })}
            </svg>
          </div>
        </div>

        {/* Footer tips */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <span>💡 Tip: Select & drag any item to reposition. Click on line to select and hit Delete.</span>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
          >
            Done Designing
          </button>
        </div>
      </div>
    </div>
  );
};
