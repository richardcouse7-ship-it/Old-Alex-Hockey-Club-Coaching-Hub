import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Coach, CoachAvailabilityStatus } from '../../../types';

export interface DirectAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  coaches: Coach[];
  selectedDate: string;
  onSubmit: (coachId: string, status: CoachAvailabilityStatus, notes: string) => void;
}

export const DirectAvailabilityModal: React.FC<DirectAvailabilityModalProps> = ({
  isOpen,
  onClose,
  coaches,
  selectedDate,
  onSubmit,
}) => {
  const [selectedCoachId, setSelectedCoachId] = useState(coaches[0]?.id || '');
  const [status, setStatus] = useState<CoachAvailabilityStatus>('AVAILABLE');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (coaches.length > 0 && !selectedCoachId) {
      setSelectedCoachId(coaches[0].id);
    }
  }, [coaches, selectedCoachId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoachId) return;

    onSubmit(selectedCoachId, status, notes);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-black border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Record Coach Sunday Availability</h3>
            <p className="text-xs text-neutral-400 font-mono-data mt-0.5">{selectedDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">Select Coach</label>
          <select
            value={selectedCoachId}
            onChange={(e) => setSelectedCoachId(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Availability Status for {selectedDate}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CoachAvailabilityStatus)}
            className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value="AVAILABLE">Available for any Sunday slot</option>
            <option value="SENIOR_MATCH">Senior Match Duty (EYHL / League)</option>
            <option value="MORNING_ONLY">Morning Only (10:45 slot only)</option>
            <option value="AFTERNOON_ONLY">Afternoon Only (13:15 slot only)</option>
            <option value="AWAY">Away / Unavailable</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">Notes / Times</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Senior away match at Loreto at 14:00"
            className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-md transition-colors"
          >
            Save Availability
          </button>
        </div>
      </form>
    </div>
  );
};
