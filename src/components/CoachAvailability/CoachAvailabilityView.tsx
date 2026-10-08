import React, { useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  Search,
  Plus,
  Share2,
  Check,
  Zap,
  Trash2,
  UserPlus,
  Grid,
  List,
  Sparkles,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Coach, CoachAvailability, CoachAvailabilityStatus, SessionSlot } from '../../types';
import { ExportService } from '../../services/exportService';
import { COACHES } from '../../data/initialData';
import { syncWithMasterRoster } from '../../store/persistence/migration';
import { isValidCoachPersonName } from '../../utils/scheduleImportParser';
import { AddEditCoachModal } from './AddEditCoachModal';
import {
  CoachMetricsBar,
  CoachAvailabilityTable,
  CoachDirectoryGrid,
  GoogleFormImportModal,
  DirectAvailabilityModal,
  CoachMassDeleteModal,
  CoachAvailabilityItem,
} from './components';

export interface CoachAvailabilityViewProps {
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
  const [showDirectFormModal, setShowDirectFormModal] = useState(false);
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

  const coachListWithStatus: CoachAvailabilityItem[] = coaches.map((coach) => {
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

  const assignedCoachIdsSet = new Set(slots.flatMap((s) => s.assignedCoachIds));
  const countAssigned = coachListWithStatus.filter((c) => assignedCoachIdsSet.has(c.coach.id)).length;
  const countUnassigned = coachListWithStatus.filter(
    (c) => (c.status === 'AVAILABLE' || c.status === 'MORNING_ONLY') && !assignedCoachIdsSet.has(c.coach.id)
  ).length;

  // Unstaffed slots
  const unstaffedSlots = slots.filter((s) => s.assignedCoachIds.length < 2);

  const showNotification = (msg: string, duration = 4000) => {
    setImportSuccessMsg(msg);
    setTimeout(() => setImportSuccessMsg(null), duration);
  };

  const handleQuickStatusChange = (coachId: string, newStatus: CoachAvailabilityStatus) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;

    const record: CoachAvailability = {
      id: `av-${Date.now()}-${coachId}`,
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

  const handleUpdateNotes = (coachId: string, notes: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;

    const existing = availability.find((a) => a.coachId === coachId && a.date === selectedDate);
    const record: CoachAvailability = {
      id: existing?.id || `av-${Date.now()}-${coachId}`,
      coachId: coach.id,
      coachName: coach.name,
      date: selectedDate,
      status: existing?.status || 'AVAILABLE',
      notes,
      source: existing?.source || 'direct',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const next = [...availability.filter((a) => !(a.coachId === coach.id && a.date === selectedDate)), record];
    onUpdateAvailability(next);
  };

  const handleDirectSubmit = (coachId: string, status: CoachAvailabilityStatus, notes: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;

    const record: CoachAvailability = {
      id: `av-${Date.now()}-${coachId}`,
      coachId: coach.id,
      coachName: coach.name,
      date: selectedDate,
      status,
      notes: notes || undefined,
      source: 'direct',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const next = [...availability.filter((a) => !(a.coachId === coach.id && a.date === selectedDate)), record];
    onUpdateAvailability(next);
    showNotification(`Recorded availability for ${coach.name}`);
  };

  const handleAutoAssign = () => {
    const freeAvailableCoaches = coachListWithStatus.filter(
      (c) => (c.status === 'AVAILABLE' || c.status === 'MORNING_ONLY') && !assignedCoachIdsSet.has(c.coach.id)
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
      showNotification(`Assigned ${assignments.length} available coaches to unstaffed Sunday slots!`);
    }
  };

  // Coach Profile CRUD Handlers
  const handleSaveCoach = (saved: Coach) => {
    const exists = coaches.some((c) => c.id === saved.id);
    let nextCoaches: Coach[];
    if (exists) {
      nextCoaches = coaches.map((c) => (c.id === saved.id ? saved : c));
      showNotification(`Updated profile for ${saved.name}`);
    } else {
      nextCoaches = [saved, ...coaches];
      showNotification(`Added new coach to Old Alex roster: ${saved.name}`);
    }
    onUpdateCoaches(nextCoaches);
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
    showNotification(`Removed ${coachToDelete?.name || 'coach'} from roster.`);
  };

  // One-Click Roster Sanitization Handlers
  const handleCleanInvalidCoaches = () => {
    // Known non-person test or failed isValidCoachPersonName
    const invalidCoachIds = new Set(
      coaches
        .filter((c) => !isValidCoachPersonName(c.name))
        .map((c) => c.id)
    );

    const corruptCount = invalidCoachIds.size;
    if (corruptCount === 0) {
      showNotification('Roster is already clean! No invalid coach profiles detected.');
      return;
    }

    // 1. Filter out invalid coach profiles
    const cleanedCoaches = coaches.filter((c) => !invalidCoachIds.has(c.id));
    onUpdateCoaches(cleanedCoaches);

    // 2. Remove from availability
    const cleanedAv = availability.filter((a) => !invalidCoachIds.has(a.coachId));
    onUpdateAvailability(cleanedAv);

    // 3. Remove from all SessionSlot.assignedCoachIds across all dates
    const cleanedSlots = slots.map((s) => {
      const remainingCoachIds = s.assignedCoachIds.filter((id) => !invalidCoachIds.has(id));
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
      onUpdateSlots(cleanedSlots);
    }

    // Clean up local selection
    setSelectedCoachIds((prev) => prev.filter((id) => !invalidCoachIds.has(id)));

    // Display required notification toast
    showNotification(`Removed ${corruptCount} corrupt coach profiles and updated session slots!`, 5000);
  };

  const handleSyncMasterRoster = () => {
    const merged = syncWithMasterRoster(coaches, COACHES);
    const addedCount = merged.length - coaches.length;

    if (addedCount > 0) {
      onUpdateCoaches(merged);
      showNotification(`Master roster synchronized! Added ${addedCount} new coaches (Total: ${merged.length}).`, 5000);
    } else {
      showNotification(`Master roster is already up to date (${coaches.length} coaches).`, 4000);
    }
  };

  const handleResetToOfficialRoster = () => {
    const officialIds = new Set(COACHES.map((c) => c.id));
    const removedCoachIds = new Set(
      coaches.filter((c) => !officialIds.has(c.id)).map((c) => c.id)
    );

    onUpdateCoaches(COACHES);

    // Clean up availability records for removed non-official coaches
    if (removedCoachIds.size > 0) {
      const cleanedAv = availability.filter((a) => !removedCoachIds.has(a.coachId));
      onUpdateAvailability(cleanedAv);

      const cleanedSlots = slots.map((s) => {
        const remainingCoachIds = s.assignedCoachIds.filter((id) => !removedCoachIds.has(id));
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
        onUpdateSlots(cleanedSlots);
      }
    }

    setSelectedCoachIds([]);
    showNotification(`Reset coaching roster to Official ${COACHES.length} profiles!`, 5000);
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
      const filteredIds = new Set(filteredCoaches.map(({ coach }) => coach.id));
      setSelectedCoachIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
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
    showNotification(`Updated Sunday status to "${newStatus}" for ${selectedCoachIds.length} coaches.`);
  };

  const handleConfirmMassDelete = () => {
    const count = selectedCoachIds.length;
    if (count === 0) return;

    const nextCoaches = coaches.filter((c) => !selectedCoachIds.includes(c.id));
    onUpdateCoaches(nextCoaches);

    const nextAv = availability.filter((a) => !selectedCoachIds.includes(a.coachId));
    onUpdateAvailability(nextAv);

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

    setSelectedCoachIds([]);
    setShowMassDeleteModal(false);
    showNotification(`Successfully deleted ${count} coaches and unassigned them from sessions.`, 5000);
  };

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
              showNotification('Copied Coach Availability WhatsApp Callout to clipboard!');
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Copy WhatsApp reminder message to blast to coaching team"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Callout</span>
          </button>

          <button
            type="button"
            onClick={handleCleanInvalidCoaches}
            className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="Clean corrupt/invalid coach profiles (e.g. venues, times, match notes) from roster and slots"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Clean Invalid Coach Profiles</span>
          </button>

          <button
            type="button"
            onClick={handleSyncMasterRoster}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="Non-destructively sync master club coach roster to import newly registered coaches"
          >
            <RefreshCw className="w-4 h-4 text-emerald-100" />
            <span>Sync Master Roster</span>
          </button>

          <button
            type="button"
            onClick={handleResetToOfficialRoster}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title={`Reset roster back to the official ${COACHES.length} Old Alex coaches`}
          >
            <RotateCcw className="w-4 h-4 text-neutral-400" />
            <span>Reset to Official {COACHES.length} Roster</span>
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

      {/* Success banner if imported or updated */}
      {importSuccessMsg && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {/* Availability Metrics Bar */}
      <CoachMetricsBar
        totalRoster={totalRoster}
        countAvailable={countAvailable}
        countAssigned={countAssigned}
        countUnassigned={countUnassigned}
        countSeniorMatch={countSeniorMatch}
        countMorningOnly={countMorningOnly}
        countAway={countAway}
      />

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

      {/* Main View Mode Content */}
      {viewMode === 'availability' ? (
        <CoachAvailabilityTable
          coachesWithStatus={filteredCoaches}
          selectedCoachIds={selectedCoachIds}
          isAllSelected={isAllFilteredSelected}
          isSomeSelected={isSomeFilteredSelected}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectCoach={handleToggleSelectCoach}
          onQuickStatusChange={handleQuickStatusChange}
          onUpdateNotes={handleUpdateNotes}
          onEditCoach={(coach) => {
            setCoachToEdit(coach);
            setShowCoachModal(true);
          }}
          onDeleteCoach={handleDeleteCoach}
        />
      ) : (
        <CoachDirectoryGrid
          coachesWithStatus={filteredCoaches}
          selectedCoachIds={selectedCoachIds}
          onToggleSelectCoach={handleToggleSelectCoach}
          onEditCoach={(coach) => {
            setCoachToEdit(coach);
            setShowCoachModal(true);
          }}
          onDeleteCoach={handleDeleteCoach}
        />
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
      <CoachMassDeleteModal
        isOpen={showMassDeleteModal}
        onClose={() => setShowMassDeleteModal(false)}
        selectedCoachIds={selectedCoachIds}
        coaches={coaches}
        onToggleSelectCoach={handleToggleSelectCoach}
        onConfirmMassDelete={handleConfirmMassDelete}
      />

      {/* Import from Google Form / Sheet Modal */}
      <GoogleFormImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedDate={selectedDate}
        coaches={coaches}
        availability={availability}
        onImportSuccess={(imported) => {
          onUpdateAvailability(imported);
          showNotification('Successfully parsed and synced Google Form availability responses!');
        }}
      />

      {/* Direct Single Coach Submit Modal */}
      <DirectAvailabilityModal
        isOpen={showDirectFormModal}
        onClose={() => setShowDirectFormModal(false)}
        coaches={coaches}
        selectedDate={selectedDate}
        onSubmit={handleDirectSubmit}
      />
    </div>
  );
};
