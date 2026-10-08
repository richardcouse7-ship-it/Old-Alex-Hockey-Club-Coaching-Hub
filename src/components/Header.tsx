import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Share2,
  Calendar,
  Wifi,
  WifiOff,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  Download,
  CalendarDays,
  Cloud,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Archive,
} from 'lucide-react';
import { AppNotification } from '../types';
import { SEASON_SUNDAYS } from '../data/seasonCalendar';
import { categorizeSeasonSundays } from '../utils/dateUtils';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onCopyWhatsApp: () => void;
  copiedWhatsApp: boolean;
  unreadNotifications: AppNotification[];
  onOpenNotificationsModal: () => void;
  isOnline: boolean;
  isSimulatingOffline: boolean;
  onOpenPitchCompanion?: () => void;
  onOpenExportHub?: () => void;
  onOpenCalendarManager?: () => void;
  onOpenEmergencyModal?: () => void;
  onOpenGoogleModal?: () => void;
  isSunMode?: boolean;
  onToggleSunMode?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  selectedDate,
  onChangeDate,
  onCopyWhatsApp,
  copiedWhatsApp,
  unreadNotifications,
  onOpenNotificationsModal,
  isOnline,
  isSimulatingOffline,
  onOpenPitchCompanion,
  onOpenExportHub,
  onOpenCalendarManager,
  onOpenEmergencyModal,
  onOpenGoogleModal,
  isSunMode = false,
  onToggleSunMode,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Stepper logic for previous/next week
  const handleStepWeek = (deltaDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    const newDateStr = current.toISOString().split('T')[0];
    onChangeDate(newDateStr);
  };

  const { upcomingSundays, pastSundays, currentWeekSundayISO } = categorizeSeasonSundays();
  const isPastArchivedDate = selectedDate < currentWeekSundayISO;

  return (
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* Left Slot: Mobile Menu Trigger + Club Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-neutral-300 hover:text-white rounded-xl hover:bg-neutral-900 active:scale-95 transition-all focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 border border-neutral-800 transition-all active:scale-95"
            title={isSidebarCollapsed ? 'Expand Sidebar (256px)' : 'Collapse Sidebar to Icons (72px)'}
            aria-label="Toggle sidebar collapse"
          >
            {isSidebarCollapsed ? <PanelLeft className="w-4 h-4 text-red-500" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        {/* Date Selector & Calendar Controls */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-750 px-2 py-1 rounded-xl text-xs">
          {/* Previous Week */}
          <button
            type="button"
            onClick={() => handleStepWeek(-7)}
            className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-all active:scale-95"
            title="Previous Week (-7 days)"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0 ml-0.5" />

          {/* Full Season Sunday Dropdown with Optgroups */}
          <select
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="bg-transparent text-white font-semibold cursor-pointer focus:outline-none max-w-[140px] sm:max-w-[180px] truncate"
            aria-label="Select Sunday"
          >
            <optgroup label="Active & Upcoming Sundays" className="bg-neutral-900 text-neutral-300 font-bold">
              {upcomingSundays.map((sun) => (
                <option key={sun.date} value={sun.date} className="bg-neutral-900 text-white font-normal">
                  {sun.date === currentWeekSundayISO ? `${sun.label} (This Sunday)` : sun.label}
                </option>
              ))}
            </optgroup>

            {pastSundays.length > 0 && (
              <optgroup label="Past Sundays (Archived History)" className="bg-neutral-900 text-amber-400 font-bold">
                {pastSundays.map((sun) => (
                  <option key={sun.date} value={sun.date} className="bg-neutral-900 text-neutral-400 font-normal">
                    {sun.label} (Archived)
                  </option>
                ))}
              </optgroup>
            )}

            {/* If user selected a custom date not in SEASON_SUNDAYS */}
            {!SEASON_SUNDAYS.some((s) => s.date === selectedDate) && (
              <optgroup label="Custom Dates" className="bg-neutral-900 text-neutral-300 font-bold">
                <option value={selectedDate} className="bg-neutral-900 text-white font-normal">
                  {selectedDate} (Custom Date)
                </option>
              </optgroup>
            )}
          </select>

          {/* Next Week */}
          <button
            type="button"
            onClick={() => handleStepWeek(7)}
            className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-all active:scale-95"
            title="Next Week (+7 days)"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Open Calendar Manager Modal */}
          {onOpenCalendarManager && (
            <button
              type="button"
              onClick={onOpenCalendarManager}
              className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center p-1 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-all active:scale-95 ml-0.5"
              title="Open Calendar Manager & Timetable Cloning"
              aria-label="Open Calendar Manager"
            >
              <CalendarDays className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>

        {/* Ambient Archive View Badge */}
        {isPastArchivedDate && (
          <span
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[11px] font-medium"
            title="Viewing historical session data. Past sessions remain permanently archived."
          >
            <Archive className="w-3 h-3 text-amber-400" />
            Archive View
          </span>
        )}
      </div>

      {/* Right Slot: Offline Status + WhatsApp Quick Copy + Notification Bell */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono-data text-neutral-300">
          {isOnline && !isSimulatingOffline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white">Online</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-300">Offline Field Mode</span>
            </>
          )}
        </div>

        {onOpenEmergencyModal && (
          <button
            type="button"
            onClick={onOpenEmergencyModal}
            className="min-h-[44px] px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 hover:text-white"
            title="Emergency Fast-Dial & Defibrillator Protocol"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="hidden sm:inline">Emergency</span>
          </button>
        )}

        {onOpenPitchCompanion && (
          <button
            type="button"
            onClick={onOpenPitchCompanion}
            className="min-h-[44px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white hover:border-red-500"
            title="Open Pitch-Side Live Timer with whistle alerts"
          >
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Pitch Clock</span>
          </button>
        )}

        {onOpenExportHub && (
          <button
            type="button"
            onClick={onOpenExportHub}
            className="min-h-[44px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white hover:border-red-500"
            title="Open Export & Communications Hub (WhatsApp, Email, Calendar, CSV, Backup)"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">Export Hub</span>
          </button>
        )}

        {onOpenGoogleModal && (
          <button
            type="button"
            onClick={onOpenGoogleModal}
            className="min-h-[44px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-sky-400 hover:text-white"
            title="Google Drive Vault & Gmail Sync for Richard Couse"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Google Sync</span>
          </button>
        )}

        {/* 1-Tap Sun Mode / Night Mode Toggle */}
        {onToggleSunMode && (
          <button
            type="button"
            onClick={onToggleSunMode}
            className={`min-h-[44px] px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border ${
              isSunMode
                ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-750 text-amber-400 hover:text-amber-300'
            }`}
            title={isSunMode ? 'Switch to Dark Mode' : 'Switch to High-Contrast Sun Mode (Pitchside Daylight)'}
          >
            {isSunMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-800" />
                <span className="hidden sm:inline">Night Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sun Mode</span>
              </>
            )}
          </button>
        )}

        {/* WhatsApp Export button */}
        <button
          type="button"
          onClick={onCopyWhatsApp}
          className={`min-h-[44px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            copiedWhatsApp
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white'
          }`}
          title="Copy timetable for WhatsApp sharing"
        >
          {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="hidden sm:inline">
            {copiedWhatsApp ? 'Copied WhatsApp!' : 'WhatsApp'}
          </span>
        </button>

        {/* Notifications Icon with popover/modal trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={onOpenNotificationsModal}
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 hover:text-white transition-all active:scale-95"
            title="Pitch & Schedule Alerts"
          >
            <Bell className="w-4 h-4 text-red-500" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono-data text-[9px] font-bold flex items-center justify-center ring-2 ring-black">
                {unreadNotifications.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
