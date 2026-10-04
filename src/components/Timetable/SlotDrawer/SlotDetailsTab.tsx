import React from 'react';
import {
  Compass,
  Clock,
  MapPin,
  Navigation,
  ExternalLink,
  Users,
  UserCheck,
  Plus,
  X,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';
import { AgeGroup, Coach, Pathway, PitchSector, SessionSlot } from '../../../types';
import { calculateEndTime } from '../../../utils/timeUtils';

export interface SlotDetailsTabProps {
  slot: SessionSlot;
  sectors: PitchSector[];
  coaches: Coach[];
  onUpdateSlot: (updatedSlot: SessionSlot) => void;
  onTriggerNotification?: (
    title: string,
    message: string,
    type: 'pitch_change' | 'coach_sub' | 'schedule_update'
  ) => void;
}

export const SlotDetailsTab: React.FC<SlotDetailsTabProps> = ({
  slot,
  sectors,
  coaches,
  onUpdateSlot,
  onTriggerNotification,
}) => {
  const assignedCoaches = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
  const availableCoaches = coaches.filter((c) => !slot.assignedCoachIds.includes(c.id));

  const handleToggleCoach = (coachId: string) => {
    let newCoachIds: string[];
    const isCurrentlyAssigned = slot.assignedCoachIds.includes(coachId);
    if (isCurrentlyAssigned) {
      newCoachIds = slot.assignedCoachIds.filter((id) => id !== coachId);
    } else {
      newCoachIds = [...slot.assignedCoachIds, coachId];
    }

    const updated: SessionSlot = {
      ...slot,
      assignedCoachIds: newCoachIds,
      status: newCoachIds.length === 0 ? 'Needs Coach' : 'Ready',
    };
    onUpdateSlot(updated);

    if (onTriggerNotification) {
      const coach = coaches.find((c) => c.id === coachId);
      onTriggerNotification(
        'Coach Roster Updated',
        `${coach?.name || 'Coach'} ${isCurrentlyAssigned ? 'unassigned from' : 'assigned to'} ${slot.ageGroupId} (${slot.timeSlot}).`,
        'coach_sub'
      );
    }
  };

  const handleSectorChange = (newSectorId: string) => {
    const isNowAway = newSectorId === 'away';
    const updated: SessionSlot = {
      ...slot,
      pitchSectorId: newSectorId,
      isAway: isNowAway,
    };
    onUpdateSlot(updated);

    if (onTriggerNotification) {
      const newSec = sectors.find((s) => s.id === newSectorId);
      onTriggerNotification(
        'Pitch Sector Relocated',
        isNowAway
          ? `${slot.ageGroupId} marked as Away Fixture at ${slot.venueName || 'External Venue'}.`
          : `${slot.ageGroupId} moved to ${newSec?.name || newSectorId} for ${slot.timeSlot}.`,
        'pitch_change'
      );
    }
  };

  const handleTimeChange = (field: 'start' | 'end', val: string) => {
    const start = field === 'start' ? val : (slot.startTime || '10:00');
    const end = field === 'end' ? val : (slot.endTime || '11:15');
    onUpdateSlot({
      ...slot,
      startTime: start,
      endTime: end,
      timeSlot: `${start}–${end}`,
    });
  };

  const handleSetDuration = (durationMins: number) => {
    const start = slot.startTime || '10:00';
    const newEnd = calculateEndTime(start, durationMins);
    onUpdateSlot({
      ...slot,
      endTime: newEnd,
      timeSlot: `${start}–${newEnd}`,
    });
  };

  const handleAgeGroupChange = (newAge: AgeGroup) => {
    let recPathway: Pathway = slot.pathway;
    if (['PEN', '1st Class', '2nd Class', '3rd Class'].includes(newAge)) {
      recPathway = 'Foundation';
    } else if (['4th Class', '5th Class', '6th Class'].includes(newAge)) {
      recPathway = 'Development';
    } else {
      recPathway = 'Youth Performance';
    }

    onUpdateSlot({
      ...slot,
      ageGroupId: newAge,
      pathway: recPathway,
    });
  };

  const handlePathwayChange = (pw: Pathway) => {
    onUpdateSlot({ ...slot, pathway: pw });
  };

  const handleTitleChange = (title: string) => {
    onUpdateSlot({ ...slot, sessionTitle: title });
  };

  const handleDateChange = (date: string) => {
    onUpdateSlot({ ...slot, date });
  };

  const handleNotesChange = (notes: string) => {
    onUpdateSlot({ ...slot, coachNotes: notes });
  };

  const handlePurposeChange = (purpose: string) => {
    onUpdateSlot({ ...slot, sessionPurpose: purpose });
  };

  const handleToggleEquipment = (index: number) => {
    const updatedList = slot.equipmentChecklist.map((item, idx) =>
      idx === index ? { ...item, checked: !item.checked } : item
    );
    onUpdateSlot({ ...slot, equipmentChecklist: updatedList });
  };

  return (
    <>
      {/* Away Match Logistics Card if Away */}
      {(slot.isAway || slot.pitchSectorId === 'away') && (
        <div className="bg-gradient-to-r from-blue-950/40 via-neutral-900 to-indigo-950/30 p-4 rounded-2xl border border-blue-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                <Compass className="w-3 h-3" />
                Away Fixture
              </span>
              <span className="text-xs font-bold text-blue-300">
                vs {slot.opposition || 'Opposition'}
              </span>
            </div>
            {slot.meetTime && (
              <div className="text-xs font-semibold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Squad Meet: <strong>{slot.meetTime}</strong></span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-blue-900/40">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-white font-medium">{slot.venueName || 'Away Ground'}</span>
                {slot.transportNotes && (
                  <span className="text-neutral-400 text-[11px] block">{slot.transportNotes}</span>
                )}
              </div>
            </div>

            {slot.venueName && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  slot.venueName + ' Dublin hockey pitch'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Venue Directions</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 1. Team & Age Group Assignment Card */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-red-500" />
            <span>Team & Age Group Assignment</span>
          </span>
          <span className="text-[11px] text-red-400 font-semibold font-mono-data">
            {slot.pathway} Pathway
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Age Group Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Age Group / Team
            </label>
            <select
              value={slot.ageGroupId}
              onChange={(e) => handleAgeGroupChange(e.target.value as AgeGroup)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
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

          {/* Pathway Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Coaching Pathway
            </label>
            <select
              value={slot.pathway}
              onChange={(e) => handlePathwayChange(e.target.value as Pathway)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="Foundation">Foundation (PEN – 3rd Class)</option>
              <option value="Development">Development (4th – 6th Class)</option>
              <option value="Youth Performance">Youth Performance (1st Yr – Inters)</option>
            </select>
          </div>
        </div>

        {/* Session Title */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            Session Title & Topic
          </label>
          <input
            type="text"
            value={slot.sessionTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Move, Explore & Meet the Ball"
            className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
          />
        </div>
      </div>

      {/* 2. Session Timings & Pitch Allocation Card */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span>Session Timings & Duration</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-mono-data font-semibold">
            Current: {slot.timeSlot}
          </span>
        </div>

        {/* Date, Start Time, End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Session Date
            </label>
            <input
              type="date"
              value={slot.date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={slot.startTime || '10:00'}
              onChange={(e) => handleTimeChange('start', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={slot.endTime || '11:15'}
              onChange={(e) => handleTimeChange('end', e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
        </div>

        {/* Quick Duration Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-850">
          <span className="text-[11px] text-neutral-400 font-medium">Quick Duration Presets:</span>
          <div className="flex items-center gap-1.5">
            {[60, 75, 90, 105].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => handleSetDuration(dur)}
                className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 hover:border-red-500 border border-neutral-750 rounded-lg text-white transition-colors"
              >
                {dur} mins
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Sector & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-855">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Pitch Sector Allocation
            </label>
            <select
              value={slot.pitchSectorId}
              onChange={(e) => handleSectorChange(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              {(slot.isAway || slot.pitchSectorId === 'away') && (
                <option value="away">
                  Away — {slot.venueName || 'External Ground'}
                </option>
              )}
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
              {!(slot.isAway || slot.pitchSectorId === 'away') && (
                <option value="away">
                  Away — External Match Ground
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Session Status
            </label>
            <select
              value={slot.status}
              onChange={(e) =>
                onUpdateSlot({
                  ...slot,
                  status: e.target.value as SessionSlot['status'],
                })
              }
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="Ready">Ready to Coach</option>
              <option value="Needs Coach">Needs Coach</option>
              <option value="Needs Plan">Needs Plan</option>
              <option value="Conflict">Conflict</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assigned Coaches Section */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-red-500" />
            Assigned Coaches ({assignedCoaches.length})
          </h3>
          <span className="text-xs text-neutral-400">
            {assignedCoaches.length === 0 ? '⚠️ No coach assigned' : 'Staffed'}
          </span>
        </div>

        {/* Active coaches chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {assignedCoaches.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-750 text-xs font-bold text-white shadow-sm"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: c.accentColor }}
              />
              {c.name}
              <span className="text-[10px] text-neutral-400">({c.role.split(' ')[0]})</span>
              <button
                type="button"
                onClick={() => handleToggleCoach(c.id)}
                className="ml-1 text-neutral-400 hover:text-red-400"
                title="Remove coach"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        {/* Add Coach Dropdown */}
        {availableCoaches.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
            <span className="text-xs text-neutral-400 font-semibold">Add coach:</span>
            <div className="flex flex-wrap gap-1.5">
              {availableCoaches.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleToggleCoach(c.id)}
                  className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 hover:border-red-500 border border-neutral-750 rounded-lg text-white transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-red-500" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session Purpose & Focus */}
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Session Purpose & Key Outcome
        </label>
        <textarea
          rows={2}
          value={slot.sessionPurpose}
          onChange={(e) => handlePurposeChange(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          placeholder="E.g. Build enjoyment, body awareness, and comfortable stick grip through imaginative games..."
        />
      </div>

      {/* Coach Prep Notes */}
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Coach Notes & Special Instructions
        </label>
        <textarea
          rows={3}
          value={slot.coachNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          placeholder="Pitch setup instructions, pod divisions, equipment bag numbers..."
        />
      </div>

      {/* Running Order Timeline */}
      {slot.runningOrder && slot.runningOrder.length > 0 && (
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
          <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-red-500" />
            Running Order Schedule ({slot.timeSlot})
          </h3>
          <div className="space-y-2">
            {slot.runningOrder.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-neutral-900 border border-neutral-800"
              >
                <span className="text-white font-medium">{step.activity}</span>
                <span className="font-mono-data text-red-400 font-bold bg-black px-2 py-0.5 rounded border border-neutral-800">
                  {step.durationMins} mins
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Checklist */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
        <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Sector Equipment Checklist
        </h3>
        <div className="space-y-2">
          {slot.equipmentChecklist.map((item, idx) => (
            <label
              key={idx}
              className="flex items-center gap-3 text-xs text-neutral-200 hover:text-white cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggleEquipment(idx)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500"
              />
              <span className={item.checked ? 'line-through text-neutral-500' : ''}>
                {item.item}
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
};
