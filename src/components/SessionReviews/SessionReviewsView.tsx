import React, { useState } from 'react';
import { ClipboardCheck, Plus, CheckCircle, Clock, Calendar, Users, AlertCircle } from 'lucide-react';
import { AgeGroup, SessionSlot } from '../../types';

interface SessionReviewsViewProps {
  slots: SessionSlot[];
  onUpdateSlot: (slot: SessionSlot) => void;
}

export const SessionReviewsView: React.FC<SessionReviewsViewProps> = ({ slots, onUpdateSlot }) => {
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

  // Find slot for selected group
  const currentSlot = slots.find((s) => s.ageGroupId === selectedGroup);

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSlot) return;

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
    setTimeout(() => setSavedSuccess(false), 3000);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Review Log Form */}
        <form
          onSubmit={handleSaveReview}
          className="lg:col-span-7 bg-black border border-neutral-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200 font-mono-data">
              Log a New Review
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
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
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
                className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono-data"
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
              className="w-full bg-neutral-950 border border-neutral-750 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 placeholder-neutral-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-all active:scale-95"
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

                  <div>
                    <span className="text-neutral-400 font-semibold">Worked well: </span>
                    <span className="text-neutral-200">
                      {slot.postSessionReflection?.whatWorked}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 font-semibold">Next tweak: </span>
                    <span className="text-neutral-300">
                      {slot.postSessionReflection?.whatToChangeNextSunday}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-red-400 font-semibold">
                    <span>Priority: {slot.postSessionReflection?.priorityForNextWeek}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
