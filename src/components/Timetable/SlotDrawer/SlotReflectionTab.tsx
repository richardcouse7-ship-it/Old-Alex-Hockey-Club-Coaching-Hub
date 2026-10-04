import React from 'react';
import { SessionSlot } from '../../../types';

export interface SlotReflectionTabProps {
  slot: SessionSlot;
  onUpdateSlot: (updatedSlot: SessionSlot) => void;
}

export const SlotReflectionTab: React.FC<SlotReflectionTabProps> = ({ slot, onUpdateSlot }) => {
  return (
    <div className="space-y-4">
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
        <h4 className="text-sm font-bold text-white mb-2">
          Post-Session Coach Review
        </h4>
        <p className="text-xs text-neutral-400 mb-4">
          Record feedback immediately after the slot to inform the next Sunday timetable.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              What worked well today?
            </label>
            <textarea
              rows={2}
              value={slot.postSessionReflection?.whatWorked || ''}
              onChange={(e) =>
                onUpdateSlot({
                  ...slot,
                  postSessionReflection: {
                    whatWorked: e.target.value,
                    whatToChangeNextSunday:
                      slot.postSessionReflection?.whatToChangeNextSunday || '',
                    priorityForNextWeek:
                      slot.postSessionReflection?.priorityForNextWeek || '',
                  },
                })
              }
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              placeholder="E.g. Passing technique was clean once we slowed tempo..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              What should change next Sunday?
            </label>
            <textarea
              rows={2}
              value={slot.postSessionReflection?.whatToChangeNextSunday || ''}
              onChange={(e) =>
                onUpdateSlot({
                  ...slot,
                  postSessionReflection: {
                    whatWorked: slot.postSessionReflection?.whatWorked || '',
                    whatToChangeNextSunday: e.target.value,
                    priorityForNextWeek:
                      slot.postSessionReflection?.priorityForNextWeek || '',
                  },
                })
              }
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              placeholder="E.g. Split into 3 groups earlier for the game..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Priority for next session
            </label>
            <input
              type="text"
              value={slot.postSessionReflection?.priorityForNextWeek || ''}
              onChange={(e) =>
                onUpdateSlot({
                  ...slot,
                  postSessionReflection: {
                    whatWorked: slot.postSessionReflection?.whatWorked || '',
                    whatToChangeNextSunday:
                      slot.postSessionReflection?.whatToChangeNextSunday || '',
                    priorityForNextWeek: e.target.value,
                  },
                })
              }
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              placeholder="E.g. Receiving technique before adding pressure"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
