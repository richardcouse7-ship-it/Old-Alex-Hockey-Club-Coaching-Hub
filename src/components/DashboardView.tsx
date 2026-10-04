import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Share2,
  BookOpen,
  PieChart,
  Users,
  Bell,
  ArrowRight,
  ShieldCheck,
  MapPin,
  FileSpreadsheet,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Coach, Drill, PitchSector, ScheduleConflict, SessionSlot, SundayPrepChecklist } from '../types';
import { PitchsideCockpitHUD } from './Dashboard/PitchsideCockpitHUD';

interface DashboardViewProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills?: Drill[];
  selectedDate?: string;
  isSunMode?: boolean;
  conflicts: ScheduleConflict[];
  checklist: SundayPrepChecklist[];
  onToggleChecklist: (id: string) => void;
  utilization: {
    sectorStats: {
      sectorId: string;
      sectorCode: string;
      sectorName: string;
      occupiedSlots: number;
      totalSlots: number;
      percentage: number;
    }[];
    totalOccupied: number;
    totalPossible: number;
    overallPercentage: number;
  };
  onNavigateTab: (tab: string) => void;
  onSelectSlot: (slot: SessionSlot) => void;
  onOpenPitchCompanion?: (slot?: SessionSlot) => void;
  onOpenEmergencyModal?: (slot?: SessionSlot) => void;
  onCopyWhatsApp: () => void;
  copiedWhatsApp: boolean;
  onOpenReport: () => void;
  onOpenBroadcastModal: () => void;
  isOnline: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  slots,
  coaches,
  sectors,
  drills = [],
  selectedDate = new Date().toISOString().split('T')[0],
  isSunMode = false,
  conflicts,
  checklist,
  onToggleChecklist,
  utilization,
  onNavigateTab,
  onSelectSlot,
  onOpenPitchCompanion,
  onOpenEmergencyModal,
  onCopyWhatsApp,
  copiedWhatsApp,
  onOpenReport,
  onOpenBroadcastModal,
  isOnline,
}) => {
  const readySlotsCount = slots.filter((s) => s.status === 'Ready').length;
  const totalSlotsCount = slots.length;
  const checklistCompleted = checklist.filter((c) => c.checked).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono-data text-red-500 font-bold uppercase tracking-wider">
              Sunday Operations Overview
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">Milltown AstroTurf, Dublin 6</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Old Alex Coaching Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
            Sunday operational hub for field utilization, coach assignments, conflict monitoring, and weekly training preparations.
          </p>
        </div>

        {/* Quick Hub Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onCopyWhatsApp}
            className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              copiedWhatsApp
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white'
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedWhatsApp ? 'Copied WhatsApp!' : 'Copy WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenBroadcastModal}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Alert staff with push notification"
          >
            <Bell className="w-4 h-4 text-white" />
            <span>Broadcast Alert</span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-neutral-300" />
            <span>Monthly Report</span>
          </button>
        </div>
      </div>

      {/* Live Sunday Pitchside Cockpit (Now & Next HUD) */}
      <PitchsideCockpitHUD
        slots={slots}
        coaches={coaches}
        drills={drills}
        sectors={sectors}
        selectedDate={selectedDate}
        isSunMode={isSunMode}
        onSelectSlot={onSelectSlot}
        onOpenPitchCompanion={onOpenPitchCompanion || ((s) => s && onSelectSlot(s))}
        onOpenEmergencyModal={onOpenEmergencyModal || (() => {})}
        onNavigateTab={onNavigateTab}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Ready to Coach Ratio */}
        <div className="bg-black border border-neutral-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
            <span>Ready to Coach</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono-data">
              {readySlotsCount}
            </span>
            <span className="text-neutral-500 text-lg font-mono-data font-medium">
              /{totalSlotsCount}
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">Slots staffed & planned</p>
          </div>
        </div>

        {/* Metric 2: Field Utilization */}
        <div className="bg-black border border-neutral-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
            <span>Field Utilization</span>
            <PieChart className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-red-400 font-mono-data">
              {utilization.overallPercentage}%
            </span>
            <p className="text-[11px] text-neutral-400 mt-1">
              {utilization.totalOccupied} of {utilization.totalPossible} slot blocks active
            </p>
          </div>
        </div>

        {/* Metric 3: Age Groups */}
        <div className="bg-black border border-neutral-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
            <span>Age Groups Coached</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono-data">10</span>
            <p className="text-[11px] text-neutral-400 mt-1">PEN to Inters pathway</p>
          </div>
        </div>

        {/* Metric 4: Drills in Library */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('drills')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('drills');
            }
          }}
          className="bg-black border border-neutral-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-red-500 transition-all cursor-pointer active:scale-95 select-none"
          aria-label="Browse Drills in Library"
        >
          <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
            <span>Drills in Library</span>
            <BookOpen className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white font-mono-data">95</span>
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
              Browse drills <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Daily Utilization (Left) & Upcoming Conflicts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Daily Field Utilization Chart & Timeline */}
        <div className="lg:col-span-7 bg-black border border-neutral-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Daily Field Utilization (Milltown)
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5">
                Turf sector occupancy across all scheduled Sunday sessions.
              </p>
            </div>
            <span className="text-xs font-mono-data font-bold text-red-400 bg-neutral-900 border border-neutral-750 px-2.5 py-1 rounded-lg">
              {utilization.overallPercentage}% Busy
            </span>
          </div>

          {/* Utilization per pitch sector bar breakdown */}
          <div className="space-y-3.5">
            {utilization.sectorStats.map((stat) => (
              <div key={stat.sectorId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono-data">{stat.sectorCode}</span>
                    <span className="text-neutral-400 text-[11px]">{stat.sectorName}</span>
                  </div>
                  <span className="font-mono-data font-semibold text-neutral-200">
                    {stat.occupiedSlots} / {stat.totalSlots} Slots ({stat.percentage}%)
                  </span>
                </div>
                {/* Progress Track */}
                <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      stat.percentage >= 100
                        ? 'bg-red-500'
                        : stat.percentage >= 75
                        ? 'bg-red-600'
                        : stat.percentage >= 50
                        ? 'bg-neutral-300'
                        : 'bg-neutral-600'
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Next Sessions Preview */}
          <div className="pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Next Upcoming Pitch Sessions (10:45 – 12:00)
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('timetable')}
                className="text-xs text-red-400 hover:text-white font-semibold flex items-center gap-1 transition-transform active:scale-95"
              >
                <span>View Full Timetable</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {slots
                .filter((s) => s.timeSlot === '10:45–12:00')
                .slice(0, 4)
                .map((s) => {
                  const sector = sectors.find((sec) => sec.id === s.pitchSectorId);
                  const coachNames = s.assignedCoachIds
                    .map((id) => coaches.find((c) => c.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectSlot(s)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectSlot(s);
                        }
                      }}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-red-500 cursor-pointer transition-all active:scale-95 select-none"
                      aria-label={`Pitch session ${s.ageGroupId} ${s.sessionTitle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded font-mono-data">
                          {sector?.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.pathway === 'Foundation'
                              ? 'bg-neutral-950 text-emerald-300 border border-emerald-800'
                              : 'bg-neutral-950 text-white border border-neutral-700'
                          }`}
                        >
                          {s.ageGroupId}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1.5 line-clamp-1">
                        {s.sessionTitle}
                      </p>
                      <p className="text-[11px] text-neutral-300 mt-1 truncate">
                        Coaches: {coachNames || '⚠️ Needs coach'}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Upcoming Conflicts & Sunday Preparation Checklist */}
        <div className="lg:col-span-5 space-y-6">
          {/* Conflicts Alert Box */}
          <div className="bg-black border border-neutral-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    conflicts.length > 0 ? 'text-amber-400' : 'text-neutral-400'
                  }`}
                />
                Upcoming Conflicts & Attention Items
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono-data font-bold ${
                  conflicts.length > 0
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-neutral-900 text-emerald-300 border border-neutral-800'
                }`}
              >
                {conflicts.length} {conflicts.length === 1 ? 'Issue' : 'Issues'}
              </span>
            </div>

            {conflicts.length === 0 ? (
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-white">
                  Zero Conflicts Detected!
                </p>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  All sectors and coach rosters are clean and clash-free for this Sunday.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {conflicts.map((conf) => (
                  <div
                    key={conf.id}
                    className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">{conf.title}</span>
                        <span className="text-[10px] font-mono-data text-amber-400">
                          {conf.timeSlot}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-200 mt-1 leading-relaxed">
                        {conf.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('timetable')}
                      className="self-end text-[11px] font-bold text-red-400 hover:text-white underline transition-transform active:scale-95"
                    >
                      Resolve in Timetable →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sunday Preparation Checklist */}
          <div className="bg-black border border-neutral-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-red-500" />
                Sunday Preparation Checklist
              </h2>
              <span className="text-xs font-mono-data font-bold text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {checklistCompleted} / {checklist.length}
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 cursor-pointer select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggleChecklist(item.id)}
                    className="w-4 h-4 rounded border-neutral-700 bg-black text-red-600 focus:ring-red-500 mt-0.5 accent-red-600"
                  />
                  <span
                    className={`text-xs font-medium leading-tight ${
                      item.checked ? 'line-through text-neutral-500' : 'text-neutral-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
