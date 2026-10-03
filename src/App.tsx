/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SundayTimetable } from './components/Timetable/SundayTimetable';
import { ScheduleImportModal } from './components/Timetable/ScheduleImportModal';
import { PWAInstallBanner } from './components/Common/PWAInstallBanner';
import { OldAlexLoadingSpinner } from './components/Common/OldAlexLoadingSpinner';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import type { ExportHubTab } from './components/ExportHub/ExportHubModal';
import { HubBackupData } from './services/exportService';
import {
  useAppStore,
  selectConflicts,
  selectUtilization,
  selectUnreadNotificationsCount,
  selectSelectedSlot,
} from './store';
import {
  Coach,
  Drill,
  MatchFixture,
  Player,
  SessionSlot,
} from './types';
import {
  INITIAL_SESSION_SLOTS,
  COACHES,
  INITIAL_SECTOR_GEAR,
  INITIAL_FIXTURES,
  INITIAL_PREP_CHECKLIST,
  INITIAL_BLITZ_TOURNAMENTS,
} from './data/initialData';
import { WifiOff } from 'lucide-react';

// Lazy-loaded secondary tab views (Loaded on-demand when switching tabs)
const DrillLibraryView = lazy(() =>
  import('./components/DrillLibrary/DrillLibraryView').then((m) => ({ default: m.DrillLibraryView }))
);
const SeasonOverviewView = lazy(() =>
  import('./components/SeasonOverview/SeasonOverviewView').then((m) => ({ default: m.SeasonOverviewView }))
);
const WeeklyPlannerView = lazy(() =>
  import('./components/WeeklyPlanner/WeeklyPlannerView').then((m) => ({ default: m.WeeklyPlannerView }))
);
const SessionReviewsView = lazy(() =>
  import('./components/SessionReviews/SessionReviewsView').then((m) => ({ default: m.SessionReviewsView }))
);
const CoachAvailabilityView = lazy(() =>
  import('./components/CoachAvailability/CoachAvailabilityView').then((m) => ({ default: m.CoachAvailabilityView }))
);
const KitShedAndSafetyView = lazy(() =>
  import('./components/KitShed/KitShedAndSafetyView').then((m) => ({ default: m.KitShedAndSafetyView }))
);
const FixturesView = lazy(() =>
  import('./components/Fixtures/FixturesView').then((m) => ({ default: m.FixturesView }))
);
const BlitzTournamentView = lazy(() =>
  import('./components/Blitz/BlitzTournamentView').then((m) => ({ default: m.BlitzTournamentView }))
);
const PlayerAttendanceView = lazy(() =>
  import('./components/Attendance/PlayerAttendanceView').then((m) => ({ default: m.PlayerAttendanceView }))
);

// Lazy-loaded heavy tools & modals (Loaded on-demand only when triggered)
const SlotSideDrawer = lazy(() =>
  import('./components/Timetable/SlotSideDrawer').then((m) => ({ default: m.SlotSideDrawer }))
);
const AddSlotModal = lazy(() =>
  import('./components/Timetable/AddSlotModal').then((m) => ({ default: m.AddSlotModal }))
);
const DirectorPackGeneratorModal = lazy(() =>
  import('./components/DirectorPack/DirectorPackGeneratorModal').then((m) => ({ default: m.DirectorPackGeneratorModal }))
);
const PitchSideCompanionModal = lazy(() =>
  import('./components/PitchSideCompanion/PitchSideCompanionModal').then((m) => ({ default: m.PitchSideCompanionModal }))
);
const WhatsAppShareModal = lazy(() =>
  import('./components/WhatsAppExport/WhatsAppShareModal').then((m) => ({ default: m.WhatsAppShareModal }))
);
const MonthlyReportModal = lazy(() =>
  import('./components/MonthlyReport/MonthlyReportModal').then((m) => ({ default: m.MonthlyReportModal }))
);
const ExportHubModal = lazy(() =>
  import('./components/ExportHub/ExportHubModal').then((m) => ({ default: m.ExportHubModal }))
);
const CalendarDateManagerModal = lazy(() =>
  import('./components/CalendarManager/CalendarDateManagerModal').then((m) => ({ default: m.CalendarDateManagerModal }))
);
const NotificationModal = lazy(() =>
  import('./components/NotificationModal').then((m) => ({ default: m.NotificationModal }))
);
const NotificationsDrawer = lazy(() =>
  import('./components/NotificationsDrawer').then((m) => ({ default: m.NotificationsDrawer }))
);
const TacticalWhiteboard = lazy(() =>
  import('./components/TacticalBoard/TacticalWhiteboard').then((m) => ({ default: m.TacticalWhiteboard }))
);
const TacticalDrillAnimator = lazy(() =>
  import('./components/TacticalBoard/TacticalDrillAnimator').then((m) => ({ default: m.TacticalDrillAnimator }))
);
const EmergencySafetyModal = lazy(() =>
  import('./components/Common/EmergencySafetyModal').then((m) => ({ default: m.EmergencySafetyModal }))
);
const GoogleIntegrationModal = lazy(() =>
  import('./components/GoogleIntegration/GoogleIntegrationModal').then((m) => ({ default: m.GoogleIntegrationModal }))
);

export default function App() {
  // ==========================================
  // CENTRAL STORE SELECTORS
  // ==========================================
  const slots = useAppStore((s) => s.slots);
  const coaches = useAppStore((s) => s.coaches);
  const sectors = useAppStore((s) => s.sectors);
  const drills = useAppStore((s) => s.drills);
  const checklist = useAppStore((s) => s.checklist);
  const notifications = useAppStore((s) => s.notifications);
  const availability = useAppStore((s) => s.availability);
  const sectorGear = useAppStore((s) => s.sectorGear);
  const firstAid = useAppStore((s) => s.firstAid);
  const fixtures = useAppStore((s) => s.fixtures);

  // Navigation & View Context
  const currentTab = useAppStore((s) => s.currentTab);
  const setCurrentTab = useAppStore((s) => s.setCurrentTab);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const selectedSlotId = useAppStore((s) => s.selectedSlotId);
  const setSelectedSlotId = useAppStore((s) => s.setSelectedSlotId);

  // Modals & UI Controls
  const activeModal = useAppStore((s) => s.activeModal);
  const modalPayload = useAppStore((s) => s.modalPayload);
  const openModal = useAppStore((s) => s.openModal);
  const closeModal = useAppStore((s) => s.closeModal);
  const toastMessage = useAppStore((s) => s.toastMessage);
  const showToast = useAppStore((s) => s.showToast);
  const mobileSidebarOpen = useAppStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useAppStore((s) => s.setMobileSidebarOpen);

  // Preferences
  const isSunMode = useAppStore((s) => s.isSunMode);
  const toggleSunMode = useAppStore((s) => s.toggleSunMode);
  const isSidebarCollapsed = useAppStore((s) => s.isSidebarCollapsed);
  const toggleSidebarCollapse = useAppStore((s) => s.toggleSidebarCollapse);
  const isSimulatingOffline = useAppStore((s) => s.isSimulatingOffline);
  const toggleOfflineSim = useAppStore((s) => s.toggleOfflineSim);

  // Domain Actions
  const addSlot = useAppStore((s) => s.addSlot);
  const updateSlot = useAppStore((s) => s.updateSlot);
  const deleteSlot = useAppStore((s) => s.deleteSlot);
  const assignCoachToSlot = useAppStore((s) => s.assignCoachToSlot);
  const setSlots = useAppStore((s) => s.setSlots);
  const setCoaches = useAppStore((s) => s.setCoaches);
  const setFixtures = useAppStore((s) => s.setFixtures);
  const setDrills = useAppStore((s) => s.setDrills);
  const addDrill = useAppStore((s) => s.addDrill);
  const updateDrill = useAppStore((s) => s.updateDrill);
  const setChecklist = useAppStore((s) => s.setChecklist);
  const toggleChecklistItem = useAppStore((s) => s.toggleChecklistItem);
  const setAvailability = useAppStore((s) => s.setAvailability);
  const updateGearAllocation = useAppStore((s) => s.updateGearAllocation);
  const logFirstAidIncident = useAppStore((s) => s.logFirstAidIncident);
  const triggerNotification = useAppStore((s) => s.triggerNotification);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const clearAllNotifications = useAppStore((s) => s.clearAllNotifications);
  const applyMasterTemplate = useAppStore((s) => s.applyMasterTemplate);

  // Derived Selectors
  const conflicts = useAppStore(selectConflicts);
  const utilization = useAppStore(selectUtilization);
  const unreadCount = useAppStore(selectUnreadNotificationsCount);
  const selectedSlotForDrawer = useAppStore(selectSelectedSlot);

  // Local transient state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored: Synchronized with Old Alex Cloud');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode Active: Changes saved to pitch cache');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Lock body scroll when mobile drawer is open so touch scrolling targets the menu
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleOpenAddSlotModal = (prefill?: { timeSlot?: string; pitchSectorId?: string }) => {
    openModal('add_slot', { prefill });
  };

  const handleOpenEmergencyModal = (player?: Player | null) => {
    openModal('emergency_safety', { player: player || null });
  };

  const handleOpenExportHub = (tab: ExportHubTab = 'whatsapp') => {
    openModal('export_hub', { initialTab: tab });
  };

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

  // Quick inline coach assign/toggle from timetable
  const handleInlineAssignCoach = (slotId: string, coachId: string) => {
    assignCoachToSlot(slotId, coachId);
    const targetSlot = slots.find((s) => s.id === slotId);
    const coach = coaches.find((c) => c.id === coachId);
    showToast(`${coach?.name || 'Coach'} assigned to ${targetSlot?.ageGroupId || 'session'}`);
  };

  // Add custom slot
  const handleAddSlot = (newSlot: SessionSlot) => {
    addSlot(newSlot);
    showToast(`New slot added for ${newSlot.ageGroupId} on ${newSlot.pitchSectorId.toUpperCase()}`);
  };

  // WhatsApp copy action
  const handleCopyWhatsApp = () => {
    handleOpenExportHub('whatsapp');
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handleAutoAssignCoaches = (assignments: { slotId: string; coachId: string }[]) => {
    for (const { slotId, coachId } of assignments) {
      assignCoachToSlot(slotId, coachId);
    }
    showToast(`Assigned ${assignments.length} coaches to Sunday pitch slots.`);
  };

  return (
    <div
      className={`min-h-screen bg-black text-neutral-100 flex flex-col font-sans transition-colors duration-200 ${
        isSunMode ? 'sun-mode' : ''
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isOnline={isOnline}
        isSimulatingOffline={isSimulatingOffline}
        onToggleSimulateOffline={toggleOfflineSim}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => openModal('notifications_drawer')}
        onOpenReport={() => openModal('report')}
        onOpenTacticalStudio={() => openModal('tactical_studio')}
        onOpenTacticalAnimator={() => openModal('tactical_animator')}
        onOpenDirectorPack={() => openModal('director_pack')}
        onOpenPitchCompanion={() => handleOpenPitchCompanion()}
        onOpenWhatsAppModal={() => handleOpenExportHub('whatsapp')}
        onOpenExportHub={handleOpenExportHub}
        onOpenEmergencyModal={() => handleOpenEmergencyModal()}
        onOpenGoogleModal={() => openModal('google_sync')}
        onOpenImportModal={() => openModal('schedule_import')}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area (Offset by sidebar on desktop) */}
      <div
        className={`${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        } flex flex-col flex-1 min-h-screen transition-all duration-300`}
      >
        {/* PWA Home Screen Installation Prompt */}
        <PWAInstallBanner />

        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onCopyWhatsApp={() => handleOpenExportHub('whatsapp')}
          copiedWhatsApp={copiedWhatsApp}
          unreadNotifications={notifications.filter((n) => !n.read)}
          onOpenNotificationsModal={() => openModal('notifications_drawer')}
          isOnline={isOnline}
          isSimulatingOffline={isSimulatingOffline}
          onOpenPitchCompanion={() => handleOpenPitchCompanion()}
          onOpenExportHub={() => handleOpenExportHub('whatsapp')}
          onOpenCalendarManager={() => openModal('calendar_manager')}
          onOpenEmergencyModal={() => handleOpenEmergencyModal()}
          onOpenGoogleModal={() => openModal('google_sync')}
          isSunMode={isSunMode}
          onToggleSunMode={toggleSunMode}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
        />

        {/* Offline Banner if simulating or offline */}
        {(!isOnline || isSimulatingOffline) && (
          <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>Field Offline Mode Active:</strong> You can continue updating coach assignments and notes in remote pitch zones. All changes are saved locally.
              </span>
            </div>
            {isSimulatingOffline && (
              <button
                type="button"
                onClick={toggleOfflineSim}
                className="underline hover:text-white font-medium"
              >
                Disable Simulation
              </button>
            )}
          </div>
        )}

        {/* Dynamic View Content */}
        <main
          className={`flex-1 p-3 sm:p-5 lg:p-6 ${
            currentTab === 'timetable' ? 'max-w-[1700px]' : 'max-w-7xl'
          } w-full mx-auto transition-all duration-300`}
        >
          <ErrorBoundary fallbackTitle="Section Error">
            <Suspense fallback={<OldAlexLoadingSpinner message="Opening pitch section..." />}>
              {currentTab === 'dashboard' && (
                <DashboardView
                  slots={slots}
                  coaches={coaches}
                  sectors={sectors}
                  conflicts={conflicts}
                  checklist={checklist}
                  onToggleChecklist={toggleChecklistItem}
                  utilization={utilization}
                  onNavigateTab={setCurrentTab}
                  onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
                  onCopyWhatsApp={handleCopyWhatsApp}
                  copiedWhatsApp={copiedWhatsApp}
                  onOpenReport={() => openModal('report')}
                  onOpenBroadcastModal={() => openModal('broadcast')}
                  isOnline={isOnline && !isSimulatingOffline}
                />
              )}

              {currentTab === 'timetable' && (
                <SundayTimetable
                  slots={slots}
                  coaches={coaches}
                  sectors={sectors}
                  conflicts={conflicts}
                  selectedDate={selectedDate}
                  drills={drills}
                  availability={availability}
                  fixtures={fixtures}
                  onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
                  onUpdateSlotCoach={handleInlineAssignCoach}
                  onQuickAssignCoach={handleInlineAssignCoach}
                  onCopyWhatsApp={handleCopyWhatsApp}
                  copiedWhatsApp={copiedWhatsApp}
                  onAddCustomSlot={(prefill) => handleOpenAddSlotModal(prefill)}
                  onApplyTemplate={applyMasterTemplate}
                  onOpenCalendarManager={() => openModal('calendar_manager')}
                  onUpdateAllSlots={setSlots}
                  onOpenImportModal={() => openModal('schedule_import')}
                  showToast={showToast}
                />
              )}

              {currentTab === 'attendance' && (
                <PlayerAttendanceView
                  selectedDate={selectedDate}
                  slots={slots}
                  onOpenEmergencyModal={(player) => handleOpenEmergencyModal(player)}
                />
              )}

              {currentTab === 'planner' && (
                <WeeklyPlannerView
                  slots={slots}
                  coaches={coaches}
                  sectors={sectors}
                  drills={drills}
                  selectedDate={selectedDate}
                  fixtures={fixtures}
                  onOpenSlotDrawer={(slot) => setSelectedSlotId(slot.id)}
                  onCopyWhatsApp={handleCopyWhatsApp}
                  onApplyTemplate={applyMasterTemplate}
                />
              )}

              {currentTab === 'fixtures' && (
                <FixturesView
                  fixtures={fixtures}
                  slots={slots}
                  sectors={sectors}
                  selectedDate={selectedDate}
                  onUpdateFixtures={setFixtures}
                  onShareWhatsApp={() => handleOpenExportHub('whatsapp')}
                />
              )}

              {currentTab === 'drills' && (
                <DrillLibraryView
                  drills={drills}
                  onAddDrill={addDrill}
                  onUpdateDrill={updateDrill}
                />
              )}

              {currentTab === 'coaches' && (
                <CoachAvailabilityView
                  coaches={coaches}
                  availability={availability}
                  slots={slots}
                  selectedDate={selectedDate}
                  onUpdateAvailability={setAvailability}
                  onAutoAssignCoaches={handleAutoAssignCoaches}
                  onUpdateCoaches={setCoaches}
                  onUpdateSlots={setSlots}
                />
              )}

              {currentTab === 'kitshed' && (
                <KitShedAndSafetyView
                  gearAllocations={sectorGear}
                  firstAidIncidents={firstAid}
                  onUpdateGear={updateGearAllocation}
                  onUpdateFirstAid={(incidents) => {
                    if (incidents[0]) logFirstAidIncident(incidents[0]);
                  }}
                  selectedDate={selectedDate}
                />
              )}

              {currentTab === 'reviews' && (
                <SessionReviewsView slots={slots} onUpdateSlot={updateSlot} />
              )}

              {currentTab === 'blitz' && (
                <BlitzTournamentView selectedDate={selectedDate} />
              )}

              {currentTab === 'season' && (
                <SeasonOverviewView />
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Lazy-Loaded Modals & Drawers */}
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
        </Suspense>
      </ErrorBoundary>

      {/* Weekly Spreadsheet Schedule Importer Modal */}
      <ScheduleImportModal
        isOpen={activeModal === 'schedule_import'}
        onClose={closeModal}
        selectedDate={selectedDate}
        existingCoaches={coaches}
        sectors={sectors}
        onApplySchedule={handleApplyScheduleImport}
      />
    </div>
  );
}
