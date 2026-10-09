/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { OldAlexLoadingSpinner } from '../Common/OldAlexLoadingSpinner';
import { ErrorBoundary } from '../Common/ErrorBoundary';
import type { ExportHubTab } from '../ExportHub/ExportHubModal';
import { HubBackupData } from '../../services/exportService';
import {
  useAppStore,
  selectSelectedSlot,
} from '../../store';
import {
  Coach,
  Drill,
  MatchFixture,
  Player,
  SessionSlot,
} from '../../types';
import {
  INITIAL_SESSION_SLOTS,
  COACHES,
  INITIAL_SECTOR_GEAR,
  INITIAL_FIXTURES,
  INITIAL_PREP_CHECKLIST,
  INITIAL_BLITZ_TOURNAMENTS,
} from '../../data/initialData';

// Lazy-loaded heavy tools & modals (Loaded on-demand only when triggered)
const SlotSideDrawer = lazy(() =>
  import('../Timetable/SlotSideDrawer').then((m) => ({ default: m.SlotSideDrawer }))
);
const AddSlotModal = lazy(() =>
  import('../Timetable/AddSlotModal').then((m) => ({ default: m.AddSlotModal }))
);
const DirectorPackGeneratorModal = lazy(() =>
  import('../DirectorPack/DirectorPackGeneratorModal').then((m) => ({ default: m.DirectorPackGeneratorModal }))
);
const PitchSideCompanionModal = lazy(() =>
  import('../PitchSideCompanion/PitchSideCompanionModal').then((m) => ({ default: m.PitchSideCompanionModal }))
);
const WhatsAppShareModal = lazy(() =>
  import('../WhatsAppExport/WhatsAppShareModal').then((m) => ({ default: m.WhatsAppShareModal }))
);
const MonthlyReportModal = lazy(() =>
  import('../MonthlyReport/MonthlyReportModal').then((m) => ({ default: m.MonthlyReportModal }))
);
const ExportHubModal = lazy(() =>
  import('../ExportHub/ExportHubModal').then((m) => ({ default: m.ExportHubModal }))
);
const CalendarDateManagerModal = lazy(() =>
  import('../CalendarManager/CalendarDateManagerModal').then((m) => ({ default: m.CalendarDateManagerModal }))
);
const NotificationModal = lazy(() =>
  import('../NotificationModal').then((m) => ({ default: m.NotificationModal }))
);
const NotificationsDrawer = lazy(() =>
  import('../NotificationsDrawer').then((m) => ({ default: m.NotificationsDrawer }))
);
const TacticalWhiteboard = lazy(() =>
  import('../TacticalBoard/TacticalWhiteboard').then((m) => ({ default: m.TacticalWhiteboard }))
);
const TacticalDrillAnimator = lazy(() =>
  import('../TacticalBoard/TacticalDrillAnimator').then((m) => ({ default: m.TacticalDrillAnimator }))
);
const EmergencySafetyModal = lazy(() =>
  import('../Common/EmergencySafetyModal').then((m) => ({ default: m.EmergencySafetyModal }))
);
const GoogleIntegrationModal = lazy(() =>
  import('../GoogleIntegration/GoogleIntegrationModal').then((m) => ({ default: m.GoogleIntegrationModal }))
);
const ScheduleImportModal = lazy(() =>
  import('../Timetable/ScheduleImportModal').then((m) => ({ default: m.ScheduleImportModal }))
);
const LeinsterFixturesImportModal = lazy(() =>
  import('../Fixtures/LeinsterFixturesImportModal').then((m) => ({ default: m.LeinsterFixturesImportModal }))
);

export function ModalRegistry() {
  const slots = useAppStore((s) => s.slots);
  const coaches = useAppStore((s) => s.coaches);
  const sectors = useAppStore((s) => s.sectors);
  const drills = useAppStore((s) => s.drills);
  const notifications = useAppStore((s) => s.notifications);
  const availability = useAppStore((s) => s.availability);
  const sectorGear = useAppStore((s) => s.sectorGear);
  const firstAid = useAppStore((s) => s.firstAid);
  const fixtures = useAppStore((s) => s.fixtures);

  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const setSelectedSlotId = useAppStore((s) => s.setSelectedSlotId);
  const setCurrentTab = useAppStore((s) => s.setCurrentTab);

  const activeModal = useAppStore((s) => s.activeModal);
  const modalPayload = useAppStore((s) => s.modalPayload);
  const openModal = useAppStore((s) => s.openModal);
  const closeModal = useAppStore((s) => s.closeModal);
  const showToast = useAppStore((s) => s.showToast);

  const addSlot = useAppStore((s) => s.addSlot);
  const updateSlot = useAppStore((s) => s.updateSlot);
  const deleteSlot = useAppStore((s) => s.deleteSlot);
  const setSlots = useAppStore((s) => s.setSlots);
  const setCoaches = useAppStore((s) => s.setCoaches);
  const setFixtures = useAppStore((s) => s.setFixtures);
  const setDrills = useAppStore((s) => s.setDrills);
  const addDrill = useAppStore((s) => s.addDrill);
  const updateDrill = useAppStore((s) => s.updateDrill);
  const setChecklist = useAppStore((s) => s.setChecklist);
  const setAvailability = useAppStore((s) => s.setAvailability);
  const updateGearAllocation = useAppStore((s) => s.updateGearAllocation);
  const triggerNotification = useAppStore((s) => s.triggerNotification);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const clearAllNotifications = useAppStore((s) => s.clearAllNotifications);

  const selectedSlotForDrawer = useAppStore(selectSelectedSlot);

  // Modal Handlers
  const handleOpenPitchCompanion = (slotToRun?: SessionSlot | null) => {
    if (slotToRun) {
      openModal('pitch_companion', { slot: slotToRun });
    } else {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const activeSlot = slots.find((s) => {
        const [sh, sm] = (s.startTime || '09:00').split(':').map(Number);
        const [eh, em] = (s.endTime || '10:15').split(':').map(Number);
        const startMin = (sh || 9) * 60 + (sm || 0);
        const endMin = (eh || 10) * 60 + (em || 15);
        return currentMinutes >= startMin && currentMinutes <= endMin;
      });
      openModal('pitch_companion', { slot: activeSlot || slots[0] || null });
    }
  };

  const handleAddSlot = (newSlot: SessionSlot) => {
    addSlot(newSlot);
    showToast(`New slot added for ${newSlot.ageGroupId} on ${newSlot.pitchSectorId.toUpperCase()}`);
  };

  const handleApplyScheduleImport = ({
    slots: importedSlots,
    newCoaches,
    fixtures: importedFixtures,
    targetDate,
    mode,
    floatNotes,
  }: {
    slots: SessionSlot[];
    newCoaches: Coach[];
    fixtures: MatchFixture[];
    targetDate: string;
    mode: 'replace' | 'merge';
    floatNotes?: string;
  }) => {
    // 1. Update coaches if any new coaches were auto-created
    if (newCoaches.length > 0) {
      setCoaches([...coaches, ...newCoaches]);
    }

    // 2. Update slots for the target date
    let nextSlots: SessionSlot[];
    if (mode === 'replace') {
      const otherDateSlots = slots.filter((s) => s.date !== targetDate);
      nextSlots = [...otherDateSlots, ...importedSlots];
    } else {
      nextSlots = [...slots, ...importedSlots];
    }
    setSlots(nextSlots);

    // 3. Update fixtures if matches were in the spreadsheet
    if (importedFixtures.length > 0) {
      const otherDateFixtures = fixtures.filter((f) => f.date !== targetDate);
      setFixtures([...otherDateFixtures, ...importedFixtures]);
    }

    // 4. Update date if different
    if (targetDate !== selectedDate) {
      setSelectedDate(targetDate);
    }

    // 5. Notify user
    const newCoachMsg = newCoaches.length > 0 ? ` · ${newCoaches.length} new coaches added` : '';
    const fixtureMsg = importedFixtures.length > 0 ? ` · ${importedFixtures.length} fixtures synced` : '';
    const floatMsg = floatNotes ? ` · Standby floats recorded` : '';
    showToast(
      `Imported ${importedSlots.length} sessions for ${targetDate}${newCoachMsg}${fixtureMsg}${floatMsg}!`
    );
  };

  const handleRestoreBackupSuccess = (backup: HubBackupData) => {
    if (backup.slots) setSlots(backup.slots);
    if (backup.drills) setDrills(backup.drills);
    if (backup.coaches) setCoaches(backup.coaches);
    if (backup.availability) setAvailability(backup.availability);
    if (backup.fixtures) setFixtures(backup.fixtures);
    if (backup.sectorGear) updateGearAllocation(backup.sectorGear);
    if (backup.checklist) setChecklist(backup.checklist);
    if (backup.firstAid) useAppStore.getState().setFirstAid(backup.firstAid);
    if (backup.players) useAppStore.getState().setPlayers(backup.players);
    if (backup.whatsAppGroups) useAppStore.getState().setWhatsAppGroups(backup.whatsAppGroups);
    if (backup.blitzTournaments) useAppStore.getState().setBlitzTournaments(backup.blitzTournaments);
  };

  const handleResetToOfficialMaster = () => {
    handleRestoreBackupSuccess({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      director: 'Richard Couse',
      slots: INITIAL_SESSION_SLOTS,
      drills,
      coaches: COACHES,
      availability: [],
      sectorGear: INITIAL_SECTOR_GEAR,
      firstAid: [],
      fixtures: INITIAL_FIXTURES,
      players: [],
      checklist: INITIAL_PREP_CHECKLIST,
      blitzTournaments: INITIAL_BLITZ_TOURNAMENTS,
    });
    showToast('Purged all placeholder data! Restored official Old Alex master schedule.');
  };

  return (
    <ErrorBoundary fallbackTitle="Modal Tool Recovery">
      <Suspense fallback={<OldAlexLoadingSpinner isModal message="Loading pitchside tool..." />}>
        {/* Slide-out Drawer for Slot Details */}
        {selectedSlotForDrawer && (
          <SlotSideDrawer
            slot={selectedSlotForDrawer}
            onClose={() => setSelectedSlotId(null)}
            onUpdateSlot={updateSlot}
            coaches={coaches}
            sectors={sectors}
            allDrills={drills}
            slots={slots}
            onTriggerNotification={triggerNotification}
            onUpdateDrill={updateDrill}
            onOpenPitchCompanion={(slotToRun) => {
              handleOpenPitchCompanion(slotToRun);
            }}
            onOpenWhatsAppModal={(slotId) => {
              openModal('export_hub', { initialTab: 'whatsapp', slotId });
            }}
            onDeleteSlot={(slotId) => {
              deleteSlot(slotId);
              showToast('Session slot deleted from Sunday schedule');
            }}
          />
        )}

        {/* Standalone Tactical Studio Modal */}
        {activeModal === 'tactical_studio' && (
          <TacticalWhiteboard
            title="Tactical Whiteboard — Old Alex Hockey Studio"
            onSave={(elements) => {
              const customDrill: Drill = {
                id: `drill-board-${Date.now()}`,
                title: `Tactical Board Sketch #${drills.length + 1}`,
                pathway: 'Development',
                skill: 'Tactical Overload & Positioning',
                durationMinutes: 15,
                minPlayers: 6,
                maxPlayers: 18,
                targetAgeGroups: ['4th Class', '5th Class', '6th Class'],
                setup: 'Interactive setup sketched on pitch whiteboard.',
                instructions: 'Execute passing and movement sequences as shown on tactical diagram.',
                coachingPoints: [
                  'Look up before releasing pass',
                  'Accelerate into space on off-ball runs',
                  'Maintain pitch width and depth',
                ],
                equipment: ['Hockey balls', 'Cones', 'Bibs'],
                diagramElements: elements,
              };
              addDrill(customDrill);
              closeModal();
              showToast('Tactical diagram saved as new drill in Drill Library!');
            }}
            onClose={closeModal}
          />
        )}

        {/* Interactive Tactical Drill Animator Modal */}
        {activeModal === 'tactical_animator' && (
          <TacticalDrillAnimator
            isOpen={true}
            onClose={closeModal}
          />
        )}

        {/* Add Slot Modal */}
        {activeModal === 'add_slot' && (
          <AddSlotModal
            isOpen={true}
            onClose={closeModal}
            onAddSlot={handleAddSlot}
            sectors={sectors}
            selectedDate={selectedDate}
            initialTimeSlot={(modalPayload?.prefill as any)?.timeSlot}
            initialPitchSectorId={(modalPayload?.prefill as any)?.pitchSectorId}
          />
        )}

        {/* Pitch-Side Companion Live Timer Modal */}
        {activeModal === 'pitch_companion' && (
          <PitchSideCompanionModal
            isOpen={true}
            onClose={closeModal}
            slot={(modalPayload?.slot as SessionSlot) || selectedSlotForDrawer || slots[0] || null}
            coaches={coaches}
            sector={sectors.find((s) => s.id === (modalPayload?.slot as SessionSlot)?.pitchSectorId || s.id === 'p1n')}
            allDrills={drills}
            allSlots={slots}
            allSectors={sectors}
            onSelectSlot={(slot) => openModal('pitch_companion', { slot })}
            onLogIncidentPrompt={(sectorCode, ageGroup) => {
              closeModal();
              setCurrentTab('kitshed');
              showToast(`Directing to Kit Shed for ${sectorCode} (${ageGroup}) first aid response.`);
            }}
          />
        )}

        {/* WhatsApp Multi-Template Dispatch Modal */}
        {activeModal === 'whatsapp_export' && (
          <WhatsAppShareModal
            isOpen={true}
            onClose={closeModal}
            slots={slots}
            coaches={coaches}
            sectors={sectors}
            drills={drills}
            fixtures={fixtures}
            selectedDate={selectedDate}
            initialSlotId={modalPayload?.slotId as string | undefined}
            onCopySuccess={(msg) => showToast(msg)}
          />
        )}

        {/* Comprehensive Communications & Export Hub */}
        {activeModal === 'export_hub' && (
          <ExportHubModal
            isOpen={true}
            onClose={closeModal}
            initialTab={(modalPayload?.initialTab as ExportHubTab) || 'whatsapp'}
            slots={slots}
            coaches={coaches}
            sectors={sectors}
            drills={drills}
            fixtures={fixtures}
            availability={availability}
            sectorGear={sectorGear}
            firstAid={firstAid}
            selectedDate={selectedDate}
            initialSlotId={(modalPayload?.slotId as string) || selectedSlotForDrawer?.id}
            onOpenDirectorPack={() => openModal('director_pack')}
            onRestoreBackupSuccess={handleRestoreBackupSuccess}
            onResetToOfficialMaster={handleResetToOfficialMaster}
            showToast={showToast}
          />
        )}

        {/* Calendar & Season Timetable Operations Modal */}
        {activeModal === 'calendar_manager' && (
          <CalendarDateManagerModal
            isOpen={true}
            onClose={closeModal}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            allSlots={slots}
            onUpdateSlots={setSlots}
            onOpenTemplatesModal={() => openModal('master_templates')}
            showToast={showToast}
          />
        )}

        {/* Director Master Pack Modal */}
        {activeModal === 'director_pack' && (
          <DirectorPackGeneratorModal
            isOpen={true}
            onClose={closeModal}
            slots={slots}
            coaches={coaches}
            sectors={sectors}
            drills={drills}
            selectedDate={selectedDate}
          />
        )}

        {/* Monthly Summary Report Modal */}
        {activeModal === 'report' && (
          <MonthlyReportModal
            isOpen={true}
            onClose={closeModal}
            slots={slots}
            coaches={coaches}
            sectors={sectors}
          />
        )}

        {/* Push Notification Broadcast Modal */}
        {activeModal === 'broadcast' && (
          <NotificationModal
            isOpen={true}
            onClose={closeModal}
            onSendAlert={triggerNotification}
            sectors={sectors}
            slots={slots}
          />
        )}

        {/* Notifications Drawer */}
        {activeModal === 'notifications_drawer' && (
          <NotificationsDrawer
            isOpen={true}
            onClose={closeModal}
            notifications={notifications}
            onMarkAllAsRead={markAllNotificationsRead}
            onClearAll={clearAllNotifications}
            onOpenBroadcastModal={() => openModal('broadcast')}
          />
        )}

        {/* Emergency Fast-Dial & Defibrillator Protocol Modal */}
        {activeModal === 'emergency_safety' && (
          <EmergencySafetyModal
            isOpen={true}
            onClose={closeModal}
            selectedPlayer={modalPayload?.player as Player | null}
          />
        )}

        {/* Google Workspace & Drive Sync Modal for Richard Couse */}
        {activeModal === 'google_sync' && (
          <GoogleIntegrationModal
            isOpen={true}
            onClose={closeModal}
            onRestoreFromBackup={() => {
              // Reload from persistence adapter
              const reloaded = useAppStore.getState();
              setSlots(reloaded.slots);
              setCoaches(reloaded.coaches);
              setFixtures(reloaded.fixtures);
            }}
            showToast={showToast}
          />
        )}

        {/* Weekly Spreadsheet Schedule Importer Modal */}
        {activeModal === 'schedule_import' && (
          <ScheduleImportModal
            isOpen={true}
            onClose={closeModal}
            selectedDate={selectedDate}
            existingCoaches={coaches}
            sectors={sectors}
            initialText={(modalPayload?.initialText as string) || ''}
            onApplySchedule={handleApplyScheduleImport}
            onSwitchToFixturesImport={() => openModal('fixtures_import')}
          />
        )}

        {/* Leinster Hockey Match Fixtures Importer Modal */}
        {activeModal === 'fixtures_import' && (
          <LeinsterFixturesImportModal
            isOpen={true}
            onClose={closeModal}
            onImport={(imported, mode) => {
              const res = useAppStore.getState().importLeinsterSeasonFixtures(imported, mode);
              setFixtures(useAppStore.getState().fixtures);
              showToast(
                `Successfully imported ${res.importedCount} fixtures (${res.updatedCount} updated, total ${res.totalCount})!`
              );
              return res;
            }}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}
