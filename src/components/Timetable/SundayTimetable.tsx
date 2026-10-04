import React, { useState } from 'react';
import { Calendar, ShieldAlert, Sparkles, Copy, Plus } from 'lucide-react';
import {
  Coach,
  CoachAvailability,
  Drill,
  MatchFixture,
  Pathway,
  PitchSector,
  ScheduleConflict,
  SessionSlot,
} from '../../types';
import { SundayMasterTemplatesModal } from './SundayMasterTemplatesModal';
import { BulkTimingsEditorModal } from './BulkTimingsEditorModal';
import { SundayMorningQuickActions } from './SundayMorningQuickActions';
import {
  TimetableFilterBar,
  AwayFixturesSection,
  TimetableMatrixGrid,
  TimetableTimelineView,
} from './components';
import { useAppStore } from '../../store';
import { isAwaySession, normalizeAwaySlot } from '../../utils/awayFixtureUtils';

export interface SundayTimetableProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  conflicts: ScheduleConflict[];
  selectedDate: string;
  drills?: Drill[];
  availability?: CoachAvailability[];
  fixtures?: MatchFixture[];
  onSelectSlot: (slot: SessionSlot) => void;
  onUpdateSlotCoach: (slotId: string, coachId: string) => void;
  onQuickAssignCoach: (slotId: string, coachId: string) => void;
  onCopyWhatsApp: () => void;
  copiedWhatsApp: boolean;
  onAddCustomSlot: (prefill?: { timeSlot?: string; pitchSectorId?: string }) => void;
  onApplyTemplate?: (newSlots: SessionSlot[]) => void;
  onOpenCalendarManager?: () => void;
  onUpdateAllSlots?: (slots: SessionSlot[]) => void;
  onOpenImportModal?: () => void;
  showToast?: (msg: string) => void;
}

export const SundayTimetable: React.FC<SundayTimetableProps> = ({
  slots,
  coaches,
  sectors,
  conflicts,
  selectedDate,
  drills,
  availability,
  onSelectSlot,
  onUpdateSlotCoach,
  onCopyWhatsApp,
  copiedWhatsApp,
  onAddCustomSlot,
  onApplyTemplate,
  onOpenCalendarManager,
  onUpdateAllSlots,
  onOpenImportModal,
  showToast = () => {},
}) => {
  const [selectedPathway, setSelectedPathway] = useState<Pathway | 'ALL'>('ALL');
  const [selectedPitch, setSelectedPitch] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'timeline'>('matrix');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showBulkTimingsModal, setShowBulkTimingsModal] = useState(false);
  const [showQuickActionsBar, setShowQuickActionsBar] = useState(false);

  // Filter slots strictly for the current selected date and normalize away fixtures
  const rawSlotsForDate = slots.filter((slot) => slot.date === selectedDate);
  const slotsForDate = rawSlotsForDate.map(normalizeAwaySlot);
  const awaySlotsForDate = slotsForDate.filter(isAwaySession);
  const homeSlotsForDate = slotsForDate.filter((s) => !isAwaySession(s));

  // Filter home slots for the Milltown Turf Matrix (Pitch 1, Pitch 2, P3)
  const filteredHomeSlots = homeSlotsForDate.filter((slot) => {
    if (selectedPathway !== 'ALL' && slot.pathway !== selectedPathway) return false;
    if (selectedPitch !== 'ALL') {
      if (selectedPitch === 'Pitch 1') {
        const isP1 = slot.pitchSectorId.startsWith('p1') || slot.pitchSectorId.includes('1');
        if (!isP1) return false;
      } else if (selectedPitch === 'Pitch 2') {
        const isP2 = slot.pitchSectorId.startsWith('p2') || slot.pitchSectorId.includes('2');
        if (!isP2) return false;
      } else if (selectedPitch === 'Away') {
        return false;
      } else if (slot.pitchSectorId !== selectedPitch) {
        return false;
      }
    }
    return true;
  });

  // Unique time bands for Milltown Turf Matrix (home turf only)
  const timeSlots = Array.from(new Set(homeSlotsForDate.map((s) => s.timeSlot))).sort();

  // Pitch groupings for Spatial Matrix headers
  const pitch1Sectors = sectors.filter(
    (s) => s.pitch === 'Pitch 1' || s.code.startsWith('P1') || s.id.startsWith('p1')
  );
  const pitch2Sectors = sectors.filter(
    (s) => s.pitch === 'Pitch 2' || s.code.startsWith('P2') || s.id.startsWith('p2')
  );
  const otherSectors = sectors.filter(
    (s) => !pitch1Sectors.some((p) => p.id === s.id) && !pitch2Sectors.some((p) => p.id === s.id)
  );

  // Visible sectors based on filter
  const visibleSectors = sectors.filter((sec) => {
    if (selectedPitch === 'ALL') return true;
    if (selectedPitch === 'Pitch 1') {
      return pitch1Sectors.some((p) => p.id === sec.id);
    }
    if (selectedPitch === 'Pitch 2') {
      return pitch2Sectors.some((p) => p.id === sec.id);
    }
    return sec.id === selectedPitch;
  });

  const visiblePitch1Sectors = pitch1Sectors.filter((sec) =>
    visibleSectors.some((v) => v.id === sec.id)
  );
  const visiblePitch2Sectors = pitch2Sectors.filter((sec) =>
    visibleSectors.some((v) => v.id === sec.id)
  );
  const visibleOtherSectors = otherSectors.filter((sec) =>
    visibleSectors.some((v) => v.id === sec.id)
  );

  const duplicateSchedule = useAppStore((s) => s.duplicateSchedule);
  const shiftTimings = useAppStore((s) => s.shiftTimings);
  const storeDrills = useAppStore((s) => s.drills);
  const storeAvailability = useAppStore((s) => s.availability);

  const activeDrills = drills || storeDrills;
  const activeAvailability = availability || storeAvailability;

  const handleCopyFromPrevious = () => {
    const datesWithSlots = Array.from(
      new Set(slots.filter((s) => s.date !== selectedDate).map((s) => s.date))
    );
    const sourceDate = datesWithSlots[0] || '2026-09-13';
    duplicateSchedule(sourceDate, selectedDate);
    showToast(
      `Copied ${slots.filter((s) => s.date === sourceDate).length} sessions from ${sourceDate} to ${selectedDate}!`
    );
  };

  const handleShiftTimings = (deltaMinutes: number) => {
    shiftTimings(selectedDate, deltaMinutes);
    const dir = deltaMinutes > 0 ? `+${deltaMinutes}` : `${deltaMinutes}`;
    showToast(`Shifted all Sunday sessions by ${dir} mins!`);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="space-y-4">
      {/* 1. UNIFIED COMMAND STRIP */}
      <TimetableFilterBar
        formattedDate={formattedDate}
        totalSlotsCount={slotsForDate.length}
        selectedPathway={selectedPathway}
        onSelectPathway={setSelectedPathway}
        selectedPitch={selectedPitch}
        onSelectPitch={setSelectedPitch}
        awaySlotsCount={awaySlotsForDate.length}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onShiftTimings={handleShiftTimings}
        onOpenImportModal={onOpenImportModal}
        onCopyWhatsApp={onCopyWhatsApp}
        copiedWhatsApp={copiedWhatsApp}
        onAddNewSlot={() => onAddCustomSlot()}
        onOpenBulkTimings={() => setShowBulkTimingsModal(true)}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenCalendarManager={onOpenCalendarManager}
        showQuickActionsBar={showQuickActionsBar}
        onToggleQuickActionsBar={() => setShowQuickActionsBar(!showQuickActionsBar)}
      />

      {/* PITCHSIDE QUICK-ACTIONS COCKPIT (COLLAPSIBLE) */}
      {showQuickActionsBar && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <SundayMorningQuickActions
            selectedDate={selectedDate}
            slots={slots}
            coaches={coaches}
            sectors={sectors}
            drills={activeDrills}
            availability={activeAvailability}
            onShiftTimings={handleShiftTimings}
            onUpdateSlotCoach={onUpdateSlotCoach}
            showToast={showToast}
          />
        </div>
      )}

      {/* CONFLICTS ALERT BANNER */}
      {conflicts.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-3 sm:p-4 flex items-start gap-3 shadow-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-200">
              {conflicts.length} Sunday Pitch Collision / Alert{conflicts.length > 1 ? 's' : ''} Detected
            </h4>
            <p className="text-amber-300/80 mt-0.5">
              {conflicts.map((c) => c.description).join(' ')}
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT: EMPTY STATE OR SPATIAL MATRIX / TIMELINE */}
      {slotsForDate.length === 0 ? (
        <div className="p-8 sm:p-14 text-center bg-neutral-950 border border-neutral-800 rounded-3xl space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 text-red-500 mx-auto flex items-center justify-center shadow-md">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              No Sessions Scheduled for {formattedDate}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              Milltown AstroTurf is currently unallocated on this date. Duplicate from previous Sunday, load a master blueprint, or add custom slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyFromPrevious}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Schedule from Previous Sunday</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>Load Sunday Master Blueprint</span>
            </button>

            <button
              type="button"
              onClick={() => onAddCustomSlot()}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-red-500" />
              <span>Add Custom Slot</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'matrix' && selectedPitch === 'Away' ? (
            <AwayFixturesSection
              awaySlots={awaySlotsForDate}
              coaches={coaches}
              isFullView
              onAddAwayFixture={() => onAddCustomSlot({ pitchSectorId: 'away' })}
              onBackToAllTurf={() => setSelectedPitch('ALL')}
              onSelectSlot={onSelectSlot}
              onUpdateSlotCoach={onUpdateSlotCoach}
              showToast={showToast}
            />
          ) : viewMode === 'matrix' ? (
            <div className="space-y-6">
              {/* SPATIAL PITCH MATRIX VIEW */}
              <TimetableMatrixGrid
                visibleSectors={visibleSectors}
                visiblePitch1Sectors={visiblePitch1Sectors}
                visiblePitch2Sectors={visiblePitch2Sectors}
                visibleOtherSectors={visibleOtherSectors}
                timeSlots={timeSlots}
                slots={filteredHomeSlots}
                coaches={coaches}
                conflicts={conflicts}
                onSelectSlot={onSelectSlot}
                onUpdateSlotCoach={onUpdateSlotCoach}
                onAddCustomSlot={onAddCustomSlot}
              />

              {/* Dedicated Away Fixtures Sub-Section (Underneath Home Turf Grid) */}
              {selectedPitch === 'ALL' && awaySlotsForDate.length > 0 && (
                <AwayFixturesSection
                  awaySlots={awaySlotsForDate}
                  coaches={coaches}
                  onAddAwayFixture={() => onAddCustomSlot({ pitchSectorId: 'away' })}
                  onIsolateAwayView={() => setSelectedPitch('Away')}
                  onSelectSlot={onSelectSlot}
                  onUpdateSlotCoach={onUpdateSlotCoach}
                  showToast={showToast}
                />
              )}
            </div>
          ) : (
            /* TIMELINE LIST VIEW */
            <div className="space-y-4">
              <TimetableTimelineView
                timeSlots={timeSlots}
                slots={filteredHomeSlots}
                sectors={sectors}
                coaches={coaches}
                conflicts={conflicts}
                onSelectSlot={onSelectSlot}
                onUpdateSlotCoach={onUpdateSlotCoach}
              />

              {/* Away Fixtures Sub-Section in Timeline View */}
              {selectedPitch !== 'Pitch 1' &&
                selectedPitch !== 'Pitch 2' &&
                awaySlotsForDate.length > 0 && (
                  <AwayFixturesSection
                    awaySlots={awaySlotsForDate}
                    coaches={coaches}
                    onAddAwayFixture={() => onAddCustomSlot({ pitchSectorId: 'away' })}
                    onIsolateAwayView={() => setSelectedPitch('Away')}
                    onSelectSlot={onSelectSlot}
                    onUpdateSlotCoach={onUpdateSlotCoach}
                    showToast={showToast}
                  />
                )}
            </div>
          )}
        </>
      )}

      {/* Sunday Master Templates Modal */}
      <SundayMasterTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        selectedDate={selectedDate}
        currentSlots={slots}
        coaches={coaches}
        onApplyTemplate={(newSlots) => {
          if (onApplyTemplate) {
            onApplyTemplate(newSlots);
          }
        }}
      />

      {/* Bulk Timings & Team Assignments Editor Modal */}
      <BulkTimingsEditorModal
        isOpen={showBulkTimingsModal}
        onClose={() => setShowBulkTimingsModal(false)}
        slots={slots}
        sectors={sectors}
        selectedDate={selectedDate}
        onSaveAllSlots={(updated) => {
          if (onUpdateAllSlots) {
            onUpdateAllSlots(updated);
          }
        }}
        showToast={showToast}
      />
    </div>
  );
};
