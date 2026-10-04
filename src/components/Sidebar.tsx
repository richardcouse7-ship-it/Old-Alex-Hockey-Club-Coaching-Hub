import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Compass,
  CalendarDays,
  ClipboardCheck,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  Bell,
  X,
  Shield,
  Users,
  Package,
  Lock,
  Trophy,
  Clock,
  Share2,
  Download,
  UserCheck,
  Play,
  Award,
  Cloud,
  ChevronLeft,
} from 'lucide-react';
import { ExportHubTab } from './ExportHub/ExportHubModal';
import { OldAlexCrest } from './Common/OldAlexCrest';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isOnline: boolean;
  isSimulatingOffline: boolean;
  onToggleSimulateOffline: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenReport: () => void;
  onOpenTacticalStudio?: () => void;
  onOpenTacticalAnimator?: () => void;
  onOpenDirectorPack?: () => void;
  onOpenPitchCompanion?: () => void;
  onOpenWhatsAppModal?: () => void;
  onOpenExportHub?: (tab?: ExportHubTab) => void;
  onOpenEmergencyModal?: () => void;
  onOpenGoogleModal?: () => void;
  onOpenImportModal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isSunMode?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isOnline,
  isSimulatingOffline,
  onToggleSimulateOffline,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenReport,
  onOpenTacticalAnimator,
  onOpenDirectorPack,
  onOpenPitchCompanion,
  onOpenWhatsAppModal,
  onOpenExportHub,
  onOpenEmergencyModal,
  onOpenGoogleModal,
  onOpenImportModal,
  isCollapsed = false,
  onToggleCollapse,
  isSunMode = false,
}) => {
  // Semantic clusters for the coaching hub
  const sections: NavSection[] = [
    {
      title: 'Sunday Pitchside Operations',
      items: [
        { id: 'timetable', label: 'Sunday Timetable', icon: Calendar },
        { id: 'availability', label: 'Coaches & Availability', icon: Users },
        { id: 'attendance', label: 'Player Attendance & Welfare', icon: UserCheck },
      ],
    },
    {
      title: 'Curriculum & Coaching',
      items: [
        { id: 'drills', label: 'Drill Library', icon: BookOpen },
        { id: 'planner', label: 'Weekly Planner', icon: CalendarDays },
        { id: 'season', label: 'Season Overview', icon: Compass },
        { id: 'reviews', label: 'Session Reviews', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Club Operations & Fixtures',
      items: [
        { id: 'fixtures', label: 'Matches & Away Fixtures', icon: Trophy },
        { id: 'blitz', label: 'Sunday Blitz Rota', icon: Award },
        { id: 'kitshed', label: 'Kit Shed & Safety', icon: Package },
      ],
    },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  const isTabActive = (itemId: string) => {
    if (itemId === 'availability') {
      return currentTab === 'availability' || currentTab === 'coaches';
    }
    return currentTab === itemId;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden cursor-pointer"
          onClick={onCloseMobile}
          role="button"
          tabIndex={0}
          aria-label="Close navigation sidebar"
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCloseMobile();
            }
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-black border-r border-neutral-800 flex flex-col h-full max-h-screen overflow-hidden transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-72'} ${isSunMode ? 'sun-mode' : ''}`}
      >
        {/* Brand & Club Header */}
        <div
          className={`border-b border-neutral-850 flex items-center justify-between bg-black shrink-0 ${
            isCollapsed ? 'p-3 justify-center' : 'p-5'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Old Alex Crest Badge */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="cursor-pointer shrink-0 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl"
              title={isCollapsed ? 'Click to expand sidebar' : 'Old Alex Hockey Club'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Old Alex Hockey Club'}
            >
              <OldAlexCrest size={isCollapsed ? 34 : 42} className="drop-shadow-md" />
            </button>
            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                  Old Alex Hockey Club
                </h1>
                <p className="text-[11px] text-red-400 font-semibold tracking-wide">
                  Coaching Hub · Milltown
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-all active:scale-95"
              title="Collapse sidebar to icon mode"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden min-h-[48px] min-w-[48px] flex items-center justify-center p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-all active:scale-95"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation & Tools Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain focus:outline-none py-2">
          {/* Render Sections 1, 2, and 3 */}
          {sections.map((section, idx) => (
            <div key={section.title} className="px-2 mb-2">
              {!isCollapsed ? (
                <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono-data">
                  {section.title}
                </div>
              ) : (
                idx > 0 && <div className="my-2 border-t border-neutral-800/80 mx-2" aria-hidden="true" />
              )}

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isTabActive(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all min-h-[44px] active:scale-95 cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                      } ${
                        isActive
                          ? 'bg-red-600 text-white font-bold shadow-md ring-1 ring-red-500'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-neutral-400'
                        }`}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Section 4: Director & Dispatch */}
          <div className="px-2 pt-2 border-t border-neutral-800">
            {!isCollapsed ? (
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono-data flex items-center justify-between">
                <span>Director & Dispatch</span>
                <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-800/60 font-semibold">
                  HQ
                </span>
              </div>
            ) : (
              <div className="my-2 border-t border-neutral-800/80 mx-2" aria-hidden="true" />
            )}

            {/* Dashboard Primary Tab */}
            <nav className="space-y-1 mb-2">
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                title="Director Dashboard"
                aria-label="Director Dashboard"
                aria-current={currentTab === 'dashboard' ? 'page' : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all min-h-[44px] active:scale-95 cursor-pointer ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  currentTab === 'dashboard'
                    ? 'bg-red-600 text-white font-bold shadow-md ring-1 ring-red-500'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 shrink-0 ${
                    currentTab === 'dashboard' ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                {!isCollapsed && <span>Director Dashboard</span>}
              </button>
            </nav>

            {/* Core Director Quick Actions */}
            <div className="space-y-1.5">
              {onOpenExportHub && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenExportHub('whatsapp');
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs font-bold text-white bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 transition-all active:scale-95 cursor-pointer min-h-[44px] group shadow-sm ${
                    isCollapsed ? 'justify-center p-2' : 'justify-between px-3.5 py-2.5'
                  }`}
                  title="Export & Comms Hub (WhatsApp, Email, Calendar, CSV, Drive)"
                  aria-label="Export & Comms Hub"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-red-400 group-hover:text-red-300 shrink-0" />
                    {!isCollapsed && <span className="text-white">Export & Comms Hub</span>}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">WA</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 font-mono">Mail</span>
                    </div>
                  )}
                </button>
              )}

              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenImportModal();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/50 transition-all active:scale-95 min-h-[44px] shadow-sm cursor-pointer ${
                    isCollapsed ? 'justify-center p-2' : 'justify-between px-3.5 py-2.5'
                  }`}
                  title="Import Weekly Schedule from Google Sheets or Excel"
                  aria-label="Import Weekly Schedule"
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    {!isCollapsed && <span>Import Schedule</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">
                      Sheets
                    </span>
                  )}
                </button>
              )}

              {onOpenEmergencyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenEmergencyModal();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3.5 py-2'
                  }`}
                  title="Emergency Safety EAP & Defibrillator Access"
                  aria-label="Emergency Safety EAP"
                >
                  <Shield className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                  {!isCollapsed && <span>Emergency Safety EAP</span>}
                </button>
              )}

              {/* Secondary Utility Actions */}
              {onOpenPitchCompanion && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPitchCompanion();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3.5 py-2'
                  }`}
                  title="Pitch Companion (Live Timer & Whistle)"
                  aria-label="Pitch Companion"
                >
                  <Clock className="w-4 h-4 text-red-500 shrink-0" />
                  {!isCollapsed && <span>Pitch Companion</span>}
                </button>
              )}

              {onOpenWhatsAppModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenWhatsAppModal();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3.5 py-2'
                  }`}
                  title="Quick WhatsApp Dispatch"
                  aria-label="WhatsApp Dispatch"
                >
                  <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!isCollapsed && <span>WhatsApp Dispatch</span>}
                </button>
              )}

              {onOpenGoogleModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenGoogleModal();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                    isCollapsed ? 'justify-center p-2' : 'justify-between px-3.5 py-2'
                  }`}
                  title="Google Drive Vault & Gmail Integration"
                  aria-label="Google Drive & Gmail"
                >
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
                    {!isCollapsed && <span>Google Drive & Gmail</span>}
                  </div>
                  {!isCollapsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
                      Sync
                    </span>
                  )}
                </button>
              )}

              {onOpenDirectorPack && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDirectorPack();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3.5 py-2'
                  }`}
                  title="Director Master Pack (PIN 1893)"
                  aria-label="Director Master Pack"
                >
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  {!isCollapsed && <span>Director Master Pack</span>}
                </button>
              )}

              {onOpenTacticalAnimator && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTacticalAnimator();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3.5 py-2'
                  }`}
                  title="Tactical Drill Animator (2v1s, press, penalty corners)"
                  aria-label="Tactical Drill Animator"
                >
                  <Play className="w-4 h-4 fill-current text-red-500 shrink-0" />
                  {!isCollapsed && <span>Tactical Drill Animator</span>}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenReport();
                  onCloseMobile();
                }}
                className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                  isCollapsed ? 'justify-center p-2' : 'gap-3 px-3.5 py-2'
                }`}
                title="Monthly Report Export"
                aria-label="Monthly Report Export"
              >
                <FileSpreadsheet className="w-4 h-4 text-neutral-400 shrink-0" />
                {!isCollapsed && <span>Monthly Report Export</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenNotifications();
                  onCloseMobile();
                }}
                className={`w-full flex items-center rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800/60 transition-all active:scale-95 cursor-pointer min-h-[44px] ${
                  isCollapsed ? 'justify-center p-2' : 'justify-between px-3.5 py-2'
                }`}
                title="Pitch Alerts"
                aria-label="Pitch Alerts"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-red-500 shrink-0" />
                  {!isCollapsed && <span>Pitch Alerts</span>}
                </div>
                {unreadNotificationsCount > 0 && (
                  <span
                    className={`rounded-full bg-red-600 text-white font-mono-data text-[10px] font-bold flex items-center justify-center ${
                      isCollapsed ? 'w-2 h-2 absolute top-1 right-1' : 'w-5 h-5'
                    }`}
                  >
                    {!isCollapsed && unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Offline Mode Indicator & Coach Info */}
        <div
          className={`border-t border-neutral-800 bg-neutral-950 shrink-0 ${
            isCollapsed ? 'p-2 space-y-2' : 'p-4 space-y-3'
          }`}
        >
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOnline && !isSimulatingOffline ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="font-semibold text-white text-[11px]">
                    {isSimulatingOffline
                      ? 'Pitch Mode (Offline Sim)'
                      : isOnline
                      ? 'Connected'
                      : 'Offline Field Mode'}
                  </span>
                </div>
                <span className="text-[9px] font-mono-data text-emerald-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                  Cached
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleSimulateOffline}
                className="mt-2 w-full min-h-[44px] py-1 text-[10px] font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all active:scale-95 cursor-pointer border border-neutral-700 flex items-center justify-center"
              >
                {isSimulatingOffline ? 'Switch to Live Online' : 'Simulate Pitch Offline'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleSimulateOffline}
              className="w-full flex items-center justify-center min-h-[44px] p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 transition-all active:scale-95 cursor-pointer"
              title={
                isSimulatingOffline
                  ? 'Pitch Mode Active (Offline)'
                  : 'Online Connected (Click to simulate offline)'
              }
              aria-label="Toggle Offline Simulation"
            >
              {isOnline && !isSimulatingOffline ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Logged in Coach Signature */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center py-1' : 'gap-2.5 px-1'
            } text-xs`}
          >
            <div
              className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-red-500 shrink-0"
              title="Richard Couse · Director of Coaching / Head of Youth"
            >
              RC
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white truncate text-xs">Richard Couse</p>
                <p className="text-[10px] text-neutral-400 truncate">Director of Coaching</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
