import React, { useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Share2,
  ExternalLink,
  Filter,
  Check,
  Zap,
  Calendar,
  X,
  Edit2,
  Trash2,
  Mail,
  Phone,
  UserPlus,
  Grid,
  List,
  CheckCircle2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Coach, CoachAvailability, CoachAvailabilityStatus, SessionSlot } from '../../types';
import { importGoogleFormResponses } from '../../utils/coachFormImporter';
import { ExportService } from '../../services/exportService';
import { AddEditCoachModal } from './AddEditCoachModal';

interface CoachAvailabilityViewProps {
  coaches: Coach[];
  availability: CoachAvailability[];
  slots: SessionSlot[];
  selectedDate: string;
  onUpdateAvailability: (updated: CoachAvailability[]) => void;
  onAutoAssignCoaches: (assignments: { slotId: string; coachId: string }[]) => void;
  onUpdateCoaches: (updatedCoaches: Coach[]) => void;
  onUpdateSlots?: (updatedSlots: SessionSlot[]) => void;
}

export const CoachAvailabilityView: React.FC<CoachAvailabilityViewProps> = ({
  coaches,
  availability,
  slots,
  selectedDate,
  onUpdateAvailability,
  onAutoAssignCoaches,
  onUpdateCoaches,
  onUpdateSlots,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CoachAvailabilityStatus | 'ALL'>('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawFormInput, setRawFormInput] = useState('');
  const [showDirectFormModal, setShowDirectFormModal] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState(coaches[0]?.id || '');
  const [selfStatus, setSelfStatus] = useState<CoachAvailabilityStatus>('AVAILABLE');
  const [selfNotes, setSelfNotes] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Coach Profile CRUD state
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [coachToEdit, setCoachToEdit] = useState<Coach | null>(null);
  const [viewMode, setViewMode] = useState<'availability' | 'directory'>('availability');

  // Multi-tick box selection & mass deletion state
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);

  // Filter coaches and match with availability records
  const availabilityMap = new Map<string, CoachAvailability>();
  for (const av of availability) {
    if (av.date === selectedDate) {
      availabilityMap.set(av.coachId, av);
    }
  }

  const coachListWithStatus = coaches.map((coach) => {
    const record = availabilityMap.get(coach.id);
    const assignedSlots = slots.filter((s) => s.assignedCoachIds.includes(coach.id));

    return {
      coach,
      status: record?.status || ('AVAILABLE' as CoachAvailabilityStatus),
      notes: record?.notes || '',
      source: record?.source || 'direct',
      submittedAt: record?.submittedAt,
      assignedSlots,
    };
  });

  const filteredCoaches = coachListWithStatus.filter(({ coach, status }) => {
    if (filterStatus !== 'ALL' && status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return coach.name.toLowerCase().includes(q) || coach.role.toLowerCase().includes(q);
    }
    return true;
  });

  // Metrics
  const totalRoster = coaches.length;
  const countAvailable = coachListWithStatus.filter((c) => c.status === 'AVAILABLE').length;
  const countSeniorMatch = coachListWithStatus.filter((c) => c.status === 'SENIOR_MATCH').length;
  const countMorningOnly = coachListWithStatus.filter((c) => c.status === 'MORNING_ONLY').length;
  const countAway = coachListWithStatus.filter((c) => c.status === 'AWAY').length;

  // Unstaffed slots
  const unstaffedSlots = slots.filter((s) => s.assignedCoachIds.length < 2);

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFormInput.trim()) return;

    const merged = importGoogleFormResponses(rawFormInput, selectedDate, availability, coaches);
    onUpdateAvailability(merged);
    setShowImportModal(false);
    setRawFormInput('');
    setImportSuccessMsg('Successfully parsed and synced Google Form availability responses!');
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  const handleSelfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coach = coaches.find((c) => c.id === selectedCoachId);
    if (!coach) return;

    const record: CoachAvailability = {
      id: `av-${Date.now()}`,
      coachId: coach.id,
      coachName: coach.name,
      date: selectedDate,
      status: selfStatus,
      notes: selfNotes || undefined,
      source: 'direct',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const next = [...availability.filter((a) => !(a.coachId === coach.id && a.date === selectedDate)), record];
    onUpdateAvailability(next);
    setShowDirectFormModal(false);
    setSelfNotes('');
  };

  const handleQuickStatusChange = (coachId: string, newStatus: CoachAvailabilityStatus) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;

    const record: CoachAvailability = {
      id: `av-${Date.now()}`,
      coachId: coach.id,
      coachName: coach.name,
      date: selectedDate,
      status: newStatus,
      source: 'direct',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const next = [...availability.filter((a) => !(a.coachId === coach.id && a.date === selectedDate)), record];
    onUpdateAvailability(next);
  };

  const handleAutoAssign = () => {
    // Find available coaches who aren't currently assigned
    const assignedIds = new Set(slots.flatMap((s) => s.assignedCoachIds));
    const freeAvailableCoaches = coachListWithStatus.filter(
      (c) => (c.status === 'AVAILABLE' || c.status === 'MORNING_ONLY') && !assignedIds.has(c.coach.id)
    );

    const assignments: { slotId: string; coachId: string }[] = [];
    let coachIdx = 0;

    for (const slot of unstaffedSlots) {
      if (coachIdx < freeAvailableCoaches.length) {
        assignments.push({
          slotId: slot.id,
          coachId: freeAvailableCoaches[coachIdx].coach.id,
        });
        coachIdx++;
      }
    }

    if (assignments.length > 0) {
      onAutoAssignCoaches(assignments);
      setImportSuccessMsg(`Assigned ${assignments.length} available coaches to unstaffed Sunday slots!`);
      setTimeout(() => setImportSuccessMsg(null), 4000);
    }
  };

  // Coach Profile CRUD Handlers
  const handleSaveCoach = (saved: Coach) => {
    const exists = coaches.some((c) => c.id === saved.id);
    let nextCoaches: Coach[];
    if (exists) {
      nextCoaches = coaches.map((c) => (c.id === saved.id ? saved : c));
      setImportSuccessMsg(`Updated profile for ${saved.name}`);
    } else {
      nextCoaches = [saved, ...coaches];
      setImportSuccessMsg(`Added new coach to Old Alex roster: ${saved.name}`);
    }
    onUpdateCoaches(nextCoaches);
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  const handleDeleteCoach = (coachId: string) => {
    const coachToDelete = coaches.find((c) => c.id === coachId);
    const nextCoaches = coaches.filter((c) => c.id !== coachId);
    onUpdateCoaches(nextCoaches);

    // Also remove availability record
    const nextAv = availability.filter((a) => a.coachId !== coachId);
    onUpdateAvailability(nextAv);

    // Also unassign from any scheduled slots
    const nextSlots = slots.map((s) => {
      const remainingCoachIds = s.assignedCoachIds.filter((id) => id !== coachId);
      if (remainingCoachIds.length !== s.assignedCoachIds.length) {
        return {
          ...s,
          assignedCoachIds: remainingCoachIds,
          status: remainingCoachIds.length === 0 ? ('Needs Coach' as const) : s.status,
        };
      }
      return s;
    });
    if (onUpdateSlots) {
      onUpdateSlots(nextSlots);
    }

    // Clean up selection
    setSelectedCoachIds((prev) => prev.filter((id) => id !== coachId));

    setImportSuccessMsg(`Removed ${coachToDelete?.name || 'coach'} from roster.`);
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  // Multi-selection helper handlers
  const handleToggleSelectCoach = (coachId: string) => {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId]
    );
  };

  const isAllFilteredSelected =
    filteredCoaches.length > 0 &&
    filteredCoaches.every(({ coach }) => selectedCoachIds.includes(coach.id));

  const isSomeFilteredSelected =
    filteredCoaches.some(({ coach }) => selectedCoachIds.includes(coach.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect currently filtered coaches
      const filteredIds = new Set(filteredCoaches.map(({ coach }) => coach.id));
      setSelectedCoachIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all currently filtered coaches
      const filteredIds = filteredCoaches.map(({ coach }) => coach.id);
      setSelectedCoachIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedCoachIds([]);
  };

  const handleBulkStatusChange = (newStatus: CoachAvailabilityStatus) => {
    if (selectedCoachIds.length === 0) return;
    let nextAv = [...availability];
    for (const coachId of selectedCoachIds) {
      const idx = nextAv.findIndex((a) => a.coachId === coachId && a.date === selectedDate);
      if (idx >= 0) {
        nextAv[idx] = {
          ...nextAv[idx],
          status: newStatus,
          submittedAt: new Date().toISOString(),
        };
      } else {
        const coach = coaches.find((c) => c.id === coachId);
        nextAv.push({
          id: `av-${Date.now()}-${coachId}`,
          coachId,
          coachName: coach?.name || 'Coach',
          date: selectedDate,
          status: newStatus,
          notes: 'Updated via bulk selection',
          source: 'direct',
          submittedAt: new Date().toISOString(),
        });
      }
    }
    onUpdateAvailability(nextAv);
    setImportSuccessMsg(`Updated Sunday status to "${newStatus}" for ${selectedCoachIds.length} coaches.`);
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  const handleConfirmMassDelete = () => {
    const count = selectedCoachIds.length;
    if (count === 0) return;

    // 1. Remove selected coaches from roster
    const nextCoaches = coaches.filter((c) => !selectedCoachIds.includes(c.id));
    onUpdateCoaches(nextCoaches);

    // 2. Remove availability records
    const nextAv = availability.filter((a) => !selectedCoachIds.includes(a.coachId));
    onUpdateAvailability(nextAv);

    // 3. Clean up slots (unassign deleted coaches from any slots)
    const nextSlots = slots.map((s) => {
      const remainingCoachIds = s.assignedCoachIds.filter((id) => !selectedCoachIds.includes(id));
      if (remainingCoachIds.length !== s.assignedCoachIds.length) {
        return {
          ...s,
          assignedCoachIds: remainingCoachIds,
          status: remainingCoachIds.length === 0 ? ('Needs Coach' as const) : s.status,
        };
      }
      return s;
    });
    if (onUpdateSlots) {
      onUpdateSlots(nextSlots);
    }

    // 4. Reset selection and close modal
    setSelectedCoachIds([]);
    setShowMassDeleteModal(false);
    setImportSuccessMsg(`Successfully deleted ${count} coaches and unassigned them from sessions.`);
    setTimeout(() => setImportSuccessMsg(null), 5000);
  };

  const sampleGoogleFormPaste = `Timestamp,Name,Availability,Notes
2026/09/11 08:30:15,Jessica Walsh,Available,Can lead Foundation and 5th Class
2026/09/11 09:12:44,Meghan Moran,Available,Available for 12 o'clock float
2026/09/11 11:45:10,Ben McInerney,Available,Pitch 1 & 2 morning lead
2026/09/11 12:00:22,Katie Mullan,Available,Leading Inters C & D and Minor B
2026/09/11 13:10:05,Josh Gill,Available,1st Years & Inters
2026/09/11 14:02:19,Grace MacAllister,Available,Lead 3D skills on 1st Class
2026/09/11 15:20:30,Bo Hartley,Available,Assisting 1st Class
2026/09/11 16:55:00,Niamh O'Neill,Available,Umpiring Minor A and 12 o'clock float
2026/09/11 18:04:12,Conor Ryan,Available,Minor A & B coaching and umpiring
2026/09/11 19:40:55,Hannah Fox,Available,6th Class, 5th Class & 4th Class coverage`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-500 font-bold uppercase">
              Staffing & Coaching Profiles
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">{totalRoster} Coaches Registered</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Users className="w-6 h-6 text-red-500" />
            <span>Coach Profiles & Availability Hub</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Manage the Old Alex coaching roster (add, edit, delete profiles) and coordinate Sunday pitch coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setCoachToEdit(null);
              setShowCoachModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="Create a new coach profile with contact info and role"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Coach Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const text = ExportService.generateAvailabilityCalloutWhatsApp(selectedDate, coaches.length);
              navigator.clipboard.writeText(text);
              setImportSuccessMsg('Copied Coach Availability WhatsApp Callout to clipboard!');
              setTimeout(() => setImportSuccessMsg(null), 4000);
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Copy WhatsApp reminder message to blast to coaching team"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Callout</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white hover:border-red-500 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Sync Google Form</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDirectFormModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-750 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span>Log Sunday Status</span>
          </button>
        </div>
      </div>

      {/* Success banner if imported */}
      {importSuccessMsg && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {/* Availability Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-black border border-neutral-800 p-4 rounded-xl">
          <span className="text-xs text-neutral-400 font-semibold">Total Coaches</span>
          <div className="text-2xl font-bold text-white font-mono-data mt-1">{totalRoster}</div>
          <span className="text-[10px] text-neutral-400">Old Alex Roster</span>
        </div>

        <div className="bg-black border border-neutral-800 p-4 rounded-xl">
          <span className="text-xs text-emerald-400 font-semibold">Available</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono-data mt-1">
            {countAvailable}
          </div>
          <span className="text-[10px] text-neutral-400">Ready for pitch slots</span>
        </div>

        <div className="bg-black border border-neutral-800 p-4 rounded-xl">
          <span className="text-xs text-red-400 font-semibold">Senior Match Duty</span>
          <div className="text-2xl font-bold text-red-400 font-mono-data mt-1">
            {countSeniorMatch}
          </div>
          <span className="text-[10px] text-neutral-400">EYHL / Leinster League</span>
        </div>

        <div className="bg-black border border-neutral-800 p-4 rounded-xl">
          <span className="text-xs text-white font-semibold">Morning Only</span>
          <div className="text-2xl font-bold text-white font-mono-data mt-1">
            {countMorningOnly}
          </div>
          <span className="text-[10px] text-neutral-400">10:45 slot only</span>
        </div>

        <div className="bg-black border border-neutral-800 p-4 rounded-xl">
          <span className="text-xs text-neutral-400 font-semibold">Away / Unavail</span>
          <div className="text-2xl font-bold text-neutral-400 font-mono-data mt-1">{countAway}</div>
          <span className="text-[10px] text-neutral-400">Study / Work / Travel</span>
        </div>
      </div>

      {/* Auto-fill banner if there are unstaffed slots */}
      {unstaffedSlots.length > 0 && (
        <div className="p-4 bg-black border border-red-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">
                {unstaffedSlots.length} Slots currently need additional coaches
              </h4>
              <p className="text-[11px] text-neutral-300">
                You have {countAvailable} coaches marked Available in your Google Form responses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoAssign}
            className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Staff from Available Pool</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search coaches by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800 overflow-x-auto">
          {(['ALL', 'AVAILABLE', 'SENIOR_MATCH', 'MORNING_ONLY', 'AWAY'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st === 'ALL'
                ? `All (${totalRoster})`
                : st === 'AVAILABLE'
                ? 'Available'
                : st === 'SENIOR_MATCH'
                ? 'Senior Match'
                : st === 'MORNING_ONLY'
                ? 'Morning Only'
                : 'Away'}
            </button>
          ))}
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setViewMode('availability')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'availability'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Sunday Availability Table</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('directory')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'directory'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Coach Profiles & Directory ({filteredCoaches.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setCoachToEdit(null);
            setShowCoachModal(true);
          }}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-red-500 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-red-500" />
          <span>+ Add Coach</span>
        </button>
      </div>

      {/* Bulk Selection Actions Bar */}
      {selectedCoachIds.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/60 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-red-950/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
              {selectedCoachIds.length}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{selectedCoachIds.length} coach{selectedCoachIds.length > 1 ? 'es' : ''} selected</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  (out of {filteredCoaches.length} visible)
                </span>
              </div>
              <div className="text-[11px] text-red-300">
                Multi-selection active for roster updates or mass deletion
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-750 transition-colors"
            >
              {isAllFilteredSelected ? 'Deselect All' : `Select All (${filteredCoaches.length})`}
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-750 transition-colors"
            >
              Clear
            </button>

            {/* Quick bulk status change */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <span className="text-[11px] text-neutral-400 hidden sm:inline">Set Status:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as CoachAvailabilityStatus);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-neutral-900 border border-neutral-750 text-white text-xs rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-red-500"
              >
                <option value="" disabled>Bulk Set Status...</option>
                <option value="AVAILABLE">Available</option>
                <option value="SENIOR_MATCH">Senior Match</option>
                <option value="MORNING_ONLY">Morning Only</option>
                <option value="AWAY">Away</option>
              </select>
            </div>

            {/* Mass Deletion Button */}
            <button
              type="button"
              onClick={() => setShowMassDeleteModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95 ml-auto md:ml-0"
              title="Delete all selected coaches"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedCoachIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode A: Sunday Availability Table */}
      {viewMode === 'availability' ? (
        <div className="bg-black border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono-data border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeFilteredSelected && !isAllFilteredSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      title={isAllFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                    />
                  </th>
                  <th className="py-3 px-4">Coach Name</th>
                  <th className="py-3 px-4">Club Role</th>
                  <th className="py-3 px-4">Sunday Availability</th>
                  <th className="py-3 px-4">Assigned Slot(s)</th>
                  <th className="py-3 px-4">Form Notes</th>
                  <th className="py-3 px-4 text-right">Quick Change & Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono-data">
                {filteredCoaches.map(({ coach, status, notes, assignedSlots }) => {
                  const isSelected = selectedCoachIds.includes(coach.id);
                  return (
                    <tr
                      key={coach.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-red-950/25 border-l-2 border-red-500 hover:bg-red-950/35'
                          : 'hover:bg-neutral-900/50'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectCoach(coach.id)}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                          title={isSelected ? `Deselect ${coach.name}` : `Select ${coach.name}`}
                        />
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: coach.accentColor }}
                        />
                        <span>{coach.name}</span>
                        {coach.isActive === false && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase font-mono-data">
                            Inactive
                          </span>
                        )}
                      </td>
                    <td className="py-3 px-4 font-sans text-neutral-300">{coach.role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          status === 'AVAILABLE'
                            ? 'bg-neutral-950 text-emerald-300 border border-emerald-800/80'
                            : status === 'SENIOR_MATCH'
                            ? 'bg-red-600/20 text-red-300 border border-red-500/50'
                            : status === 'MORNING_ONLY'
                            ? 'bg-neutral-800 text-white border border-neutral-700'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {status === 'AVAILABLE'
                          ? 'Available'
                          : status === 'SENIOR_MATCH'
                          ? 'Senior Match'
                          : status === 'MORNING_ONLY'
                          ? 'Morning Only'
                          : 'Away'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {assignedSlots.length === 0 ? (
                        <span className="text-neutral-500 italic">None</span>
                      ) : (
                        assignedSlots.map((s) => (
                          <span
                            key={s.id}
                            className="mr-1 text-[11px] font-bold text-white bg-red-600/20 px-1.5 py-0.5 rounded border border-red-500/40"
                          >
                            {s.ageGroupId} ({s.timeSlot})
                          </span>
                        ))
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-neutral-300 text-[11px] max-w-xs truncate">
                      {notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={status}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              coach.id,
                              e.target.value as CoachAvailabilityStatus
                            )
                          }
                          className="bg-neutral-900 border border-neutral-750 text-white text-xs rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-red-500"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="SENIOR_MATCH">Senior Match</option>
                          <option value="MORNING_ONLY">Morning Only</option>
                          <option value="AWAY">Away</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setCoachToEdit(coach);
                            setShowCoachModal(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                          title={`Edit profile for ${coach.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-red-500" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${coach.name} from the Old Alex coach roster?`)) {
                              handleDeleteCoach(coach.id);
                            }
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                          title={`Delete ${coach.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mode B: Coach Profiles & Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches.map(({ coach, status, notes, assignedSlots }) => {
            const isSelected = selectedCoachIds.includes(coach.id);
            return (
            <div
              key={coach.id}
              className={`border rounded-2xl p-4 space-y-3 transition-all shadow-sm flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-950 border-red-500 ring-1 ring-red-500/60 shadow-red-950/40'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectCoach(coach.id)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 shrink-0"
                      title={isSelected ? `Deselect ${coach.name}` : `Select ${coach.name}`}
                    />
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0"
                      style={{ backgroundColor: coach.accentColor }}
                    >
                      {coach.initials || coach.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm leading-tight truncate">
                        {coach.name}
                      </h4>
                      <p className="text-[11px] text-neutral-300 mt-0.5 truncate">{coach.role}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      coach.isActive !== false
                        ? 'bg-neutral-900 text-emerald-300 border border-emerald-800/60'
                        : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {coach.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-200 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <a
                      href={`https://wa.me/${coach.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-400 truncate font-mono-data"
                      title="Open WhatsApp chat"
                    >
                      {coach.phone || 'No phone recorded'}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate text-neutral-400">
                      {coach.email || 'No email recorded'}
                    </span>
                  </div>
                </div>

                {notes && (
                  <p className="text-[11px] text-neutral-300 italic bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    "{notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-300">
                  Sunday: <strong className="text-white">{status}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCoachToEdit(coach);
                      setShowCoachModal(true);
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold flex items-center gap-1 transition-colors border border-neutral-750"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${coach.name} from the Old Alex coach roster?`)) {
                        handleDeleteCoach(coach.id);
                      }
                    }}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                    title={`Delete ${coach.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Add / Edit / Delete Coach Modal */}
      <AddEditCoachModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        coachToEdit={coachToEdit}
        onSaveCoach={handleSaveCoach}
        onDeleteCoach={handleDeleteCoach}
      />

      {/* Mass Deletion Confirmation Modal */}
      {showMassDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mass Deletion</h3>
                  <p className="text-xs text-neutral-400">
                    Delete {selectedCoachIds.length} selected coach profiles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMassDeleteModal(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-red-950/30 border border-red-800/50 rounded-2xl text-xs text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block text-white mb-0.5 font-semibold">
                    Warning: Irreversible deletion
                  </strong>
                  You are about to remove <strong>{selectedCoachIds.length} coaches</strong> from the Old Alex Coaching roster.
                  They will be unassigned from any Sunday timetable slots and their availability records will be purged.
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono-data text-neutral-400 font-semibold uppercase tracking-wider block mb-2">
                  Selected Coaches to Remove:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-black border border-neutral-800 rounded-xl">
                  {selectedCoachIds.map((id) => {
                    const coach = coaches.find((c) => c.id === id);
                    if (!coach) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-neutral-900/70 rounded-lg border border-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: coach.accentColor }}
                          />
                          <span className="font-semibold text-white">{coach.name}</span>
                          <span className="text-neutral-400 text-[11px]">({coach.role})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSelectCoach(id)}
                          className="text-[11px] text-neutral-400 hover:text-red-400 p-0.5"
                          title="Remove from selection"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-neutral-800 bg-black flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowMassDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-750 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMassDelete}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Mass Deletion ({selectedCoachIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Google Form / Sheet Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleImportSubmit}
            className="bg-black border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Import from Google Form Responses</h3>
                <p className="text-xs text-neutral-300">
                  Copy and paste the responses columns from your Google Sheet or Form CSV.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1.5 text-xs text-white">
              <strong className="text-white block font-semibold">How to sync your Google Form in 10 seconds:</strong>
              <p className="text-[11px] text-neutral-300">
                1. In your Google Form, click <em>Responses → View in Sheets</em>.
                <br />
                2. Highlight the rows (Timestamp, Coach Name, Availability, Notes) and press <kbd className="px-1 bg-black rounded font-mono border border-neutral-700">Ctrl+C</kbd> (or <kbd className="px-1 bg-black rounded font-mono border border-neutral-700">Cmd+C</kbd>).
                <br />
                3. Paste into the box below and click <strong>Process & Sync</strong>. Names are automatically linked to your 42 registered coaches!
              </p>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 font-mono-data text-[11px]">Columns: Timestamp | Coach Name | Availability | Notes</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const template = `Recommended Google Form Setup for Old Alex Coaches:
1. Question 1 (Short Answer): "Coach Full Name"
2. Question 2 (Multiple Choice): "Sunday Availability"
   - Available for any pitch slot (10:45 – 15:45)
   - Morning Only (10:45 – 12:30)
   - Afternoon Only (13:15 – 15:45)
   - Senior Match Duty (EYHL / Leinster League)
   - Away / Unavailable
3. Question 3 (Multiple Choice / Dropdown): "Preferred Age Group" (PEN, 1st–6th Class, 1st Years, Minors, Inters)
4. Question 4 (Paragraph): "Notes / Transport / Constraints"`;
                    navigator.clipboard.writeText(template);
                    alert('Copied recommended Google Form questions template to clipboard!');
                  }}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  Copy Google Form Structure
                </button>
                <button
                  type="button"
                  onClick={() => setRawFormInput(sampleGoogleFormPaste)}
                  className="text-red-400 hover:underline font-semibold"
                >
                  Load Sample Form Data
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              required
              value={rawFormInput}
              onChange={(e) => setRawFormInput(e.target.value)}
              placeholder="Paste rows directly from Google Sheet (e.g. Timestamp, Coach Name, Available / Senior Match / Away, Notes)..."
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-3 text-xs font-mono-data text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400">
                Matches against Old Alex 42-coach roster automatically
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
                >
                  Process & Sync Availability
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Direct Single Coach Submit Modal */}
      {showDirectFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSelfSubmit}
            className="bg-black border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Record Coach Sunday Availability</h3>
              <button
                type="button"
                onClick={() => setShowDirectFormModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Select Coach</label>
              <select
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
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
                value={selfStatus}
                onChange={(e) => setSelfStatus(e.target.value as CoachAvailabilityStatus)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="AVAILABLE">Available for any Sunday slot</option>
                <option value="SENIOR_MATCH">Senior Match Duty (EYHL / League)</option>
                <option value="MORNING_ONLY">Morning Only (10:45 slot only)</option>
                <option value="AWAY">Away / Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Notes / Times</label>
              <input
                type="text"
                value={selfNotes}
                onChange={(e) => setSelfNotes(e.target.value)}
                placeholder="E.g. Senior away match at Loreto at 14:00"
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDirectFormModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
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
      )}
    </div>
  );
};
