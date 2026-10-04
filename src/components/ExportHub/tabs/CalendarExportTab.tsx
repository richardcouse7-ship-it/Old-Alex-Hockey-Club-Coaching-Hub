import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { Coach, MatchFixture, PitchSector, SessionSlot } from '../../../types';
import { ExportService } from '../../../services/exportService';

export interface CalendarExportTabProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  fixtures: MatchFixture[];
  selectedDate: string;
  showToast: (msg: string) => void;
}

export const CalendarExportTab: React.FC<CalendarExportTabProps> = ({
  slots,
  coaches,
  sectors,
  fixtures,
  selectedDate,
  showToast,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Sync to Calendar (RFC 5545 iCalendar)</span>
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Download an `.ics` file containing all coaching sessions and pitch sector locations.
          Works seamlessly with <strong>Apple Calendar (iPhone, iPad, Mac)</strong>, <strong>Google Calendar</strong>, and <strong>Microsoft Outlook</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Sunday Pitch Sessions
            </span>
            <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded font-mono">
              {slots.length} Events
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Includes exact time slots, sector allocations (e.g., Pitch 1 North), assigned coaches, and drill topics.
          </p>
          <button
            type="button"
            onClick={() => {
              ExportService.exportSundayCalendarICS(slots, coaches, sectors, selectedDate);
              showToast('Sunday Calendar (.ics) downloaded!');
            }}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Sunday Schedule (.ics)</span>
          </button>
        </div>

        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Match Fixtures & Blitzes
            </span>
            <span className="text-[10px] bg-neutral-850 text-neutral-300 px-2 py-0.5 rounded font-mono">
              {fixtures.length} Fixtures
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Sync pushback times, home/away venues, opposing clubs, and umpire assignments.
          </p>
          <button
            type="button"
            onClick={() => {
              showToast('Fixtures synced in Sunday Schedule export!');
              ExportService.exportFixturesToCSV(fixtures);
            }}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Fixtures Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
