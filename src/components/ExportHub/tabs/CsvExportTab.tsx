import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Coach, CoachAvailability, Drill, MatchFixture, PitchSector, SessionSlot } from '../../../types';
import { ExportService } from '../../../services/exportService';

export interface CsvExportTabProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  fixtures: MatchFixture[];
  availability: CoachAvailability[];
  selectedDate: string;
  showToast: (msg: string) => void;
}

export const CsvExportTab: React.FC<CsvExportTabProps> = ({
  slots,
  coaches,
  sectors,
  drills,
  fixtures,
  availability,
  selectedDate,
  showToast,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>One-Click CSV Spreadsheet Exports</span>
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Export structured data compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Sunday Timetable CSV */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Sunday Master Timetable
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              Full breakdown of times, pitch sectors, age groups, coaches, session objectives, and attached drills.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              ExportService.exportTimetableToCSV(slots, coaches, sectors, drills, selectedDate);
              showToast('Sunday Timetable CSV exported!');
            }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Timetable (.csv)</span>
          </button>
        </div>

        {/* 2. Coach Roster CSV */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Coach Roster & Contacts
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              Complete coaching directory with phone numbers, emails, coaching roles, and Sunday availability status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              ExportService.exportCoachesToCSV(coaches, availability);
              showToast('Coach Roster CSV exported!');
            }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Coach Roster (.csv)</span>
          </button>
        </div>

        {/* 3. Match Fixtures CSV */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Matches & Fixtures
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              League matches, friendly blitzes, pushback times, venues, and umpire designations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              ExportService.exportFixturesToCSV(fixtures);
              showToast('Match Fixtures CSV exported!');
            }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Fixtures (.csv)</span>
          </button>
        </div>

        {/* 4. Drill Library Catalog CSV */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Old Alex Drill Catalog
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              All {drills.length} drills with skill focus, duration, target age groups, equipment, and coaching points.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              ExportService.exportDrillsToCSV(drills);
              showToast('Drill Library CSV exported!');
            }}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Drill Catalog (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
