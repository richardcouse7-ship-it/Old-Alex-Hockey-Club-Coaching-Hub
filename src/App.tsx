/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SundayTimetable } from './components/Timetable/SundayTimetable';
import { PWAInstallBanner } from './components/Common/PWAInstallBanner';
import { OldAlexLoadingSpinner } from './components/Common/OldAlexLoadingSpinner';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { ModalRegistry } from './components/Modals/ModalRegistry';
import { BottomNavBar } from './components/Navigation';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import type { ExportHubTab } from './components/ExportHub/ExportHubModal';
import {
  useAppStore,
  selectConflicts,
  selectUtilization,
  selectUnreadNotificationsCount,
} from './store';
import {
  Player,
  SessionSlot,
} from './types';
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

export default function App() {
  // Browser lifecycle management
  const { isOnline } = useAppLifecycle();

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
  const setSelectedSlotId = useAppStore((s) => s.setSelectedSlotId);

  // UI Controls
  const openModal = useAppStore((s) => s.openModal);
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
  const updateSlot = useAppStore((s) => s.updateSlot);
  const assignCoachToSlot = useAppStore((s) => s.assignCoachToSlot);
  const setSlots = useAppStore((s) => s.setSlots);
  const setCoaches = useAppStore((s) => s.setCoaches);
  const setFixtures = useAppStore((s) => s.setFixtures);
  const addDrill = useAppStore((s) => s.addDrill);
  const updateDrill = useAppStore((s) => s.updateDrill);
  const toggleChecklistItem = useAppStore((s) => s.toggleChecklistItem);
  const setAvailability = useAppStore((s) => s.setAvailability);
  const updateGearAllocation = useAppStore((s) => s.updateGearAllocation);
  const logFirstAidIncident = useAppStore((s) => s.logFirstAidIncident);
  const applyMasterTemplate = useAppStore((s) => s.applyMasterTemplate);

  // Derived Selectors
  const conflicts = useAppStore(selectConflicts);
  const utilization = useAppStore(selectUtilization);
  const unreadCount = useAppStore(selectUnreadNotificationsCount);

  // Local transient state
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

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

  // Quick inline coach assign/toggle from timetable
  const handleInlineAssignCoach = (slotId: string, coachId: string) => {
    assignCoachToSlot(slotId, coachId);
    const targetSlot = slots.find((s) => s.id === slotId);
    const coach = coaches.find((c) => c.id === coachId);
    showToast(`${coach?.name || 'Coach'} assigned to ${targetSlot?.ageGroupId || 'session'}`);
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
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-[100] bg-neutral-900 border border-neutral-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
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
        isSunMode={isSunMode}
      />

      {/* Main Content Area (Offset by sidebar on desktop) */}
      <div
        className={`${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        } flex flex-col flex-1 min-h-screen transition-all duration-300 pb-16 lg:pb-0`}
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
                  drills={drills}
                  selectedDate={selectedDate}
                  isSunMode={isSunMode}
                  conflicts={conflicts}
                  checklist={checklist}
                  onToggleChecklist={toggleChecklistItem}
                  utilization={utilization}
                  onNavigateTab={setCurrentTab}
                  onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
                  onOpenPitchCompanion={(slot) => handleOpenPitchCompanion(slot)}
                  onOpenEmergencyModal={() => handleOpenEmergencyModal()}
                  onCopyWhatsApp={handleCopyWhatsApp}
                  copiedWhatsApp={copiedWhatsApp}
                  onOpenReport={() => openModal('report')}
                  onOpenBroadcastModal={() => openModal('broadcast')}
                  onOpenImportModal={(initialText) =>
                    openModal('schedule_import', initialText ? { initialText } : undefined)
                  }
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

              {(currentTab === 'availability' || currentTab === 'coaches') && (
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
                <SessionReviewsView
                  slots={slots}
                  onUpdateSlot={updateSlot}
                  selectedDate={selectedDate}
                />
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
      <ModalRegistry />

      {/* Mobile & Pitchside Bottom Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenPitchCompanion={() => handleOpenPitchCompanion()}
        onToggleMore={() => setMobileSidebarOpen(true)}
        isSunMode={isSunMode}
      />
    </div>
  );
}
