import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  Share2,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit2,
  Users,
  FileDown,
  Navigation,
  Compass,
} from 'lucide-react';
import { AgeGroup, Coach, Drill, DrillDiagramElement, Pathway, PitchSector, SessionSlot } from '../../types';
import { TacticalDiagram } from '../TacticalBoard/TacticalDiagram';
import { TacticalWhiteboard } from '../TacticalBoard/TacticalWhiteboard';
import { calculateEndTime } from '../../utils/timeUtils';
import { ExportService } from '../../services/exportService';

interface SlotSideDrawerProps {
  slot: SessionSlot | null;
  onClose: () => void;
  onUpdateSlot: (updatedSlot: SessionSlot) => void;
  coaches: Coach[];
  sectors: PitchSector[];
  allDrills: Drill[];
  onTriggerNotification?: (title: string, message: string, type: 'pitch_change' | 'coach_sub' | 'schedule_update') => void;
  onUpdateDrill?: (drill: Drill) => void;
  onOpenPitchCompanion?: (slot: SessionSlot) => void;
  onOpenWhatsAppModal?: (slotId: string) => void;
  onDeleteSlot?: (slotId: string) => void;
}

export const SlotSideDrawer: React.FC<SlotSideDrawerProps> = ({
  slot,
  onClose,
  onUpdateSlot,
  coaches,
  sectors,
  allDrills,
  onTriggerNotification,
  onUpdateDrill,
  onOpenPitchCompanion,
  onOpenWhatsAppModal,
  onDeleteSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'drills' | 'plan' | 'reflection'>('details');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showAttachDrillModal, setShowAttachDrillModal] = useState(false);
  const [selectedDrillToAttach, setSelectedDrillToAttach] = useState<string>('');
  const [whiteboardDrill, setWhiteboardDrill] = useState<Drill | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!slot) return null;

  const currentSector = sectors.find((s) => s.id === slot.pitchSectorId);
  const assignedCoaches = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
  const availableCoaches = coaches.filter((c) => !slot.assignedCoachIds.includes(c.id));
  const attachedDrillIds = slot.drillIds || (slot as unknown as { attachedDrillIds?: string[] }).attachedDrillIds || [];
  const attachedDrills = allDrills.filter((d) => attachedDrillIds.includes(d.id));

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

  const handleAttachDrill = () => {
    if (!selectedDrillToAttach) return;
    if (slot.attachedDrillIds.includes(selectedDrillToAttach)) return;
    const updated = {
      ...slot,
      attachedDrillIds: [...slot.attachedDrillIds, selectedDrillToAttach],
    };
    onUpdateSlot(updated);
    setSelectedDrillToAttach('');
    setShowAttachDrillModal(false);
  };

  const handleRemoveDrill = (drillId: string) => {
    const updated = {
      ...slot,
      attachedDrillIds: slot.attachedDrillIds.filter((id) => id !== drillId),
    };
    onUpdateSlot(updated);
  };

  const handleCopySlotWhatsApp = () => {
    const coachNames = assignedCoaches.map((c) => c.name).join(', ') || 'TBC';
    const text = `🏑 *OLD ALEX HOCKEY — ${slot.ageGroupId.toUpperCase()} SESSION*
⏰ *Time:* ${slot.timeSlot}
📍 *Pitch Sector:* ${currentSector?.name || slot.pitchSectorId} (${currentSector?.code})
👥 *Coaches:* ${coachNames}
🎯 *Focus:* ${slot.sessionTitle}
📝 *Purpose:* ${slot.sessionPurpose}

ℹ️ *Coaching Notes:*
${slot.coachNotes || 'Standard pathway setup.'}

*Attached Drills:*
${attachedDrills.map((d) => `• ${d.title} (${d.durationMinutes}m)`).join('\n') || 'None attached'}

_Old Alex Youth Coaching Hub_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="relative w-screen max-w-2xl bg-black border-l border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 bg-neutral-950">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      slot.pathway === 'Foundation'
                        ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                        : slot.pathway === 'Development'
                        ? 'bg-neutral-900 text-white border border-neutral-700'
                        : 'bg-red-600/20 text-red-300 border border-red-500/50'
                    }`}
                  >
                    {slot.pathway} Pathway
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-mono-data font-bold ${
                      slot.status === 'Ready'
                        ? 'text-emerald-400 bg-neutral-900 border border-emerald-800/60'
                        : slot.status === 'Needs Coach'
                        ? 'text-amber-400 bg-neutral-900 border border-amber-800/60'
                        : 'text-neutral-300 bg-neutral-900 border border-neutral-800'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{slot.ageGroupId}</span>
                  <span className="text-neutral-500 text-lg font-normal">—</span>
                  <span className="text-white text-lg font-semibold">{slot.sessionTitle}</span>
                </h2>
                <div className="flex items-center flex-wrap gap-3 text-xs text-neutral-300 mt-2 font-mono-data">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    {slot.timeSlot}
                  </span>
                  {slot.isAway || slot.pitchSectorId === 'away' ? (
                    <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <Compass className="w-3.5 h-3.5 text-blue-400" />
                      Away · {slot.venueName || 'Away Ground'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {currentSector?.name} ({currentSector?.code})
                    </span>
                  )}
                  {slot.meetTime && (
                    <span className="flex items-center gap-1 text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 font-semibold">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Meet: {slot.meetTime}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenPitchCompanion && (
                  <button
                    type="button"
                    onClick={() => onOpenPitchCompanion(slot)}
                    className="p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white transition-colors shadow-sm"
                    title="Launch Live Turf Timer with referee whistle alerts"
                  >
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="hidden sm:inline">Pitch Clock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenWhatsAppModal) {
                      onOpenWhatsAppModal(slot.id);
                    } else {
                      handleCopySlotWhatsApp();
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    copiedWhatsApp
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-emerald-400'
                  }`}
                  title="WhatsApp Templates (Briefing / Parent update)"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {copiedWhatsApp ? 'Copied!' : 'WhatsApp'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentSector) return;
                    const html = ExportService.generateSlot1PagePDFHtml(
                      slot,
                      coaches,
                      currentSector,
                      allDrills,
                      slot.date,
                      slot.coachNotes
                    );
                    ExportService.printOrSavePDF(html, `OldAlex-${slot.ageGroupId}-${slot.pitchSectorId}`);
                  }}
                  className="p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-purple-400 hover:text-purple-300 transition-colors shadow-sm"
                  title="Save or share sunlight-ready 1-Page Digital PDF Card"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Card</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-6 border-b border-neutral-800 -mb-6">
              {[
                { id: 'details', label: 'Session Details & Roster' },
                { id: 'drills', label: `Drills Attached (${attachedDrills.length})` },
                { id: 'plan', label: 'Session Plan Viewer' },
                { id: 'reflection', label: 'Post-Review' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-red-500 text-white bg-red-600/10'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black">
            {activeTab === 'details' && (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-850">
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
            )}

            {activeTab === 'drills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-300">
                    Drills attached to this {slot.ageGroupId} Sunday session.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAttachDrillModal(true)}
                    className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach Drill
                  </button>
                </div>

                {attachedDrills.length === 0 ? (
                  <div className="text-center py-10 bg-neutral-950 rounded-2xl border border-neutral-800">
                    <p className="text-sm text-neutral-300">No drills attached yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowAttachDrillModal(true)}
                      className="mt-3 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-bold hover:underline"
                    >
                      Attach from Old Alex Drill Library
                    </button>
                  </div>
                ) : (
                  attachedDrills.map((drill) => (
                    <div
                      key={drill.id}
                      className="bg-neutral-950 rounded-2xl border border-neutral-800 p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono-data text-red-400 bg-black px-2 py-0.5 rounded border border-neutral-800 font-bold">
                              {drill.durationMinutes} Mins
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {drill.minPlayers}–{drill.maxPlayers} Players
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{drill.title}</h4>
                          <p className="text-xs text-neutral-300">{drill.skill}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDrill(drill.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Detach drill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tactical diagram for this drill */}
                      {drill.diagramElements && (
                        <div className="relative group/slotdiag">
                          <TacticalDiagram
                            elements={drill.diagramElements}
                            title={`${drill.title} Pitch Setup`}
                          />
                          <button
                            type="button"
                            onClick={() => setWhiteboardDrill(drill)}
                            className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                            title="Customize tactical diagram on whiteboard"
                          >
                            <Edit2 className="w-3 h-3 text-red-500" />
                            <span>Edit Diagram</span>
                          </button>
                        </div>
                      )}

                      {/* Coaching points */}
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                          Key Coaching Points
                        </h5>
                        <ul className="space-y-1">
                          {drill.coachingPoints.map((pt, pIdx) => (
                            <li
                              key={pIdx}
                              className="text-xs text-neutral-200 flex items-start gap-2"
                            >
                              <span className="text-red-500 font-bold">•</span>
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}

                {/* Attach Drill Modal */}
                {showAttachDrillModal && (
                  <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-black border border-neutral-800 rounded-2xl p-5 w-full max-w-md shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white">Attach Drill to Slot</h4>
                        <button
                          type="button"
                          onClick={() => setShowAttachDrillModal(false)}
                          className="text-neutral-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <select
                        value={selectedDrillToAttach}
                        onChange={(e) => setSelectedDrillToAttach(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-sm text-white mb-4 focus:outline-none focus:border-red-500"
                      >
                        <option value="">Select a drill...</option>
                        {allDrills
                          .filter((d) => !slot.attachedDrillIds.includes(d.id))
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title} ({d.pathway} · {d.durationMinutes}m)
                            </option>
                          ))}
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAttachDrillModal(false)}
                          className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAttachDrill}
                          disabled={!selectedDrillToAttach}
                          className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-colors"
                        >
                          Confirm Attach
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-4">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-red-500 rounded-xl transition-colors"
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
                      <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                        {slot.ageGroupId}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">{slot.sessionTitle}</h3>
                      <div className="flex items-center gap-4 text-xs text-neutral-300 mt-2 font-mono-data">
                        <span>TIMING: {slot.timeSlot}</span>
                        <span>·</span>
                        <span>LOCATION: {currentSector?.name}</span>
                        <span>·</span>
                        <span>DURATION: 75 MINS</span>
                      </div>
                    </div>

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
            )}

            {activeTab === 'reflection' && (
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
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
            <div>
              {onDeleteSlot && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-950/80 border border-red-700/80 rounded-xl px-3 py-1.5 animate-in fade-in duration-150">
                    <span className="text-xs text-red-200 font-bold">Delete this session permanently?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteSlot(slot.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-sm"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 rounded-xl flex items-center gap-1.5 transition-all"
                    title="Permanently remove this session slot from the timetable"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Session</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 hidden sm:inline">
                Offline auto-saved
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tactical Whiteboard Modal */}
      {whiteboardDrill && (
        <TacticalWhiteboard
          initialElements={whiteboardDrill.diagramElements || []}
          title={`Edit Pitch Setup: ${whiteboardDrill.title}`}
          onSave={(elements) => {
            if (onUpdateDrill && whiteboardDrill) {
              onUpdateDrill({ ...whiteboardDrill, diagramElements: elements });
            }
            setWhiteboardDrill(null);
          }}
          onClose={() => setWhiteboardDrill(null)}
        />
      )}
    </div>
  );
};

export default SlotSideDrawer;
