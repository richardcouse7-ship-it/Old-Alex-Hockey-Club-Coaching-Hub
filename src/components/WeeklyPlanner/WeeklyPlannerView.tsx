import React, { useState } from 'react';
import {
  CalendarDays,
  Printer,
  Share2,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  Sparkles,
  Navigation,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import { Coach, Drill, MatchFixture, Pathway, PitchSector, SessionSlot } from '../../types';
import { TacticalDiagram } from '../TacticalBoard/TacticalDiagram';
import { SundayMasterTemplatesModal } from '../Timetable/SundayMasterTemplatesModal';

interface WeeklyPlannerViewProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  selectedDate: string;
  onOpenSlotDrawer: (slot: SessionSlot) => void;
  onCopyWhatsApp: () => void;
  onApplyTemplate?: (newSlots: SessionSlot[]) => void;
  fixtures?: MatchFixture[];
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  slots,
  coaches,
  sectors,
  drills,
  selectedDate,
  onOpenSlotDrawer,
  onCopyWhatsApp,
  onApplyTemplate,
  fixtures = [],
}) => {
  const [selectedPathway, setSelectedPathway] = useState<Pathway | 'ALL'>('Foundation');
  const [venueScope, setVenueScope] = useState<'ALL' | 'HOME' | 'AWAY'>('ALL');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  // Slots for the active date
  const slotsForDate = slots.filter((s) => s.date === selectedDate);
  const awaySlotsForDate = slotsForDate.filter((s) => s.isAway || s.pitchSectorId === 'away');
  const homeSlotsForDate = slotsForDate.filter((s) => !s.isAway && s.pitchSectorId !== 'away');

  // Filter by pathway & venue scope
  const filteredSlots = slotsForDate.filter((s) => {
    if (venueScope === 'HOME' && (s.isAway || s.pitchSectorId === 'away')) return false;
    if (venueScope === 'AWAY' && !s.isAway && s.pitchSectorId !== 'away') return false;
    if (venueScope !== 'AWAY' && selectedPathway !== 'ALL' && s.pathway !== selectedPathway) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAwayBriefing = (slot: SessionSlot) => {
    const assignedCoaches = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
    const coachNames = assignedCoaches.map((c) => c.name).join(', ') || 'Team Coach';
    const venue = slot.venueName || 'Away Pitch';
    const text = `🏑 *OLD ALEX AWAY FIXTURE BRIEFING*
🏆 *Squad:* ${slot.sessionTitle}
🆚 *Opposition:* ${slot.opposition || 'League Match'}
📍 *Venue:* ${venue}
⏰ *Pushback Time:* ${slot.timeSlot}
🚗 *Squad Meet Time:* ${slot.meetTime || '45 mins before pushback'}
👤 *Travelling Coach / Lead:* ${coachNames}
👕 *Matchday Kit:* Alternate / Away White Socks & Tops (bring home kit as backup)
🚨 *Safety:* First Aid kit & match balls packed with team manager.
🗺️ *Directions:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue + ' Dublin')}`;

    navigator.clipboard.writeText(text);
    setCopiedSlotId(slot.id);
    setTimeout(() => setCopiedSlotId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-500 font-bold uppercase">
              Field Ready Coach Packs
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">{selectedDate}</span>
            {awaySlotsForDate.length > 0 && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-indigo-400" />
                  {awaySlotsForDate.length} Away Match{awaySlotsForDate.length > 1 ? 'es' : ''}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <CalendarDays className="w-6 h-6 text-red-500" />
            <span>Weekly Planner & Session Sheets</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Complete running order, tactical turf layouts, and equipment requirements ready for pitch delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplatesModal(true)}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white hover:border-red-500 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Load pre-built Sunday master blueprints"
          >
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>Master Templates</span>
          </button>
          <button
            type="button"
            onClick={onCopyWhatsApp}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share All</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Facility Filter Bar: Pathway & Location Scope Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800">
        {/* Pathway Switcher */}
        <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-neutral-800">
          {(['Foundation', 'Development', 'Youth Performance'] as const).map((pw) => (
            <button
              key={pw}
              type="button"
              onClick={() => {
                setSelectedPathway(pw);
                if (venueScope === 'AWAY') setVenueScope('ALL');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedPathway === pw && venueScope !== 'AWAY'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-500'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {pw} Stage
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSelectedPathway('ALL');
              if (venueScope === 'AWAY') setVenueScope('ALL');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedPathway === 'ALL' && venueScope !== 'AWAY'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Pathways
          </button>
        </div>

        {/* Location Scope Switcher (Home vs Away Facility) */}
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setVenueScope('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              venueScope === 'ALL'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Sessions ({slotsForDate.length})
          </button>
          <button
            type="button"
            onClick={() => setVenueScope('HOME')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              venueScope === 'HOME'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Milltown Turf ({homeSlotsForDate.length})
          </button>
          <button
            type="button"
            onClick={() => setVenueScope('AWAY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              venueScope === 'AWAY'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/80 shadow-sm'
                : 'text-neutral-400 hover:text-indigo-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-indigo-400" />
            <span>Away Fixtures ({awaySlotsForDate.length})</span>
          </button>
        </div>
      </div>

      {/* Away Matchday Briefing Banner (when away matches exist) */}
      {awaySlotsForDate.length > 0 && venueScope !== 'HOME' && (
        <div className="bg-gradient-to-r from-indigo-950/60 via-neutral-950 to-indigo-950/30 border border-indigo-800/60 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-900/60 border border-indigo-700/80 text-indigo-300 shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-indigo-400">
                    Off-Site Matchday Command
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 text-[10px] font-bold">
                    {awaySlotsForDate.length} Travelling Squad{awaySlotsForDate.length > 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Away Fixture Planning & Logistics for {selectedDate}
                </h3>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Review meet times (45m prior to pushback), away kit requirements, directions, and travelling coach allocations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setVenueScope('AWAY')}
                className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-850 text-indigo-200 border border-indigo-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>View Away Squads Only</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slots List for this Pathway */}
      <div className="space-y-6">
        {filteredSlots.map((slot) => {
          const currentSector = sectors.find((s) => s.id === slot.pitchSectorId);
          const assignedCoaches = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
          const slotDrills = drills.filter((d) => slot.attachedDrillIds.includes(d.id));

          if (slot.isAway) {
            const venue = slot.venueName || 'Away Ground';
            const meetTime = slot.meetTime || '45m prior to pushback';

            return (
              <div
                key={slot.id}
                className="bg-black border border-indigo-800/80 rounded-2xl overflow-hidden shadow-lg shadow-indigo-950/20"
              >
                {/* Away Slot Header Banner */}
                <div className="bg-gradient-to-r from-indigo-950/80 via-black to-indigo-950/40 p-5 border-b border-indigo-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-600 text-white flex items-center gap-1 shadow-sm">
                        <Navigation className="w-3 h-3" />
                        <span>{slot.ageGroupId} · AWAY FIXTURE</span>
                      </span>
                      <span className="text-xs text-indigo-300 font-mono-data font-semibold">
                        Leinster Matchday Squad
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{slot.sessionTitle}</span>
                    </h2>
                    <p className="text-xs text-indigo-200/90 mt-0.5 flex items-center gap-2">
                      <span>{slot.sessionPurpose}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Meet Time Pill */}
                    <div className="flex items-center gap-1.5 text-xs text-amber-200 font-mono-data bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800/80 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Meet: {meetTime}</span>
                    </div>

                    {/* Pushback Time Pill */}
                    <div className="flex items-center gap-1.5 text-xs text-white font-mono-data bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-750">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pushback: {slot.timeSlot}</span>
                    </div>

                    {/* Google Maps Directions Link */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue + ' Dublin')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-750 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      title="Open Google Maps directions to this away venue"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>

                    {/* WhatsApp Briefing Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyAwayBriefing(slot)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        copiedSlotId === slot.id
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-750 text-emerald-400'
                      }`}
                      title="Copy squad WhatsApp briefing for parents and players"
                    >
                      {copiedSlotId === slot.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSlotDrawer(slot)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-indigo-500 rounded-lg transition-colors"
                    >
                      Open Drawer →
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 bg-neutral-950">
                  {/* Away Logistics Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-black border border-indigo-900/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                        Away Venue
                      </span>
                      <p className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{venue}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                        Travelling Staff
                      </span>
                      <p className="font-semibold text-white mt-0.5">
                        {assignedCoaches.map((c) => c.name).join(', ') || '⚠️ Lead Coach Needed'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                        Opposition & Comp
                      </span>
                      <p className="font-semibold text-white mt-0.5">
                        {slot.opposition ? `vs ${slot.opposition}` : 'Leinster Fixture'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                        Team Kit Specification
                      </span>
                      <p className="font-semibold text-amber-300 mt-0.5 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Away / White Socks & Tops</span>
                      </p>
                    </div>
                  </div>

                  {/* Pre-Match Away Travel Running Order */}
                  <div>
                    <h3 className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-2 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                      Away Matchday Timed Protocol
                    </h3>
                    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-black">
                      <table className="w-full text-xs">
                        <thead className="bg-neutral-900 text-neutral-300 font-mono-data border-b border-neutral-800">
                          <tr>
                            <th className="py-2.5 px-3 text-left">Phase / Activity</th>
                            <th className="py-2.5 px-3 text-right">Timing Relative to Pushback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 font-mono-data">
                          <tr className="hover:bg-neutral-900/50">
                            <td className="py-2.5 px-3 font-sans text-white">
                              Squad arrival at {venue} & pitchside check-in
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                              T-45 mins ({meetTime})
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-900/50">
                            <td className="py-2.5 px-3 font-sans text-white">
                              Dynamic activation, running lines & mobility drill
                            </td>
                            <td className="py-2.5 px-3 text-right text-indigo-400 font-bold">
                              T-35 mins
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-900/50">
                            <td className="py-2.5 px-3 font-sans text-white">
                              Passing sharpness, 3v2 circle overload & goalkeeper warm-up
                            </td>
                            <td className="py-2.5 px-3 text-right text-indigo-400 font-bold">
                              T-20 mins
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-900/50">
                            <td className="py-2.5 px-3 font-sans text-white">
                              Penalty corner attack routines & defensive runners walk-through
                            </td>
                            <td className="py-2.5 px-3 text-right text-indigo-400 font-bold">
                              T-10 mins
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-900/50">
                            <td className="py-2.5 px-3 font-sans text-white">
                              Team huddle, starting XI announcement & final tactical brief
                            </td>
                            <td className="py-2.5 px-3 text-right text-indigo-400 font-bold">
                              T-05 mins
                            </td>
                          </tr>
                          <tr className="hover:bg-neutral-900/50 bg-indigo-950/20">
                            <td className="py-2.5 px-3 font-sans text-white font-bold">
                              Match Pushback (Whistle)
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                              {slot.startTime}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Travel Equipment Checklist */}
                  <div>
                    <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Travelling Squad Equipment Checklist
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {slot.equipmentChecklist.map((eq, eIdx) => (
                        <span
                          key={eIdx}
                          className="text-xs px-3 py-1.5 rounded-lg bg-black border border-indigo-900/60 text-white font-medium flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>{eq.item}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match Notes & Focus */}
                  {slot.coachNotes && (
                    <div className="p-3.5 rounded-xl bg-black border border-neutral-800 text-xs">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                        Matchday Notes & Instructions
                      </span>
                      <p className="text-neutral-200 mt-1 leading-relaxed">
                        {slot.coachNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Standard Home Session Pack Card
          return (
            <div
              key={slot.id}
              className="bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Slot Header Banner */}
              <div className="bg-black p-5 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                      {slot.ageGroupId}
                    </span>
                    <span className="text-xs text-neutral-300 font-mono-data">
                      Sunday Session Pack
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {slot.sessionTitle}
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">{slot.sessionPurpose}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-white font-mono-data bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-750">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    <span>{slot.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white font-mono-data bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-750">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{currentSector?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSlotDrawer(slot)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-red-500 rounded-lg transition-colors"
                  >
                    Open Drawer →
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 bg-neutral-950">
                {/* Logistics Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-black border border-neutral-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">
                      Pitch Sector
                    </span>
                    <p className="font-semibold text-white mt-0.5">
                      {currentSector?.code} — {currentSector?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">
                      Staff Assigned
                    </span>
                    <p className="font-semibold text-white mt-0.5">
                      {assignedCoaches.map((c) => c.name).join(', ') || '⚠️ Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">
                      Status & Readiness
                    </span>
                    <p className="font-semibold text-emerald-400 mt-0.5">{slot.status}</p>
                  </div>
                </div>

                {/* Running Order Table */}
                {slot.runningOrder && slot.runningOrder.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider mb-2 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-red-500" />
                      Timed Running Order
                    </h3>
                    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-black">
                      <table className="w-full text-xs">
                        <thead className="bg-neutral-900 text-neutral-300 font-mono-data border-b border-neutral-800">
                          <tr>
                            <th className="py-2.5 px-3 text-left">Activity / Drill</th>
                            <th className="py-2.5 px-3 text-right">Time Allocated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 font-mono-data">
                          {slot.runningOrder.map((step, idx) => (
                            <tr key={idx} className="hover:bg-neutral-900/50">
                              <td className="py-2.5 px-3 font-sans text-white">
                                {step.activity}
                              </td>
                              <td className="py-2.5 px-3 text-right text-red-400 font-bold">
                                {step.durationMins} mins
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Attached Drills Section */}
                {slotDrills.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider">
                      Attached Tactical Drills
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {slotDrills.map((drill) => (
                        <div
                          key={drill.id}
                          className="bg-black p-4 rounded-xl border border-neutral-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white">{drill.title}</h4>
                            <span className="text-[11px] font-mono-data text-red-400 font-bold">
                              {drill.durationMinutes}m
                            </span>
                          </div>

                          {drill.diagramElements && (
                            <TacticalDiagram
                              elements={drill.diagramElements}
                              height={170}
                              title={`${drill.title}`}
                            />
                          )}

                          <p className="text-xs text-neutral-300 leading-relaxed">{drill.setup}</p>

                          <ul className="text-xs space-y-1">
                            {drill.coachingPoints.slice(0, 3).map((pt, pIdx) => (
                              <li
                                key={pIdx}
                                className="text-neutral-200 flex items-start gap-1.5"
                              >
                                <span className="text-red-500 font-bold">•</span>
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment Checklist */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-neutral-300 tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                    Equipment Required on Pitch
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {slot.equipmentChecklist.map((eq, eIdx) => (
                      <span
                        key={eIdx}
                        className="text-xs px-3 py-1 rounded-lg bg-black border border-neutral-800 text-white font-medium"
                      >
                        {eq.item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
    </div>
  );
};

