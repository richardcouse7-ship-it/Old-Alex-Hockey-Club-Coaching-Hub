import React, { useState } from 'react';
import {
  Compass,
  Award,
  Target,
  CheckCircle,
  FileDown,
  Printer,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PATHWAY_ROADMAP } from '../../data/initialData';
import { Pathway } from '../../types';

export const SeasonOverviewView: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<Pathway | 'ALL'>('ALL');

  const filteredRoadmap = PATHWAY_ROADMAP.filter(
    (item) => selectedPhase === 'ALL' || item.pathway === selectedPhase
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-500 font-semibold uppercase tracking-wider">
              Club Coaching Philosophy
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400">1893 – 2026/27 Season</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Compass className="w-6 h-6 text-red-500" />
            <span>Old Alex Season Overview & Player Pathway</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Structured development roadmap from first stick touches in PEN to Senior League readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pathway</span>
          </button>
        </div>
      </div>

      {/* Season Macro Phases Timeline */}
      <div className="bg-black border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2 font-mono-data">
          <TrendingUp className="w-4 h-4 text-red-500" />
          2026/27 Coaching Season Roadmap
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
              Sept – Oct · Phase 1
            </span>
            <h4 className="text-sm font-bold text-white mt-1">Connect & Assess</h4>
            <p className="text-neutral-300 mt-1 leading-relaxed">
              Set standards, assess baseline stick skills, rebuild habits after summer.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono-data text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-750">
              Checkpoint: Baseline recordings
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
              Nov – Dec · Phase 2
            </span>
            <h4 className="text-sm font-bold text-white mt-1">Build the Toolkit</h4>
            <p className="text-neutral-300 mt-1 leading-relaxed">
              Introduce 2v1 overloads, 3D aerial lifts, and coordinated team pressing.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono-data text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/80">
              Checkpoint: Decision under pressure
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
              Jan – Mar · Phase 3
            </span>
            <h4 className="text-sm font-bold text-white mt-1">Connect the Game</h4>
            <p className="text-neutral-300 mt-1 leading-relaxed">
              Full pitch structures, 16m build-outs, PC battery, transition speed.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono-data text-neutral-200 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-750">
              Checkpoint: Match conditions test
            </span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
              Apr – May · Phase 4
            </span>
            <h4 className="text-sm font-bold text-white mt-1">Perform & Reflect</h4>
            <p className="text-neutral-300 mt-1 leading-relaxed">
              Tournament play, senior integration, awards and progression reviews.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono-data text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/80">
              Checkpoint: End of season review
            </span>
          </div>
        </div>
      </div>

      {/* Pathway Stage Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-300 font-medium">Filter Stage:</span>
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800">
          {(['ALL', 'Foundation', 'Development', 'Youth Performance'] as const).map((ph) => (
            <button
              key={ph}
              type="button"
              onClick={() => setSelectedPhase(ph)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedPhase === ph
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ph === 'ALL' ? 'All 10 Age Groups' : ph}
            </button>
          ))}
        </div>
      </div>

      {/* 10 Age Groups Roadmap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRoadmap.map((item) => (
          <div
            key={item.ageGroup}
            className="bg-black border border-neutral-800 rounded-2xl p-5 space-y-4 hover:border-red-600/60 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.pathway === 'Foundation'
                        ? 'bg-neutral-900 text-neutral-200 border border-neutral-700'
                        : item.pathway === 'Development'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-neutral-900 text-white border border-neutral-600'
                    }`}
                  >
                    {item.pathway}
                  </span>
                  <span className="text-xs font-mono-data text-red-500 font-bold">
                    Old Alex Pathway
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{item.ageGroup}</h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono-data text-neutral-400">Target Season Outcome</span>
                <p className="text-xs font-semibold text-neutral-200 mt-0.5 max-w-[200px] line-clamp-2">
                  {item.seasonOutcome}
                </p>
              </div>
            </div>

            {/* Competency Matrix */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider">
                  Technical Competency
                </span>
                <p className="text-neutral-200 mt-0.5">{item.technicalFocus}</p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] font-bold uppercase text-neutral-300 tracking-wider">
                  Tactical & Game Sense
                </span>
                <p className="text-neutral-200 mt-0.5">{item.tacticalFocus}</p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Personal Habit & Character
                </span>
                <p className="text-neutral-200 mt-0.5">{item.personalHabit}</p>
              </div>
            </div>

            {/* Checkpoint */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400 text-[11px]">Assessment Checkpoint:</span>
              <span className="font-mono-data text-white font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                {item.checkpoint}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
