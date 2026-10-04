import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Target,
  AlertCircle,
  Copy,
  Check,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { PitchSector, SessionSlot } from '../../../types';
import { useAppStore } from '../../../store';
import {
  getSeasonPhaseForDate,
  getPreviousSessionReflection,
} from '../../../utils/coachingIntelligence';

export interface SlotPlanTabProps {
  slot: SessionSlot;
  currentSector?: PitchSector;
  slots?: SessionSlot[];
}

export const SlotPlanTab: React.FC<SlotPlanTabProps> = ({
  slot,
  currentSector,
  slots: propSlots,
}) => {
  const storeSlots = useAppStore((s) => s.slots);
  const updateSlot = useAppStore((s) => s.updateSlot);
  const showToast = useAppStore((s) => s.showToast);

  const allSlots = propSlots && propSlots.length > 0 ? propSlots : storeSlots;
  const [copiedDebrief, setCopiedDebrief] = useState(false);

  // Coaching Intelligence calculations
  const seasonPhase = getSeasonPhaseForDate(slot.date);
  const priorDebrief = getPreviousSessionReflection(allSlots, slot);

  const handleCopyDebrief = () => {
    if (!priorDebrief) return;
    const { reflection, priorDate } = priorDebrief;
    const parts = [
      `🏑 *OLD ALEX CARRY-FORWARD FOCUS (${slot.ageGroupId})*`,
      `📅 Prior Sunday: ${priorDate}`,
      reflection.priorityForNextWeek ? `🎯 Priority for today: ${reflection.priorityForNextWeek}` : '',
      reflection.whatToChangeNextSunday ? `⚠️ Watch out: ${reflection.whatToChangeNextSunday}` : '',
      reflection.whatWorked ? `✅ What worked: ${reflection.whatWorked}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(parts);
    setCopiedDebrief(true);
    setTimeout(() => setCopiedDebrief(false), 2500);
    showToast('Copied prior debrief focus to clipboard');
  };

  const handleAdoptFocus = () => {
    if (!priorDebrief) return;
    const priority = priorDebrief.reflection.priorityForNextWeek;
    if (!priority) return;

    const updatedPurpose = slot.sessionPurpose
      ? `${slot.sessionPurpose} [Prior Debrief Focus: ${priority}]`
      : `Prior Debrief Focus: ${priority}`;

    const updatedNotes = slot.coachNotes
      ? `${slot.coachNotes}\n• Carried forward from ${priorDebrief.priorDate}: ${priority}`
      : `• Carried forward from ${priorDebrief.priorDate}: ${priority}`;

    updateSlot({
      ...slot,
      sessionPurpose: updatedPurpose,
      coachNotes: updatedNotes,
      keyFocus: priority,
    });
    showToast('Adopted prior week priority into session purpose & notes!');
  };

  return (
    <div className="space-y-4">
      {/* External Coaching Plan Bar */}
      <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {slot.externalPlanTitle || `${slot.ageGroupId} Coaching Plan PDF`}
            </h4>
            <p className="text-xs text-neutral-400">
              Official Old Alex coaching pack syllabus
            </p>
          </div>
        </div>
        <a
          href={slot.externalPlanUrl || '#'}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-red-500 rounded-xl transition-colors active:scale-95"
        >
          <span>External URL</span>
          <ExternalLink className="w-3.5 h-3.5 text-red-500" />
        </a>
      </div>

      {/* Built-in Authentic Coaching Plan Document Viewer */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950 shadow-inner">
        {/* Top document bar matching video pack */}
        <div className="bg-red-600 px-4 py-3 flex items-center justify-between text-white">
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-white">
            OLD ALEX HOCKEY CLUB | YOUTH COACHING
          </span>
          <span className="text-xs font-mono-data bg-black/40 px-2 py-0.5 rounded text-white font-bold">
            SUNDAY {slot.date}
          </span>
        </div>

        <div className="p-6 space-y-6 text-white">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                {slot.ageGroupId}
              </span>

              {/* Step 3.1: Season Curriculum Alignment Pill */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-900 border border-red-500/30 text-neutral-200"
                title={seasonPhase.checkpoint}
              >
                <Compass className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-red-400 font-mono-data">Phase {seasonPhase.phaseNumber}:</span>
                <span className="font-semibold">{seasonPhase.phaseName}</span>
                <span className="text-neutral-500 hidden sm:inline">·</span>
                <span className="text-neutral-300 font-normal hidden sm:inline text-[11px]">
                  {seasonPhase.focus}
                </span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mt-1">{slot.sessionTitle}</h3>
            <div className="flex items-center gap-4 text-xs text-neutral-300 mt-2 font-mono-data">
              <span>TIMING: {slot.timeSlot}</span>
              <span>·</span>
              <span>LOCATION: {currentSector?.name || slot.pitchSectorId}</span>
              <span>·</span>
              <span>DURATION: 75 MINS</span>
            </div>
          </div>

          {/* Step 3.2: Previous Sunday Debrief Carry-Forward Card */}
          {priorDebrief &&
            (priorDebrief.reflection.priorityForNextWeek ||
              priorDebrief.reflection.whatToChangeNextSunday) && (
              <div className="bg-neutral-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Previous Sunday Debrief Carry-Forward
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-mono-data">
                        Logged on Sunday {priorDebrief.priorDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyDebrief}
                      className="min-h-[44px] px-3 py-2 text-xs font-bold flex items-center gap-1.5 bg-neutral-950 hover:bg-black border border-neutral-750 hover:border-amber-400 text-neutral-200 hover:text-white rounded-xl transition-all active:scale-95"
                      title="Copy prior debrief notes to clipboard"
                    >
                      {copiedDebrief ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {priorDebrief.reflection.priorityForNextWeek && (
                      <button
                        type="button"
                        onClick={handleAdoptFocus}
                        className="min-h-[44px] px-3 py-2 text-xs font-bold flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 rounded-xl transition-all active:scale-95"
                        title="Adopt this priority directly into today's session purpose"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Adopt Focus</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {priorDebrief.reflection.priorityForNextWeek && (
                    <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-amber-400 font-bold shrink-0">Priority for today:</span>
                      <span className="text-white font-medium">
                        {priorDebrief.reflection.priorityForNextWeek}
                      </span>
                    </div>
                  )}

                  {priorDebrief.reflection.whatToChangeNextSunday && (
                    <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-xl border border-neutral-800 text-neutral-300">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-red-400 font-semibold mr-1">Watch out:</span>
                        <span>{priorDebrief.reflection.whatToChangeNextSunday}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          <div className="border-t border-neutral-800 pt-4">
            <h4 className="text-xs font-bold uppercase text-neutral-400 mb-1">
              Session Purpose
            </h4>
            <p className="text-sm text-neutral-200">{slot.sessionPurpose}</p>
          </div>

          {/* Running order table */}
          <div className="border-t border-neutral-800 pt-4">
            <h4 className="text-xs font-bold uppercase text-neutral-400 mb-3">
              Running Order
            </h4>
            <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black">
              <table className="w-full text-xs">
                <thead className="bg-neutral-900 text-neutral-300 font-semibold border-b border-neutral-800">
                  <tr>
                    <th className="text-left py-2.5 px-3">Activity</th>
                    <th className="text-right py-2.5 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono-data">
                  {(slot.runningOrder || []).map((ro, i) => (
                    <tr key={i} className="hover:bg-neutral-900/40">
                      <td className="py-2 px-3 font-sans text-white">
                        {ro.activity}
                      </td>
                      <td className="py-2 px-3 text-right text-red-400 font-bold">
                        {ro.durationMins} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key points */}
          <div className="border-t border-neutral-800 pt-4">
            <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">
              Key Coaching Points
            </h4>
            <ul className="text-xs space-y-1.5 text-neutral-200">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✓</span>
                Two hands on stick when near the ball; soft hands trap.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✓</span>
                Left hand high on grip; flat stick barrier when stopping.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✓</span>
                Scan up into open pitch space before releasing pass.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✓</span>
                Praise exploration and bravery in 1v1 situations.
              </li>
            </ul>
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <h4 className="text-xs font-bold uppercase text-neutral-400 mb-2">
              After the Session Reflection Prompt
            </h4>
            <p className="text-xs text-neutral-300 italic">
              "What worked well? What should we change next Sunday?"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
