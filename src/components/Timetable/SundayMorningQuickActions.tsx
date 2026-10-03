import React, { useState } from 'react';
import {
  Clock,
  CloudRain,
  Share2,
  FileDown,
  UserCheck,
  ChevronDown,
  ChevronUp,
  FastForward,
  Rewind,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { Coach, CoachAvailability, Drill, PitchSector, SessionSlot } from '../../types';
import { ExportService } from '../../services/exportService';
import { useAppStore } from '../../store';

interface SundayMorningQuickActionsProps {
  selectedDate: string;
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  availability: CoachAvailability[];
  onShiftTimings: (deltaMinutes: number) => void;
  onUpdateSlotCoach: (slotId: string, coachId: string) => void;
  showToast: (msg: string) => void;
}

export const SundayMorningQuickActions: React.FC<SundayMorningQuickActionsProps> = ({
  selectedDate,
  slots,
  coaches,
  sectors,
  drills,
  availability,
  onShiftTimings,
  onUpdateSlotCoach,
  showToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [weatherReason, setWeatherReason] = useState('Pitch inspection & frost clearance');
  const [weatherDelayMins, setWeatherDelayMins] = useState(15);
  const [showSubFinderModal, setShowSubFinderModal] = useState(false);
  const [selectedSlotForSub, setSelectedSlotForSub] = useState<string>(slots[0]?.id || '');
  const [copiedAlert, setCopiedAlert] = useState(false);
  const whatsAppGroups = useAppStore((s) => s.whatsAppGroups);

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const slotsForDate = slots.filter((s) => s.date === selectedDate);

  const handleDownloadMasterPDF = () => {
    const html = ExportService.generateSundayMasterPDFHtml(
      selectedDate,
      slotsForDate,
      coaches,
      sectors,
      drills,
      'Official Master Briefing issued by Director of Coaching'
    );
    ExportService.printOrSavePDF(html, `Old-Alex-Sunday-Master-${selectedDate}`);
    showToast('Generated Sunday Master Digital PDF!');
  };

  const handleCopyWeatherAlert = () => {
    const msg = ExportService.generateWeatherDelayWhatsApp(
      selectedDate,
      slotsForDate,
      weatherDelayMins,
      weatherReason
    );
    navigator.clipboard.writeText(msg);
    setCopiedAlert(true);
    showToast('Copied urgent Weather Delay broadcast for WhatsApp!');
    setTimeout(() => setCopiedAlert(false), 2500);
  };

  const handleOpenWeatherWhatsApp = () => {
    const msg = ExportService.generateWeatherDelayWhatsApp(
      selectedDate,
      slotsForDate,
      weatherDelayMins,
      weatherReason
    );
    ExportService.openWhatsAppDirect(msg);
    showToast('Opening WhatsApp with weather alert...');
  };

  const handleBroadcastWeatherDelay = async () => {
    const coachesGroup = whatsAppGroups.find((g) => g.id === 'grp-coaches-all');
    const msg = ExportService.generateWeatherDelayWhatsApp(
      selectedDate,
      slotsForDate,
      weatherDelayMins,
      weatherReason
    );
    await ExportService.openWhatsAppGroup(coachesGroup?.inviteLink, msg);
    setCopiedAlert(true);
    showToast(`Copied text & opened ${coachesGroup?.name || 'WhatsApp'}!`);
    setTimeout(() => setCopiedAlert(false), 2500);
  };

  // Find coaches available who are NOT assigned during the target slot's time
  const targetSlot = slots.find((s) => s.id === selectedSlotForSub) || slotsForDate[0];
  const assignedCoachIdsInSlotTime = targetSlot
    ? slots
        .filter((s) => s.date === selectedDate && s.timeSlot === targetSlot.timeSlot)
        .flatMap((s) => s.assignedCoachIds)
    : [];

  const availableSubs = coaches.filter((c) => {
    // Check if coach already assigned at this time
    if (assignedCoachIdsInSlotTime.includes(c.id)) return false;
    // Check availability record
    const record = availability.find((a) => a.coachId === c.id && a.date === selectedDate);
    if (!record) return true; // Default available if no conflicting record
    return record.status === 'AVAILABLE' || record.status === 'MORNING_ONLY';
  });

  return (
    <>
      {/* Quick Action Cockpit Bar */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 sm:p-3.5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status & Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-purple-400">
                  Director Pitchside Cockpit
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-[11px] text-neutral-300 font-semibold">{formattedDate}</span>
              </div>
              <p className="text-xs text-neutral-400">
                Live Sunday adjustments: shift timings, weather broadcasts, coach sub finder & digital PDFs.
              </p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Instant Time Shifters */}
            <div className="flex items-center bg-black border border-neutral-800 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  onShiftTimings(15);
                  showToast('Shifted all session timings by +15 mins');
                }}
                className="px-2.5 py-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg flex items-center gap-1 transition-colors"
                title="Delay all sessions by 15 mins (frost / weather)"
              >
                <FastForward className="w-3 h-3 text-amber-400" />
                <span>+15m</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onShiftTimings(30);
                  showToast('Shifted all session timings by +30 mins');
                }}
                className="px-2 py-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg flex items-center gap-1 transition-colors"
                title="Delay all sessions by 30 mins"
              >
                <span>+30m</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onShiftTimings(-15);
                  showToast('Moved all session timings earlier by 15 mins');
                }}
                className="px-2 py-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Move all sessions earlier by 15 mins"
              >
                <Rewind className="w-3 h-3 text-neutral-400" />
              </button>
            </div>

            {/* Weather Delay Alert Trigger */}
            <button
              type="button"
              onClick={() => setShowWeatherModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Compose urgent weather / pitch delay alert"
            >
              <CloudRain className="w-3.5 h-3.5 text-amber-400" />
              <span>Weather Alert</span>
            </button>

            {/* Emergency Sub Finder Trigger */}
            <button
              type="button"
              onClick={() => setShowSubFinderModal(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/50 text-blue-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              title="Find available coach substitute from 42-coach roster"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Find Coach Sub</span>
            </button>

            {/* 1-Tap Master PDF Download */}
            <button
              type="button"
              onClick={handleDownloadMasterPDF}
              className="px-3.5 py-1.5 text-xs font-semibold bg-purple-700 hover:bg-purple-600 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/40 active:scale-95"
              title="Generate and download complete Sunday Master PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Master PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weather Delay Modal */}
      {showWeatherModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Sunday Weather / Delay Broadcast</h3>
                  <p className="text-[11px] text-neutral-400">Instant WhatsApp dispatch to parent & coach groups</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWeatherModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Delay Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setWeatherDelayMins(mins)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        weatherDelayMins === mins
                          ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                      }`}
                    >
                      +{mins} Minutes
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Reason / Pitch Update
                </label>
                <input
                  type="text"
                  value={weatherReason}
                  onChange={(e) => setWeatherReason(e.target.value)}
                  placeholder="e.g. Frost thaw on Pitch 2 South / Rain inspection"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Live Preview */}
              <div>
                <label className="text-[11px] text-neutral-400 font-mono-data uppercase font-bold block mb-1">
                  WhatsApp Preview
                </label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {ExportService.generateWeatherDelayWhatsApp(
                    selectedDate,
                    slotsForDate,
                    weatherDelayMins,
                    weatherReason
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  onShiftTimings(weatherDelayMins);
                  showToast(`Shifted all Sunday slots by +${weatherDelayMins} mins!`);
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Shift Timetable (+{weatherDelayMins}m)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWeatherAlert}
                  className="px-3 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copiedAlert ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedAlert ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBroadcastWeatherDelay}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Broadcast to Coaches Group</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Coach Sub Finder Modal */}
      {showSubFinderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Emergency Coach Substitute Finder</h3>
                  <p className="text-[11px] text-neutral-400">Check availability across 42-coach roster for {formattedDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubFinderModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Slot Needing Coach */}
            <div>
              <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                Select Session Needing Substitute
              </label>
              <select
                value={selectedSlotForSub}
                onChange={(e) => setSelectedSlotForSub(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {slotsForDate.map((s) => {
                  const sec = sectors.find((sec) => sec.id === s.pitchSectorId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.timeSlot} — {s.ageGroupId} ({sec?.code || s.pitchSectorId.toUpperCase()}) [{s.assignedCoachIds.length} coach(es)]
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Target Slot Status */}
            {targetSlot && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-300">
                  <span><strong>Time:</strong> {targetSlot.timeSlot}</span>
                  <span><strong>Sector:</strong> {targetSlot.pitchSectorId.toUpperCase()}</span>
                </div>
                <div className="text-neutral-400">
                  <strong>Currently Assigned:</strong>{' '}
                  {targetSlot.assignedCoachIds.map((cid) => coaches.find((c) => c.id === cid)?.name || cid).join(', ') || 'None (Unassigned)'}
                </div>
              </div>
            )}

            {/* Available Coaches List */}
            <div>
              <span className="text-[10px] font-mono-data text-neutral-400 uppercase font-bold tracking-wider block mb-2">
                Available Coaches Not On Turf at {targetSlot?.timeSlot || 'this time'} ({availableSubs.length})
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {availableSubs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-950 rounded-xl border border-neutral-800">
                    No unassigned available coaches found for this specific time slot.
                  </div>
                ) : (
                  availableSubs.map((coach) => (
                    <div
                      key={coach.id}
                      className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: coach.accentColor || '#4a154b' }}
                        >
                          {coach.initials}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-white truncate">{coach.name}</div>
                          <div className="text-[10px] text-neutral-400 truncate">{coach.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {coach.phone && (
                          <a
                            href={`tel:${coach.phone}`}
                            className="px-2 py-1 text-[10px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                          >
                            Call
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (targetSlot) {
                              onUpdateSlotCoach(targetSlot.id, coach.id);
                              showToast(`Assigned ${coach.name} as sub for ${targetSlot.ageGroupId}!`);
                              setShowSubFinderModal(false);
                            }
                          }}
                          className="px-3 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                        >
                          Assign Sub
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowSubFinderModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
