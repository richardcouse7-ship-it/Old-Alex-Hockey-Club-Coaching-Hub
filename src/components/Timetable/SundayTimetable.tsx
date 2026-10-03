import React, { useState } from 'react';
import {
  Calendar,
  Share2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  MapPin,
  Check,
  Sparkles,
  Sliders,
  CalendarDays,
  Copy,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Zap,
  CloudRain,
  UserCheck,
  Dumbbell,
  Compass,
  Navigation,
  ExternalLink,
  Shield,
  Users,
} from 'lucide-react';
import { Coach, CoachAvailability, Drill, MatchFixture, Pathway, PitchSector, ScheduleConflict, SessionSlot } from '../../types';
import { SundayMasterTemplatesModal } from './SundayMasterTemplatesModal';
import { BulkTimingsEditorModal } from './BulkTimingsEditorModal';
import { SundayMorningQuickActions } from './SundayMorningQuickActions';
import { useAppStore } from '../../store';
import { isAwaySession, normalizeAwaySlot } from '../../utils/awayFixtureUtils';

interface SundayTimetableProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  conflicts: ScheduleConflict[];
  selectedDate: string;
  drills?: Drill[];
  availability?: CoachAvailability[];
  fixtures?: MatchFixture[];
  onSelectSlot: (slot: SessionSlot) => void;
  onUpdateSlotCoach: (slotId: string, coachId: string) => void;
  onQuickAssignCoach: (slotId: string, coachId: string) => void;
  onCopyWhatsApp: () => void;
  copiedWhatsApp: boolean;
  onAddCustomSlot: (prefill?: { timeSlot?: string; pitchSectorId?: string }) => void;
  onApplyTemplate?: (newSlots: SessionSlot[]) => void;
  onOpenCalendarManager?: () => void;
  onUpdateAllSlots?: (slots: SessionSlot[]) => void;
  onOpenImportModal?: () => void;
  showToast?: (msg: string) => void;
}

export const SundayTimetable: React.FC<SundayTimetableProps> = ({
  slots,
  coaches,
  sectors,
  conflicts,
  selectedDate,
  drills,
  availability,
  fixtures = [],
  onSelectSlot,
  onUpdateSlotCoach,
  onCopyWhatsApp,
  copiedWhatsApp,
  onAddCustomSlot,
  onApplyTemplate,
  onOpenCalendarManager,
  onUpdateAllSlots,
  onOpenImportModal,
  showToast = () => {},
}) => {
  const [selectedPathway, setSelectedPathway] = useState<Pathway | 'ALL'>('ALL');
  const [selectedPitch, setSelectedPitch] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'timeline'>('matrix');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showBulkTimingsModal, setShowBulkTimingsModal] = useState(false);
  const [showQuickActionsBar, setShowQuickActionsBar] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  const handleCopyAwayWhatsApp = (slot: SessionSlot) => {
    const assigned = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
    const coachNames = assigned.map((c) => c.name).join(', ') || 'TBC';
    const venue = slot.venueName || 'Away Ground';
    const meet = slot.meetTime || '45m prior to pushback';

    const text = `🚗 *OLD ALEX AWAY FIXTURE BRIEFING*
🏆 *Team:* ${slot.ageGroupId} vs ${slot.opposition || 'Opposition'}
📍 *Venue:* ${venue}
🗺️ *Directions:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue + ' Dublin')}
⏰ *Pushback:* ${slot.timeSlot}
⏱️ *Squad Meet Time:* ${meet}
👥 *Lead Coach/Umpire:* ${coachNames}
🎽 *Kit:* Away / Alternate White Tops & Socks

_Old Alex Youth Hockey Club Coaching Hub_`;

    navigator.clipboard.writeText(text);
    setCopiedSlotId(slot.id);
    showToast(`Copied away fixture briefing for ${slot.ageGroupId}`);
    setTimeout(() => setCopiedSlotId(null), 2500);
  };

  // Filter slots strictly for the current selected date and normalize away fixtures
  const rawSlotsForDate = slots.filter((slot) => slot.date === selectedDate);
  const slotsForDate = rawSlotsForDate.map(normalizeAwaySlot);
  const awaySlotsForDate = slotsForDate.filter(isAwaySession);
  const homeSlotsForDate = slotsForDate.filter((s) => !isAwaySession(s));

  // Filter home slots for the Milltown Turf Matrix (Pitch 1, Pitch 2, P3)
  const filteredHomeSlots = homeSlotsForDate.filter((slot) => {
    if (selectedPathway !== 'ALL' && slot.pathway !== selectedPathway) return false;
    if (selectedPitch !== 'ALL') {
      if (selectedPitch === 'Pitch 1') {
        const isP1 = slot.pitchSectorId.startsWith('p1') || slot.pitchSectorId.includes('1');
        if (!isP1) return false;
      } else if (selectedPitch === 'Pitch 2') {
        const isP2 = slot.pitchSectorId.startsWith('p2') || slot.pitchSectorId.includes('2');
        if (!isP2) return false;
      } else if (selectedPitch === 'Away') {
        return false;
      } else if (slot.pitchSectorId !== selectedPitch) {
        return false;
      }
    }
    return true;
  });

  // Filter slots for Timeline view
  const filteredTimelineSlots = slotsForDate.filter((slot) => {
    if (selectedPathway !== 'ALL' && slot.pathway !== selectedPathway) return false;
    if (selectedPitch === 'Pitch 1') {
      return !isAwaySession(slot) && (slot.pitchSectorId.startsWith('p1') || slot.pitchSectorId.includes('1'));
    }
    if (selectedPitch === 'Pitch 2') {
      return !isAwaySession(slot) && (slot.pitchSectorId.startsWith('p2') || slot.pitchSectorId.includes('2'));
    }
    if (selectedPitch === 'Away') {
      return isAwaySession(slot);
    }
    return true;
  });

  // Unique time bands for Milltown Turf Matrix (home turf only)
  const timeSlots = Array.from(new Set(homeSlotsForDate.map((s) => s.timeSlot))).sort();
  // Unique time bands for Timeline List
  const timelineTimeSlots = Array.from(new Set(filteredTimelineSlots.map((s) => s.timeSlot))).sort();

  // Pitch groupings for Spatial Matrix headers
  const pitch1Sectors = sectors.filter(
    (s) => s.pitch === 'Pitch 1' || s.code.startsWith('P1') || s.id.startsWith('p1')
  );
  const pitch2Sectors = sectors.filter(
    (s) => s.pitch === 'Pitch 2' || s.code.startsWith('P2') || s.id.startsWith('p2')
  );
  const otherSectors = sectors.filter(
    (s) => !pitch1Sectors.some((p) => p.id === s.id) && !pitch2Sectors.some((p) => p.id === s.id)
  );

  // Visible sectors based on filter
  const visibleSectors = sectors.filter((sec) => {
    if (selectedPitch === 'ALL') return true;
    if (selectedPitch === 'Pitch 1') {
      return pitch1Sectors.some((p) => p.id === sec.id);
    }
    if (selectedPitch === 'Pitch 2') {
      return pitch2Sectors.some((p) => p.id === sec.id);
    }
    return sec.id === selectedPitch;
  });

  const visiblePitch1Sectors = pitch1Sectors.filter((sec) =>
    visibleSectors.some((v) => v.id === sec.id)
  );
  const visiblePitch2Sectors = pitch2Sectors.filter((sec) =>
    visibleSectors.some((v) => v.id === sec.id)
  );
  const visibleOtherSectors = otherSectors.filter((sec) =>
    visibleSectors.some((v) => v.id === sec.id)
  );

  const duplicateSchedule = useAppStore((s) => s.duplicateSchedule);
  const shiftTimings = useAppStore((s) => s.shiftTimings);
  const storeDrills = useAppStore((s) => s.drills);
  const storeAvailability = useAppStore((s) => s.availability);

  const activeDrills = drills || storeDrills;
  const activeAvailability = availability || storeAvailability;

  const handleCopyFromPrevious = () => {
    const datesWithSlots = Array.from(
      new Set(slots.filter((s) => s.date !== selectedDate).map((s) => s.date))
    );
    const sourceDate = datesWithSlots[0] || '2026-09-13';
    duplicateSchedule(sourceDate, selectedDate);
    showToast(
      `Copied ${slots.filter((s) => s.date === sourceDate).length} sessions from ${sourceDate} to ${selectedDate}!`
    );
  };

  const handleShiftTimings = (deltaMinutes: number) => {
    shiftTimings(selectedDate, deltaMinutes);
    const dir = deltaMinutes > 0 ? `+${deltaMinutes}` : `${deltaMinutes}`;
    showToast(`Shifted all Sunday sessions by ${dir} mins!`);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const renderAwaySection = (isFullView = false) => {
    if (awaySlotsForDate.length === 0) return null;

    return (
      <div className="border border-indigo-900/80 rounded-2xl bg-neutral-950 p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-900/80 text-indigo-300 border border-indigo-700/80 shadow-sm">
              <Navigation className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white text-xs font-bold uppercase font-mono-data">
                  Away Fixtures Sub-Section
                </span>
                <span className="text-xs font-mono-data font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {awaySlotsForDate.length} {awaySlotsForDate.length === 1 ? 'Match' : 'Matches'} Travelling
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                Off-Site Matchday Schedules & Travel Rosters
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Matches hosted at opposition school and club grounds (Wesley, Mt Temple, Drogheda Grammar). These squads travel off-site and do not utilize Milltown turf.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onAddCustomSlot({ pitchSectorId: 'away' })}
              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-850 border border-indigo-750 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Away Fixture</span>
            </button>
            {isFullView ? (
              <button
                type="button"
                onClick={() => setSelectedPitch('ALL')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white rounded-xl transition-all"
              >
                Back to All Turf
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedPitch('Away')}
                className="px-3 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-indigo-300 hover:text-white rounded-xl flex items-center gap-1 transition-all"
              >
                <span>Isolate Away View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {awaySlotsForDate.map((slot) => {
            const assigned = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
            const venue = slot.venueName || 'Away Ground';
            const meet = slot.meetTime || '45m prior to pushback';
            const isCopied = copiedSlotId === slot.id;

            return (
              <div
                key={slot.id}
                className="bg-black border border-indigo-900/80 rounded-2xl p-4.5 flex flex-col justify-between shadow-lg hover:border-indigo-500/80 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/80 text-xs font-bold font-mono-data">
                        {slot.ageGroupId}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-950/70 border border-indigo-900 px-2 py-0.5 rounded">
                        Leinster Away
                      </span>
                    </div>
                    <span className="text-xs font-mono-data font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded">
                      Meet: {meet}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {slot.sessionTitle}
                    </h4>
                    {slot.opposition && (
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">
                        Opponent: <span className="text-white font-bold">{slot.opposition}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-xs pt-2 border-t border-neutral-900">
                    <div className="flex items-center justify-between py-1 border-b border-neutral-900 text-neutral-300">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        Pushback:
                      </span>
                      <span className="font-mono-data font-bold text-white">{slot.timeSlot}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-neutral-900 text-neutral-300">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        Away Ground:
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          venue + ' Dublin hockey pitch'
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
                      >
                        <span className="truncate max-w-[170px]">{venue}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-neutral-900 text-neutral-300">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        Lead Coach / Umpire:
                      </span>
                      <span className="font-semibold text-white truncate max-w-[170px]">
                        {assigned.map((c) => c.name).join(', ') || (
                          <span className="text-amber-400 font-bold">⚠️ Coach Needed</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 text-neutral-300">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        Match Kit:
                      </span>
                      <span className="font-semibold text-amber-300 text-[11px]">
                        Away / Alternate White
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2 border-t border-neutral-900">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className="flex-1 py-2 text-xs font-bold text-white bg-indigo-900/80 hover:bg-indigo-850 border border-indigo-700/80 rounded-xl transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span>Open Match Plan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyAwayWhatsApp(slot)}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-colors border ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-900 hover:bg-neutral-850 text-emerald-400 border-neutral-800 hover:border-emerald-500/50'
                      }`}
                      title="Copy WhatsApp Briefing"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="text-neutral-500">Assign Coach:</span>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onUpdateSlotCoach(slot.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>
                        + Coach
                      </option>
                      {coaches.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          disabled={slot.assignedCoachIds.includes(c.id)}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* 1. UNIFIED COMMAND STRIP (Single Row, High Density, Touch) */}
      {/* ============================================================ */}
      <div className="bg-neutral-950 border border-neutral-800 p-2.5 sm:p-3 rounded-2xl shadow-lg flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left Side: Context Badge & Pathway Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sunday Context Tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-semibold text-white shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono-data uppercase tracking-wider text-red-400 font-bold">
              {formattedDate}
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-300 hidden sm:inline">Milltown Astro</span>
            <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300 font-mono-data">
              {slotsForDate.length} Slots
            </span>
          </div>

          <div className="h-5 w-px bg-neutral-800 hidden md:block" />

          {/* Pathway Segmented Filter Pills */}
          <div className="flex items-center p-1 bg-black rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedPathway('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedPathway === 'ALL'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedPathway('Foundation')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              onClick={() => setSelectedPathway('Development')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              onClick={() => setSelectedPathway('Youth Performance')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
          <div className="flex items-center p-1 bg-black rounded-xl border border-neutral-800 text-xs">
            {(['ALL', 'Pitch 1', 'Pitch 2'] as const).map((pitchKey) => (
              <button
                key={pitchKey}
                type="button"
                onClick={() => setSelectedPitch(pitchKey)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedPitch === pitchKey
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {pitchKey === 'ALL' ? 'All Turf' : pitchKey}
              </button>
            ))}
            {awaySlotsForDate.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPitch(selectedPitch === 'Away' ? 'ALL' : 'Away')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  selectedPitch === 'Away'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-sm'
                    : 'text-neutral-400 hover:text-indigo-400'
                }`}
                title="View away fixtures travelling off-site this Sunday"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                <span>Away ({awaySlotsForDate.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Triggers & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Weather Delay (+15m) Button */}
          <button
            type="button"
            onClick={() => handleShiftTimings(15)}
            className="min-h-[38px] px-2.5 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/60 text-amber-300 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
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
              className="min-h-[38px] px-3 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/70 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
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
            className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
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
            onClick={() => onAddCustomSlot()}
            className="min-h-[38px] px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Slot</span>
          </button>

          {/* View Mode Toggle: Spatial Matrix vs Timeline List */}
          <div className="flex items-center bg-black border border-neutral-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
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
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
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
              className="min-h-[38px] px-2.5 py-1.5 text-xs bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl flex items-center gap-1 transition-all"
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
                    setShowBulkTimingsModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Bulk Timings & Teams</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowTemplatesModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors"
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
                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-red-400" />
                    <span>Calendar Manager</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowQuickActionsBar(!showQuickActionsBar);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-neutral-800 rounded-lg flex items-center gap-2 transition-colors border-t border-neutral-800 pt-2"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>{showQuickActionsBar ? 'Hide' : 'Show'} Pitchside Cockpit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PITCHSIDE QUICK-ACTIONS COCKPIT (COLLAPSIBLE) */}
      {/* ============================================================ */}
      {showQuickActionsBar && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <SundayMorningQuickActions
            selectedDate={selectedDate}
            slots={slots}
            coaches={coaches}
            sectors={sectors}
            drills={activeDrills}
            availability={activeAvailability}
            onShiftTimings={handleShiftTimings}
            onUpdateSlotCoach={onUpdateSlotCoach}
            showToast={showToast}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* CONFLICTS ALERT BANNER */}
      {/* ============================================================ */}
      {conflicts.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-3 sm:p-4 flex items-start gap-3 shadow-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-200">
              {conflicts.length} Sunday Pitch Collision / Alert{conflicts.length > 1 ? 's' : ''} Detected
            </h4>
            <p className="text-amber-300/80 mt-0.5">
              {conflicts.map((c) => c.description).join(' ')}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN CONTENT: EMPTY STATE OR SPATIAL MATRIX / TIMELINE */}
      {/* ============================================================ */}
      {slotsForDate.length === 0 ? (
        <div className="p-8 sm:p-14 text-center bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 text-red-500 mx-auto flex items-center justify-center shadow-md">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              No Sessions Scheduled for {formattedDate}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              Milltown AstroTurf is currently unallocated on this date. Duplicate from previous Sunday, load a master blueprint, or add custom slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyFromPrevious}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Schedule from Previous Sunday</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>Load Sunday Master Blueprint</span>
            </button>

            <button
              type="button"
              onClick={() => onAddCustomSlot()}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-red-500" />
              <span>Add Custom Slot</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'matrix' && selectedPitch === 'Away' ? (
            renderAwaySection(true)
          ) : viewMode === 'matrix' ? (
            <div className="space-y-6">
            {/* ============================================================ */}
            {/* 2. SPATIAL PITCH MATRIX VIEW (Two-Pitch Grouped Grid)       */
            /* ============================================================ */}
            <div className="border border-neutral-800 rounded-2xl bg-neutral-950 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
              {/* Top Level Pitch Headers (Pitch 1 vs Pitch 2) */}
              <div
                className="grid border-b border-neutral-800 bg-black"
                style={{
                  gridTemplateColumns: `120px repeat(${visibleSectors.length}, minmax(180px, 1fr))`,
                }}
              >
                {/* Top-Left Corner: Time Label */}
                <div className="p-3 border-r border-neutral-800 flex items-center justify-center bg-neutral-950">
                  <span className="text-[10px] font-mono-data font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-500" />
                    <span>TIMING</span>
                  </span>
                </div>

                {/* Pitch 1 Header Span */}
                {visiblePitch1Sectors.length > 0 && (
                  <div
                    className="p-2.5 border-r border-neutral-800 bg-gradient-to-r from-emerald-950/40 via-neutral-950 to-emerald-950/20 text-center font-bold text-xs"
                    style={{ gridColumn: `span ${visiblePitch1Sectors.length}` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                      <span className="text-emerald-400 font-mono-data tracking-wider uppercase">
                        PITCH 1 · MAIN MILLTOWN ASTRO
                      </span>
                    </div>
                  </div>
                )}

                {/* Pitch 2 Header Span */}
                {visiblePitch2Sectors.length > 0 && (
                  <div
                    className="p-2.5 border-r border-neutral-800 last:border-r-0 bg-gradient-to-r from-sky-950/40 via-neutral-950 to-sky-950/20 text-center font-bold text-xs"
                    style={{ gridColumn: `span ${visiblePitch2Sectors.length}` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 ring-2 ring-sky-500/30" />
                      <span className="text-sky-400 font-mono-data tracking-wider uppercase">
                        PITCH 2 · TRAINING ASTRO
                      </span>
                    </div>
                  </div>
                )}

                {/* Pitch 3 / Additional Sector Span */}
                {visibleOtherSectors.length > 0 && (
                  <div
                    className="p-2.5 border-r border-neutral-800 last:border-r-0 bg-neutral-950 text-center font-bold text-xs"
                    style={{ gridColumn: `span ${visibleOtherSectors.length}` }}
                  >
                    <div className="flex items-center justify-center gap-2 text-neutral-400">
                      <Compass className="w-3.5 h-3.5" />
                      <span className="font-mono-data uppercase tracking-wider">
                        ADDITIONAL TRAINING ZONES
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Header Row: Individual Sectors (P1N, P1S, P2N, P2S, etc.) */}
              <div
                className="grid border-b border-neutral-800 bg-neutral-900/90 font-mono-data text-xs"
                style={{
                  gridTemplateColumns: `120px repeat(${visibleSectors.length}, minmax(180px, 1fr))`,
                }}
              >
                <div className="p-2.5 border-r border-neutral-800 text-center text-neutral-500 font-semibold text-[11px] bg-neutral-950">
                  SLOT
                </div>

                {visibleSectors.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-2.5 border-r border-neutral-800 last:border-r-0 text-center"
                  >
                    <div className="font-bold text-white flex items-center justify-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-red-400 font-bold">
                        {sec.code}
                      </span>
                      <span className="text-[11px] text-neutral-300 truncate font-sans">
                        {sec.name.replace(/Pitch \d /i, '')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {timeSlots.map((timeBand) => {
                const slotsInBand = filteredHomeSlots.filter((s) => s.timeSlot === timeBand);

                return (
                  <div
                    key={timeBand}
                    className="grid border-b border-neutral-800/80 last:border-b-0 min-h-[145px]"
                    style={{
                      gridTemplateColumns: `120px repeat(${visibleSectors.length}, minmax(180px, 1fr))`,
                    }}
                  >
                    {/* Time Column (Sticky feel, prominent hour) */}
                    <div className="p-3 border-r border-neutral-800 bg-neutral-950 flex flex-col justify-center items-center text-center">
                      <span className="text-xs font-mono-data font-bold text-white tracking-tight">
                        {timeBand}
                      </span>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-mono-data">
                        75 min
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1">
                        {slotsInBand.length} active
                      </span>
                    </div>

                    {/* Sector Cells */}
                    {visibleSectors.map((sec) => {
                      const slot = filteredHomeSlots.find(
                        (s) => s.timeSlot === timeBand && s.pitchSectorId === sec.id
                      );

                      if (!slot) {
                        // Empty / Vacant Turf Slot: Interactive Dotted Slot
                        return (
                          <div
                            key={sec.id}
                            onClick={() =>
                              onAddCustomSlot({ timeSlot: timeBand, pitchSectorId: sec.id })
                            }
                            className="group relative p-2.5 border-r border-neutral-800/80 last:border-r-0 bg-neutral-950/30 hover:bg-neutral-900/60 transition-all cursor-pointer flex flex-col items-center justify-center text-center"
                            title={`Add session at ${timeBand} on ${sec.code}`}
                          >
                            <div className="w-full h-full border-2 border-dashed border-neutral-800/80 group-hover:border-red-500/60 rounded-xl p-3 flex flex-col items-center justify-center transition-colors">
                              <div className="w-7 h-7 rounded-lg bg-neutral-900 group-hover:bg-red-600 text-neutral-500 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                                <Plus className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-semibold text-neutral-500 group-hover:text-white mt-1.5 transition-colors">
                                Open Turf
                              </span>
                              <span className="text-[9px] text-neutral-600 font-mono-data">
                                Tap to schedule
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Occupied Session Slot: Compact Action Card
                      const assignedCoaches = coaches.filter((c) =>
                        slot.assignedCoachIds.includes(c.id)
                      );
                      const isReady = slot.status === 'Ready' && assignedCoaches.length > 0;

                      return (
                        <div
                          key={sec.id}
                          onClick={() => onSelectSlot(slot)}
                          className="group relative p-2.5 border-r border-neutral-800/80 last:border-r-0 bg-neutral-900 hover:bg-neutral-850 hover:border-red-500 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          {/* Pathway colored accent bar on top of card */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1 rounded-t-sm ${
                              slot.pathway === 'Foundation'
                                ? 'bg-emerald-500'
                                : slot.pathway === 'Development'
                                ? 'bg-sky-400'
                                : 'bg-red-600'
                            }`}
                          />

                          <div>
                            {/* Card Header: Squad badge + Status Dot */}
                            <div className="flex items-center justify-between gap-1 mt-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${
                                  slot.pathway === 'Foundation'
                                    ? 'bg-neutral-950 text-emerald-300 border border-emerald-800'
                                    : slot.pathway === 'Development'
                                    ? 'bg-neutral-950 text-white border border-neutral-700'
                                    : 'bg-red-600 text-white font-bold'
                                }`}
                              >
                                {slot.ageGroupId}
                              </span>

                              {isReady ? (
                                <span className="flex items-center gap-1 text-[10px] font-mono-data text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Ready</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-mono-data text-amber-400 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/60">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Needs Coach</span>
                                </span>
                              )}
                            </div>

                            {/* Session Title */}
                            <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors mt-1.5 line-clamp-1">
                              {slot.sessionTitle}
                            </h4>

                            {/* Drill count pill */}
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                              <Dumbbell className="w-3 h-3 text-neutral-500" />
                              <span>{slot.attachedDrillIds.length} drills</span>
                              <span className="text-neutral-600">·</span>
                              <span className="truncate text-neutral-400">{slot.sessionPurpose}</span>
                            </div>
                          </div>

                          {/* Coach Chips & Quick Swap */}
                          <div
                            className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                              {assignedCoaches.length === 0 ? (
                                <span className="text-[10px] text-amber-400 font-bold italic">
                                  Unassigned
                                </span>
                              ) : (
                                assignedCoaches.slice(0, 2).map((c) => (
                                  <span
                                    key={c.id}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 font-medium flex items-center gap-1 truncate max-w-[110px]"
                                    title={c.name}
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: c.accentColor }}
                                    />
                                    <span className="truncate">{c.name.split(' ')[0]}</span>
                                  </span>
                                ))
                              )}
                              {assignedCoaches.length > 2 && (
                                <span className="text-[9px] text-neutral-400 font-mono-data">
                                  +{assignedCoaches.length - 2}
                                </span>
                              )}
                            </div>

                            {/* Quick coach add mini select */}
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onUpdateSlotCoach(slot.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white text-[10px] rounded px-1 py-0.5 cursor-pointer focus:outline-none focus:border-red-500 shrink-0"
                              title="Quick Assign Coach"
                            >
                              <option value="" disabled>
                                + Coach
                              </option>
                              {coaches.map((c) => (
                                <option
                                  key={c.id}
                                  value={c.id}
                                  disabled={slot.assignedCoachIds.includes(c.id)}
                                >
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dedicated Away Fixtures Sub-Section (Underneath Home Turf Grid) */}
        {selectedPitch === 'ALL' && awaySlotsForDate.length > 0 && renderAwaySection(false)}
      </div>
      ) : (
        /* ============================================================ */
        /* 3. TIMELINE LIST VIEW (Grouped by Hour Blocks)              */
        /* ============================================================ */
        <div className="space-y-4">
          {timeSlots.map((timeBand) => {
            const slotsInBand = filteredHomeSlots.filter((s) => s.timeSlot === timeBand);
            if (slotsInBand.length === 0) return null;

            return (
              <div
                key={timeBand}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
              >
                {/* Time slot header */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white font-mono-data tracking-tight">
                        {timeBand}
                      </h2>
                      <span className="text-[11px] text-neutral-400">
                        {slotsInBand.length} Age Groups Training Simultaneously
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono-data text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800">
                    75 Min Slot
                  </span>
                </div>

                {/* Slots Grid within this time band */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                  {slotsInBand.map((slot) => {
                    const sector = sectors.find((sec) => sec.id === slot.pitchSectorId);
                    const slotConflicts = conflicts.filter((c) => c.slotIds.includes(slot.id));
                    const assignedCoaches = coaches.filter((c) =>
                      slot.assignedCoachIds.includes(c.id)
                    );

                    return (
                      <div
                        key={slot.id}
                        className={`group relative rounded-xl border p-4 transition-all hover:border-red-500 hover:bg-neutral-900 cursor-pointer ${
                          slotConflicts.length > 0
                            ? 'border-amber-700/80 bg-neutral-900'
                            : 'border-neutral-800 bg-black'
                        }`}
                        onClick={() => onSelectSlot(slot)}
                      >
                        {/* Top bar of card */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold font-mono-data text-white bg-red-600 px-2.5 py-0.5 rounded-md">
                              {sector?.code || slot.pitchSectorId}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                slot.pathway === 'Foundation'
                                  ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                                  : slot.pathway === 'Development'
                                  ? 'bg-neutral-900 text-white border border-neutral-700'
                                  : 'bg-red-600/20 text-red-300 border border-red-500/50'
                              }`}
                            >
                              {slot.ageGroupId}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-mono-data uppercase px-2 py-0.5 rounded font-bold ${
                              slot.status === 'Ready'
                                ? 'text-emerald-300 bg-neutral-900 border border-emerald-800/60'
                                : 'text-amber-300 bg-neutral-900 border border-amber-800/60'
                            }`}
                          >
                            {slot.status}
                          </span>
                        </div>

                        {/* Session title & Purpose */}
                        <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                          {slot.sessionTitle}
                        </h3>
                        <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                          {slot.sessionPurpose}
                        </p>

                        {/* Inline Coach Assignment Dropdown */}
                        <div
                          className="mt-4 pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-neutral-400 font-semibold">
                              Coaches:
                            </span>
                            {assignedCoaches.length === 0 ? (
                              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> None
                              </span>
                            ) : (
                              assignedCoaches.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-750 text-white font-medium flex items-center gap-1"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full ring-1 ring-white/30"
                                    style={{ backgroundColor: c.accentColor }}
                                  />
                                  {c.name}
                                </span>
                              ))
                            )}
                          </div>

                          {/* Quick assign coach inline dropdown */}
                          <div className="relative">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onUpdateSlotCoach(slot.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:border-red-500"
                              title="Assign another coach to this slot"
                            >
                              <option value="" disabled className="bg-neutral-900 text-neutral-400">
                                + Assign Coach...
                              </option>
                              {coaches.map((c) => (
                                <option
                                  key={c.id}
                                  value={c.id}
                                  disabled={slot.assignedCoachIds.includes(c.id)}
                                >
                                  {c.name} {slot.assignedCoachIds.includes(c.id) ? '(Assigned)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Card footer details */}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 font-mono-data">
                          <span>{slot.attachedDrillIds.length} Drills Attached</span>
                          <span className="flex items-center gap-1 text-red-400 group-hover:text-red-300 group-hover:underline font-medium">
                            Open Inspector <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Away Fixtures Sub-Section in Timeline View */}
          {selectedPitch !== 'Pitch 1' && selectedPitch !== 'Pitch 2' && awaySlotsForDate.length > 0 && renderAwaySection(false)}
        </div>
      )}
    </>
  )}

      {/* Sunday Master Templates Modal */}
      <SundayMasterTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        selectedDate={selectedDate}
        currentSlots={slots}
        coaches={coaches}
        onApplyTemplate={(newSlots) => {
          if (onApplyTemplate) {
            onApplyTemplate(newSlots);
          }
        }}
      />

      {/* Bulk Timings & Team Assignments Editor Modal */}
      <BulkTimingsEditorModal
        isOpen={showBulkTimingsModal}
        onClose={() => setShowBulkTimingsModal(false)}
        slots={slots}
        sectors={sectors}
        selectedDate={selectedDate}
        onSaveAllSlots={(updated) => {
          if (onUpdateAllSlots) {
            onUpdateAllSlots(updated);
          }
        }}
        showToast={showToast}
      />
    </div>
  );
};
