import React from 'react';
import {
  Calendar,
  Users,
  Timer,
  BookOpen,
  Menu,
} from 'lucide-react';
import { useAppStore } from '../../store';

export interface BottomNavBarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenPitchCompanion?: () => void;
  onToggleMore?: () => void;
  isSunMode?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab: propCurrentTab,
  onSelectTab: propOnSelectTab,
  onOpenPitchCompanion: propOnOpenPitchCompanion,
  onToggleMore: propOnToggleMore,
  isSunMode: propIsSunMode,
}) => {
  const storeCurrentTab = useAppStore((s) => s.currentTab);
  const storeSetCurrentTab = useAppStore((s) => s.setCurrentTab);
  const storeSetMobileSidebarOpen = useAppStore((s) => s.setMobileSidebarOpen);
  const storeIsSunMode = useAppStore((s) => s.isSunMode);

  const currentTab = propCurrentTab ?? storeCurrentTab;
  const onSelectTab = propOnSelectTab ?? storeSetCurrentTab;
  const onToggleMore = propOnToggleMore ?? (() => storeSetMobileSidebarOpen(true));
  const isSunMode = propIsSunMode ?? storeIsSunMode;

  const handleOpenCompanion = () => {
    if (propOnOpenPitchCompanion) {
      propOnOpenPitchCompanion();
    } else {
      useAppStore.getState().openModal('pitch_companion');
    }
  };

  const isCoachesActive = currentTab === 'availability' || currentTab === 'coaches';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-colors duration-200 select-none pb-[env(safe-area-inset-bottom)] ${
        isSunMode
          ? 'bg-white border-t-2 border-neutral-900 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] text-neutral-900'
          : 'bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] text-neutral-300'
      }`}
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {/* 1. Timetable */}
        <button
          type="button"
          onClick={() => onSelectTab('timetable')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 ${
            currentTab === 'timetable'
              ? isSunMode
                ? 'text-red-700 font-black'
                : 'text-red-500 font-bold'
              : isSunMode
              ? 'text-neutral-700 hover:text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
          aria-label="Sunday Timetable"
          aria-current={currentTab === 'timetable' ? 'page' : undefined}
          title="Sunday Timetable"
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 ${currentTab === 'timetable' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {currentTab === 'timetable' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-1">Timetable</span>
        </button>

        {/* 2. Coaches */}
        <button
          type="button"
          onClick={() => onSelectTab('availability')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 ${
            isCoachesActive
              ? isSunMode
                ? 'text-red-700 font-black'
                : 'text-red-500 font-bold'
              : isSunMode
              ? 'text-neutral-700 hover:text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
          aria-label="Coaches & Availability"
          aria-current={isCoachesActive ? 'page' : undefined}
          title="Coaches & Availability"
        >
          <div className="relative">
            <Users className={`w-5 h-5 ${isCoachesActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isCoachesActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-1">Coaches</span>
        </button>

        {/* 3. Companion (Prominent red accent button / pill) */}
        <div className="flex-1 flex items-center justify-center min-w-[48px]">
          <button
            type="button"
            onClick={handleOpenCompanion}
            className={`min-h-[48px] min-w-[56px] px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
              isSunMode
                ? 'bg-red-600 text-white font-extrabold border-2 border-neutral-950 hover:bg-red-700'
                : 'bg-red-600 text-white font-bold shadow-red-950/50 hover:bg-red-500 ring-1 ring-red-400/40'
            }`}
            aria-label="Open Pitchside Companion (Timer & Whistle)"
            title="Pitchside Companion (Live Timer & Whistle)"
          >
            <Timer className="w-5 h-5 fill-white/20" />
            <span className="text-[10px] font-black tracking-tight leading-tight mt-0.5">Companion</span>
          </button>
        </div>

        {/* 4. Drills */}
        <button
          type="button"
          onClick={() => onSelectTab('drills')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 ${
            currentTab === 'drills'
              ? isSunMode
                ? 'text-red-700 font-black'
                : 'text-red-500 font-bold'
              : isSunMode
              ? 'text-neutral-700 hover:text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
          aria-label="Drill Library"
          aria-current={currentTab === 'drills' ? 'page' : undefined}
          title="Drill Library"
        >
          <div className="relative">
            <BookOpen className={`w-5 h-5 ${currentTab === 'drills' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {currentTab === 'drills' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-600" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-1">Drills</span>
        </button>

        {/* 5. More */}
        <button
          type="button"
          onClick={onToggleMore}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 ${
            isSunMode
              ? 'text-neutral-700 hover:text-neutral-950 font-semibold'
              : 'text-neutral-400 hover:text-white font-medium'
          }`}
          aria-label="Open navigation drawer for more options"
          title="More Sections & Tools"
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] tracking-tight leading-tight mt-1">More</span>
        </button>
      </div>
    </nav>
  );
};
