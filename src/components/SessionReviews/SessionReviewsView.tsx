import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  Copy,
  Check,
  Share2,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AgeGroup, SessionSlot } from '../../types';
import { useAppStore } from '../../store';
import { getDebriefHealthSummary } from '../../utils/coachingIntelligence';

interface SessionReviewsViewProps {
  slots: SessionSlot[];
  onUpdateSlot: (slot: SessionSlot) => void;
  selectedDate?: string;
}

export const SessionReviewsView: React.FC<SessionReviewsViewProps> = ({
  slots,
  onUpdateSlot,
  selectedDate: propSelectedDate,
}) => {
  const storeSelectedDate = useAppStore((s) => s.selectedDate);
  const showToast = useAppStore((s) => s.showToast);

  const effectiveDate = propSelectedDate || storeSelectedDate || '2026-10-04';

  const [selectedGroup, setSelectedGroup] = useState<AgeGroup>('PEN');
  const [playersPresent, setPlayersPresent] = useState<number>(18);
  const [whatWorked, setWhatWorked] = useState(
    'Triangle passing clicked once we slowed the tempo down and introduced gate scoring.'
  );
  const [whatToChange, setWhatToChange] = useState(
    'Split into ability groups earlier for the 2v1 possession game.'
  );
  const [priorityNextWeek, setPriorityNextWeek] = useState(
    'Receiving technique with upright reverse stick before adding pressure.'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Debrief Health & Compliance summary for the selected Sunday
  const debriefSummary = getDebriefHealthSummary(slots, effectiveDate);

  // Find slot for selected group on effectiveDate (or fallback to any matching slot for this group)
  const currentSlot =
    slots.find((s) => s.ageGroupId === selectedGroup && s.date === effectiveDate) ||
    slots.find((s) => s.ageGroupId === selectedGroup);

  // Populate form fields whenever the selected group changes or slot updates
  useEffect(() => {
    if (currentSlot?.postSessionReflection) {
      setWhatWorked(currentSlot.postSessionReflection.whatWorked || '');
      setWhatToChange(currentSlot.postSessionReflection.whatToChangeNextSunday || '');
      setPriorityNextWeek(currentSlot.postSessionReflection.priorityForNextWeek || '');
    } else {
      setWhatWorked('');
      setWhatToChange('');
      setPriorityNextWeek('');
    }
  }, [selectedGroup, currentSlot?.id]);

  const handleSelectGroup = (group: AgeGroup) => {
    setSelectedGroup(group);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSlot) {
      showToast(`No scheduled session slot found for ${selectedGroup}.`);
      return;
    }

    const updated: SessionSlot = {
      ...currentSlot,
      postSessionReflection: {
        whatWorked,
        whatToChangeNextSunday: whatToChange,
        priorityForNextWeek: priorityNextWeek,
      },
    };
    onUpdateSlot(updated);
    setSavedSuccess(true);
    showToast(`Saved debrief reflection for ${selectedGroup}!`);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyWhatsAppReminder = () => {
    const pendingGroups = debriefSummary.groups
      .filter((g) => g.status === 'pending')
      .map((g) => g.ageGroupId);

    let message = '';
    if (pendingGroups.length === 0) {
      message = `🏑 *OLD ALEX COACHING HUB — SUNDAY DEBRIEF STATUS*\n📅 *Sunday:* ${effectiveDate}\n\n🎉 *All youth age groups have submitted their Sunday session debriefs!* Thank you all coaches for logging feedback and priorities for next week.`;
    } else {
      const groupList = pendingGroups.map((grp) => `• ${grp}`).join('\n');
      message = `🏑 *OLD ALEX COACHING HUB — SUNDAY DEBRIEF REMINDER*\n📅 *Sunday:* ${effectiveDate}\n\nHi coaches, please take 60 seconds to log your post-session reflections on the Coaching Hub so we can carry forward our technical priorities for next Sunday.\n\n⚠️ *Pending Age Groups (${pendingGroups.length}):*\n${groupList}\n\n🔗 Log on the Coaching Hub under *Session Reviews*.`;
    }

    navigator.clipboard.writeText(message);
    setCopiedReminder(true);
    showToast('WhatsApp reminder copied to clipboard!');
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  // Past reviews logged from all slots
  const loggedReviews = slots.filter((s) => s.postSessionReflection?.whatWorked);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black border border-neutral-800 p-5 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-data text-red-500 font-semibold uppercase tracking-wider">
            Continuous Improvement
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-xs text-neutral-400">Post-Sunday Debrief</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
          <ClipboardCheck className="w-6 h-6 text-red-500" />
          <span>Session Reviews & Post-Pitch Log</span>
        </h1>
        <p className="text-xs text-neutral-300 mt-1">
          Reflect on what worked, what to change, and the technical priority for next Sunday — logged per group, per date.
        </p>
      </div>

      {/* Step 4: Debrief Health & Compliance Bar */}
      <div className="bg-black border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-mono-data text-neutral-300">
              <Calendar className="w-4 h-4 text-red-500" />
              <span className="font-bold text-white">SUNDAY {effectiveDate}</span>
              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">Debrief Compliance:</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                {debriefSummary.completedCount} Completed
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                {debriefSummary.pendingCount} Pending
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyWhatsAppReminder}
            className="min-h-[44px] px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-emerald-500 text-neutral-200 hover:text-white rounded-xl transition-all active:scale-95 shadow-sm"
            title="Copy WhatsApp reminder for Director of Coaching to post in coaches group"
          >
            {copiedReminder ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Reminder Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Copy WhatsApp Debrief Reminder</span>
              </>
            )}
          </button>
        </div>

        {/* Horizontal quick-select chips for scheduled age groups */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Scheduled Age Groups for this Sunday:</span>
            <span className="text-[11px] text-neutral-500">Tap chip to load in debrief form</span>
          </div>

          {debriefSummary.groups.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-1">
              No sessions scheduled on this Sunday date ({effectiveDate}). Select from dropdown below or change date in header.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {debriefSummary.groups.map((grp) => {
                const isSelected = selectedGroup === grp.ageGroupId;
                const isCompleted = grp.status === 'completed';

                return (
                  <button
                    key={`${grp.slotId}-${grp.ageGroupId}`}
                    type="button"
                    onClick={() => handleSelectGroup(grp.ageGroupId as AgeGroup)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-red-500 ring-2 ring-red-500/20'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                    ) : (
                      <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30 animate-pulse" />
                    )}
                    <span>{grp.ageGroupId}</span>
                    <span className="text-[10px] font-mono-data opacity-70">
                      {isCompleted ? 'Done' : 'Pending'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Review Log Form */}
        <form
          onSubmit={handleSaveReview}
          className="lg:col-span-7 bg-black border border-neutral-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200 font-mono-data">
              Log a New Review ({selectedGroup})
            </h2>
            {savedSuccess && (
              <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Review Saved to Club Database
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Age Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value as AgeGroup)}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 min-h-[44px]"
              >
                {[
                  'PEN',
                  '1st Class',
                  '2nd Class',
                  '3rd Class',
                  '4th Class',
                  '5th Class',
                  '6th Class',
                  '1st Years',
                  'Minors',
                  'Inters',
                ].map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Players Present on Turf
              </label>
              <input
                type="number"
                min={4}
                max={40}
                value={playersPresent}
                onChange={(e) => setPlayersPresent(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono-data min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              What worked well?
            </label>
            <textarea
              rows={3}
              required
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="E.g. Passing tempo, enthusiasm, game understanding..."
              className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              What to change next time?
            </label>
            <textarea
              rows={3}
              required
              value={whatToChange}
              onChange={(e) => setWhatToChange(e.target.value)}
              placeholder="E.g. Earlier pod split, larger cone gates..."
              className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Priority for next session
            </label>
            <input
              type="text"
              required
              value={priorityNextWeek}
              onChange={(e) => setPriorityNextWeek(e.target.value)}
              placeholder="E.g. Receiving technique before adding pressure"
              className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-neutral-500 min-h-[44px]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-all active:scale-95"
            >
              Save Review
            </button>
          </div>
        </form>

        {/* Right: Past Logged Reviews Feed */}
        <div className="lg:col-span-5 bg-black border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200 font-mono-data">
              Logged Reflections ({loggedReviews.length})
            </h2>
            <span className="text-xs font-mono-data text-neutral-400">
              Synced with Timetable
            </span>
          </div>

          {loggedReviews.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-6 text-center">
              No reviews logged yet. Submit your first post-session debrief using the form.
            </p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loggedReviews.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono-data bg-neutral-900 px-2 py-0.5 rounded border border-neutral-750">
                      {slot.ageGroupId}
                    </span>
                    <span className="text-neutral-400 font-mono-data">{slot.date}</span>
                  </div>

                  {slot.postSessionReflection?.whatWorked && (
                    <div>
                      <span className="text-neutral-400 font-semibold">Worked well: </span>
                      <span className="text-neutral-200">
                        {slot.postSessionReflection.whatWorked}
                      </span>
                    </div>
                  )}

                  {slot.postSessionReflection?.whatToChangeNextSunday && (
                    <div>
                      <span className="text-neutral-400 font-semibold">Next tweak: </span>
                      <span className="text-neutral-300">
                        {slot.postSessionReflection.whatToChangeNextSunday}
                      </span>
                    </div>
                  )}

                  {slot.postSessionReflection?.priorityForNextWeek && (
                    <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-red-400 font-semibold">
                      <span>Priority: {slot.postSessionReflection.priorityForNextWeek}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
