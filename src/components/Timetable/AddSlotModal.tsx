import React, { useState } from 'react';
import { X, Plus, Clock, MapPin } from 'lucide-react';
import { AgeGroup, Pathway, PitchSector, SessionSlot } from '../../types';

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlot: (slot: SessionSlot) => void;
  sectors: PitchSector[];
  selectedDate: string;
  initialTimeSlot?: string;
  initialPitchSectorId?: string;
}

export const AddSlotModal: React.FC<AddSlotModalProps> = ({
  isOpen,
  onClose,
  onAddSlot,
  sectors,
  selectedDate,
  initialTimeSlot,
  initialPitchSectorId,
}) => {
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot || '14:30–15:45');
  const [pitchSectorId, setPitchSectorId] = useState(
    initialPitchSectorId || sectors[0]?.id || 'p1n'
  );
  const [ageGroupId, setAgeGroupId] = useState<AgeGroup>('1st Years');
  const [pathway, setPathway] = useState<Pathway>('Youth Performance');
  const [sessionTitle, setSessionTitle] = useState('Specialist Skills & Game Phase');
  const [sessionPurpose, setSessionPurpose] = useState('Focus on transition and tactical execution.');
  const [coachNotes, setCoachNotes] = useState('Bring cones and mini goals.');

  React.useEffect(() => {
    if (isOpen) {
      if (initialTimeSlot) setTimeSlot(initialTimeSlot);
      if (initialPitchSectorId) setPitchSectorId(initialPitchSectorId);
    }
  }, [isOpen, initialTimeSlot, initialPitchSectorId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [start, end] = timeSlot.split('–');

    const isAway = pitchSectorId === 'away';
    const newSlot: SessionSlot = {
      id: `slot-${Date.now()}`,
      date: selectedDate,
      timeSlot,
      startTime: start?.trim() || '14:30',
      endTime: end?.trim() || '15:45',
      pitchSectorId,
      isAway,
      venueName: isAway ? 'Away Ground' : undefined,
      ageGroupId,
      pathway,
      assignedCoachIds: [],
      sessionTitle,
      sessionPurpose,
      coachNotes,
      attachedDrillIds: ['drill-6'],
      equipmentChecklist: isAway
        ? [
            { item: 'Travelling Squad Match Ball Bag (18 balls)', checked: true },
            { item: 'Away Kit / Alternate White Socks & Tops', checked: true },
            { item: 'Portable Pitch First Aid Kit & Cold Packs', checked: true },
            { item: 'Captain Armband & Match Card / Pen', checked: true },
          ]
        : [
            { item: 'Balls and cones', checked: true },
            { item: 'Bibs', checked: false },
          ],
      status: 'Needs Coach',
    };

    onAddSlot(newSlot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Sunday Session Slot</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Time Slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
            >
              <option value="10:45–12:00">10:45–12:00</option>
              <option value="12:00–13:15">12:00–13:15</option>
              <option value="13:15–14:30">13:15–14:30</option>
              <option value="14:30–15:45">14:30–15:45</option>
              <option value="15:45–17:00">15:45–17:00</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Pitch Sector</label>
            <select
              value={pitchSectorId}
              onChange={(e) => setPitchSectorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
            >
              <option value="away">Away / External Match Ground</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Age Group</label>
            <select
              value={ageGroupId}
              onChange={(e) => setAgeGroupId(e.target.value as AgeGroup)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Pathway</label>
            <select
              value={pathway}
              onChange={(e) => setPathway(e.target.value as Pathway)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
            >
              <option value="Foundation">Foundation</option>
              <option value="Development">Development</option>
              <option value="Youth Performance">Youth Performance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Session Title</label>
          <input
            type="text"
            required
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Session Purpose / Goal
          </label>
          <input
            type="text"
            required
            value={sessionPurpose}
            onChange={(e) => setSessionPurpose(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Coach Notes</label>
          <textarea
            rows={2}
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
          >
            Create Slot
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSlotModal;
