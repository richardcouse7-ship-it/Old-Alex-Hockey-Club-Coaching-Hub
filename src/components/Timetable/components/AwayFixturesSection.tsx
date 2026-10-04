import React, { useState } from 'react';
import {
  Clock,
  Plus,
  ChevronRight,
  MapPin,
  Check,
  Copy,
  Navigation,
  ExternalLink,
  Shield,
  Users,
} from 'lucide-react';
import { Coach, SessionSlot } from '../../../types';

export interface AwayFixturesSectionProps {
  awaySlots: SessionSlot[];
  coaches: Coach[];
  isFullView?: boolean;
  onAddAwayFixture: () => void;
  onBackToAllTurf?: () => void;
  onIsolateAwayView?: () => void;
  onSelectSlot: (slot: SessionSlot) => void;
  onUpdateSlotCoach: (slotId: string, coachId: string) => void;
  showToast?: (msg: string) => void;
}

export const AwayFixturesSection: React.FC<AwayFixturesSectionProps> = ({
  awaySlots,
  coaches,
  isFullView = false,
  onAddAwayFixture,
  onBackToAllTurf,
  onIsolateAwayView,
  onSelectSlot,
  onUpdateSlotCoach,
  showToast,
}) => {
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  if (awaySlots.length === 0) return null;

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
    if (showToast) {
      showToast(`Copied away fixture briefing for ${slot.ageGroupId}`);
    }
    setTimeout(() => setCopiedSlotId(null), 2500);
  };

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
                {awaySlots.length} {awaySlots.length === 1 ? 'Match' : 'Matches'} Travelling
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
            onClick={onAddAwayFixture}
            className="min-h-[40px] px-3.5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-850 border border-indigo-750 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Away Fixture</span>
          </button>
          {isFullView ? (
            onBackToAllTurf && (
              <button
                type="button"
                onClick={onBackToAllTurf}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white rounded-xl transition-all active:scale-95"
              >
                Back to All Turf
              </button>
            )
          ) : (
            onIsolateAwayView && (
              <button
                type="button"
                onClick={onIsolateAwayView}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-indigo-300 hover:text-white rounded-xl flex items-center gap-1 transition-all active:scale-95"
              >
                <span>Isolate Away View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {awaySlots.map((slot) => {
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
                    className="flex-1 min-h-[40px] py-2 text-xs font-bold text-white bg-indigo-900/80 hover:bg-indigo-850 border border-indigo-700/80 rounded-xl transition-all text-center flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>Open Match Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyAwayWhatsApp(slot)}
                    className={`min-h-[40px] min-w-[40px] p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-colors border active:scale-95 ${
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
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs rounded-lg px-2.5 py-1.5 min-h-[36px] cursor-pointer focus:outline-none focus:border-indigo-500"
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
