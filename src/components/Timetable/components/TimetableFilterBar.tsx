import React, { useState } from 'react';
import {
  Share2,
  Check,
  Plus,
  Sliders,
  ChevronDown,
  Sparkles,
  CalendarDays,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Zap,
  CloudRain,
  Navigation,
} from 'lucide-react';
import { Pathway } from '../../../types';

export interface TimetableFilterBarProps {
  formattedDate: string;
  totalSlotsCount: number;
  selectedPathway: Pathway | 'ALL';
  onSelectPathway: (pathway: Pathway | 'ALL') => void;
  selectedPitch: string;
  onSelectPitch: (pitch: string) => void;
  awaySlotsCount: number;
  viewMode: 'matrix' | 'timeline';
  onToggleViewMode: (mode: 'matrix' | 'timeline') => void;
  onShiftTimings: (deltaMinutes: number) => void;
  onOpenImportModal?: () => void;
  onCopyWhatsApp: () => void;
  copiedWhatsApp: boolean;
  onAddNewSlot: () => void;
  onOpenBulkTimings: () => void;
  onOpenTemplates: () => void;
  onOpenCalendarManager?: () => void;
  showQuickActionsBar: boolean;
  onToggleQuickActionsBar: () => void;
}

export const TimetableFilterBar: React.FC<TimetableFilterBarProps> = ({
  formattedDate,
  totalSlotsCount,
  selectedPathway,
  onSelectPathway,
  selectedPitch,
  onSelectPitch,
  awaySlotsCount,
  viewMode,
  onToggleViewMode,
  onShiftTimings,
  onOpenImportModal,
  onCopyWhatsApp,
  copiedWhatsApp,
  onAddNewSlot,
  onOpenBulkTimings,
  onOpenTemplates,
  onOpenCalendarManager,
  showQuickActionsBar,
  onToggleQuickActionsBar,
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);

  return (
    <div className="bg-neutral-950 border border-neutral-800 p-2.5 sm:p-3 rounded-2xl shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      {/* Left Side: Context Badge & Pathway Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sunday Context Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-semibold text-white shadow-inner min-h-[38px]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono-data uppercase tracking-wider text-red-400 font-bold">
            {formattedDate}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-300 hidden sm:inline">Milltown Astro</span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300 font-mono-data">
            {totalSlotsCount} Slots
          </span>
        </div>

        <div className="h-5 w-px bg-neutral-800 hidden md:block" />

        {/* Pathway Segmented Filter Pills */}
        <div className="flex items-center p-1 bg-black rounded-xl border border-neutral-800 text-xs min-h-[38px]">
          <button
            type="button"
            onClick={() => onSelectPathway('ALL')}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedPathway === 'ALL'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onSelectPathway('Foundation')}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              selectedPathway === 'Foundation'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm'
                : 'text-neutral-400 hover:text-emerald-400'
            }`}
            title="Foundation (U6 - U10 Minis)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Minis</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPathway('Development')}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              selectedPathway === 'Development'
                ? 'bg-neutral-900 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Development (U12 - U14 Inters)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Inters</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPathway('Youth Performance')}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              selectedPathway === 'Youth Performance'
                ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-500'
                : 'text-neutral-400 hover:text-red-400'
            }`}
            title="Youth Performance (U16+ & Minors)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Seniors</span>
          </button>
        </div>

        {/* Pitch Filter Selector */}
        <div className="flex items-center p-1 bg-black rounded-xl border border-neutral-800 text-xs min-h-[38px]">
          {(['ALL', 'Pitch 1', 'Pitch 2'] as const).map((pitchKey) => (
            <button
              key={pitchKey}
              type="button"
              onClick={() => onSelectPitch(pitchKey)}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedPitch === pitchKey
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {pitchKey === 'ALL' ? 'All Turf' : pitchKey}
            </button>
          ))}
          {awaySlotsCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectPitch(selectedPitch === 'Away' ? 'ALL' : 'Away')}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                selectedPitch === 'Away'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-sm'
                  : 'text-neutral-400 hover:text-indigo-400'
              }`}
              title="View away fixtures travelling off-site this Sunday"
            >
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
              <span>Away ({awaySlotsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Side: Quick Action Triggers & View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Weather Delay (+15m) Button */}
        <button
          type="button"
          onClick={() => onShiftTimings(15)}
          className="min-h-[40px] px-2.5 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/60 text-amber-300 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Dublin Weather Delay: Shift all sessions today back by +15 minutes"
        >
          <CloudRain className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Weather</span>
          <span>+15m</span>
        </button>

        {/* Import Schedule Sheet Button */}
        {onOpenImportModal && (
          <button
            type="button"
            onClick={onOpenImportModal}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/70 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Import schedule from Google Sheets or Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import</span>
          </button>
        )}

        {/* Copy WhatsApp Button */}
        <button
          type="button"
          onClick={onCopyWhatsApp}
          className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            copiedWhatsApp
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white'
          }`}
          title="Copy formatted schedule for WhatsApp broadcast"
        >
          {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="hidden sm:inline">{copiedWhatsApp ? 'Copied' : 'WhatsApp'}</span>
        </button>

        {/* Primary + New Slot Action */}
        <button
          type="button"
          onClick={onAddNewSlot}
          className="min-h-[40px] px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Slot</span>
        </button>

        {/* View Mode Toggle: Spatial Matrix vs Timeline List */}
        <div className="flex items-center bg-black border border-neutral-800 rounded-xl p-0.5 min-h-[40px]">
          <button
            type="button"
            onClick={() => onToggleViewMode('matrix')}
            className={`min-h-[34px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
              viewMode === 'matrix'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Spatial Pitch Matrix Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('timeline')}
            className={`min-h-[34px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
              viewMode === 'timeline'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Chronological Timeline View"
          >
            <List className="w-3.5 h-3.5 text-neutral-300" />
            <span className="hidden md:inline">List</span>
          </button>
        </div>

        {/* More Actions Dropdown Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="min-h-[40px] px-2.5 py-1.5 text-xs bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl flex items-center gap-1 transition-all"
            title="More Sunday Operations Tools"
          >
            <Sliders className="w-3.5 h-3.5" />
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showMoreActions && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-1.5 z-40 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  onOpenBulkTimings();
                }}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors min-h-[40px]"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Bulk Timings & Teams</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  onOpenTemplates();
                }}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors min-h-[40px]"
              >
                <Sparkles className="w-4 h-4 text-red-500" />
                <span>Master Blueprints</span>
              </button>

              {onOpenCalendarManager && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    onOpenCalendarManager();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors min-h-[40px]"
                >
                  <CalendarDays className="w-4 h-4 text-red-400" />
                  <span>Calendar Manager</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMoreActions(false);
                  onToggleQuickActionsBar();
                }}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors border-t border-neutral-800 pt-2 min-h-[40px]"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>{showQuickActionsBar ? 'Hide' : 'Show'} Pitchside Cockpit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
