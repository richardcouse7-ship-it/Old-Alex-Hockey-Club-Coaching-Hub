import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Info,
  Layers,
  ArrowRight,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Coach, MatchFixture, PitchSector, SessionSlot } from '../../types';
import {
  parseSpreadsheetSchedule,
  SAMPLE_WEEKLY_SPREADSHEET_TEXT,
  ParseScheduleResult,
} from '../../utils/scheduleImportParser';

interface ScheduleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  existingCoaches: Coach[];
  sectors: PitchSector[];
  onApplySchedule: (result: {
    slots: SessionSlot[];
    newCoaches: Coach[];
    fixtures: MatchFixture[];
    targetDate: string;
    mode: 'replace' | 'merge';
    floatNotes?: string;
  }) => void;
}

export const ScheduleImportModal: React.FC<ScheduleImportModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  existingCoaches,
  sectors,
  onApplySchedule,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(selectedDate);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  // Parse whenever input text or target date changes
  const parseResult: ParseScheduleResult = useMemo(() => {
    if (!inputText.trim()) {
      return {
        rows: [],
        floats: [],
        newCoaches: [],
        slots: [],
        fixtures: [],
        rawLineCount: 0,
        parseErrors: [],
      };
    }
    return parseSpreadsheetSchedule(inputText, existingCoaches, targetDate);
  }, [inputText, existingCoaches, targetDate]);

  // Auto-sync targetDate if a date column is detected in the spreadsheet
  React.useEffect(() => {
    if (parseResult.detectedDate && parseResult.detectedDate !== targetDate) {
      setTargetDate(parseResult.detectedDate);
    }
  }, [parseResult.detectedDate]);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setInputText(SAMPLE_WEEKLY_SPREADSHEET_TEXT);
    setTargetDate('2026-10-04');
    setActiveTab('preview');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setActiveTab('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parseResult.slots.length === 0) return;

    let floatNotes: string | undefined = undefined;
    if (parseResult.floats.length > 0) {
      floatNotes = parseResult.floats
        .map((f) => `${f.time} Floats: ${f.coachNames.join(', ')}`)
        .join(' | ');
    }

    onApplySchedule({
      slots: parseResult.slots,
      newCoaches: parseResult.newCoaches,
      fixtures: parseResult.fixtures,
      targetDate,
      mode: importMode,
      floatNotes,
    });
    onClose();
  };

  const sectorMap = new Map<string, PitchSector>();
  sectors.forEach((s) => sectorMap.set(s.id, s));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data tracking-wider uppercase bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                  Spreadsheet Sync
                </span>
                <span className="text-xs text-neutral-400">Google Sheets · Excel · CSV</span>
              </div>
              <h2 id="import-modal-title" className="text-xl font-bold text-white tracking-tight mt-0.5">
                Import Weekly Schedule
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close spreadsheet import modal"
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Settings Bar */}
        <div className="p-4 bg-neutral-950/50 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Load Screenshot Master */}
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Preload the exact 15 rows from your uploaded spreadsheet screenshot"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Screenshot Master</span>
            </button>

            {/* File Upload Button */}
            <label className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
              <Upload className="w-3.5 h-3.5 text-neutral-400" />
              <span>Upload CSV / TSV</span>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="px-2.5 py-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Target Date & Mode */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-700">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span className="text-neutral-400 font-medium">Apply To:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              />
              {parseResult.detectedDate && (
                <span className="text-[10px] font-bold bg-emerald-950/80 border border-emerald-600/70 text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ml-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Auto-Detected</span>
                </span>
              )}
            </div>

            <div className="flex items-center bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-700">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  importMode === 'replace'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Wipe existing slots for this date and replace with imported sheet"
              >
                Replace Day
              </button>
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  importMode === 'merge'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Keep existing slots and append new imported slots"
              >
                Merge / Append
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Paste Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="spreadsheet-paste-textarea" className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <span>Spreadsheet Data (Copy cells from Google Sheets / Excel and Paste here)</span>
              </label>
              {parseResult.rows.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-data text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                    ✓ {parseResult.rows.length} Sessions Parsed
                  </span>
                  {parseResult.fixtures.length > 0 && (
                    <span className="text-[11px] font-mono-data text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
                      ⚽ {parseResult.fixtures.length} Fixtures
                    </span>
                  )}
                  {parseResult.newCoaches.length > 0 && (
                    <span className="text-[11px] font-mono-data text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                      👥 +{parseResult.newCoaches.length} New Coaches
                    </span>
                  )}
                </div>
              )}
            </div>

            <textarea
              id="spreadsheet-paste-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste cells directly from Google Sheets or Excel here (Ctrl+V)...
Example:
Inter A    Home match v Railway    Richard Couse    Ben McInerney    9:30    11:00
6th Class  Home Training Water     Ben McInerney    Brian Delahunty  12:00   13:15
1st Class  Home Training           Megan Marshall   Grace MacAllister 12:00  13:00"
              rows={inputText ? 4 : 5}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl p-3 text-xs text-neutral-200 font-mono focus:outline-none transition-all placeholder:text-neutral-600"
            />
          </div>

          {/* New Coaches Alert */}
          {parseResult.newCoaches.length > 0 && (
            <div className="p-3 bg-neutral-950 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-amber-300">
                  {parseResult.newCoaches.length} New Coaches / Volunteers Detected:
                </span>{' '}
                <span className="text-neutral-300">
                  {parseResult.newCoaches.map((c) => c.name).join(', ')}.
                </span>{' '}
                <span className="text-neutral-400">
                  These will be automatically added to your club coaching directory with profile cards and badge initials.
                </span>
              </div>
            </div>
          )}

          {/* Floats Alert */}
          {parseResult.floats.length > 0 && (
            <div className="p-3 bg-neutral-950 border border-blue-500/30 rounded-xl flex items-start gap-2.5">
              <Users className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-blue-300">Float / Standby Coaches Detected:</span>{' '}
                {parseResult.floats.map((f, i) => (
                  <span key={i} className="text-neutral-300 font-medium">
                    {f.time} Floats ({f.coachNames.join(', ')})
                  </span>
                ))}
                <span className="text-neutral-400 ml-1.5">
                  — Will be logged in Sunday master notes and coach availability.
                </span>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parseResult.rows.length > 0 ? (
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
              <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Timetable Preview ({parseResult.rows.length} Sessions)
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Review the mapped schedule before applying
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] uppercase tracking-wider text-neutral-400">
                      <th className="p-2.5 font-semibold">Team / Age Group</th>
                      <th className="p-2.5 font-semibold">Venue / Match</th>
                      <th className="p-2.5 font-semibold">Time Slot</th>
                      <th className="p-2.5 font-semibold">Pitch Sector</th>
                      <th className="p-2.5 font-semibold">Assigned Coaches / Umpires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {parseResult.rows.map((row, idx) => {
                      const sector = sectorMap.get(row.pitchSectorId);
                      return (
                        <tr key={idx} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="p-2.5 font-medium text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{row.rawTeam}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                {row.ageGroupId}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-neutral-300">
                            <div className="flex items-center gap-1.5">
                              {row.isMatch && (
                                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span className={row.isMatch ? 'text-amber-200 font-medium' : ''}>
                                {row.rawVenue}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono-data text-neutral-200 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-red-400" />
                              <span>{row.timeSlot}</span>
                              <span className="text-[10px] text-neutral-300 ml-1">
                                ({row.durationMins}m)
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-neutral-300 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-300" />
                              <span>{sector?.name || 'Pitch 1 North'}</span>
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap items-center gap-1">
                              {row.assignedCoachNames.map((name, cIdx) => {
                                const isNew = parseResult.newCoaches.some(
                                  (nc) => nc.name.toLowerCase() === name.toLowerCase()
                                );
                                return (
                                  <span
                                    key={cIdx}
                                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                      isNew
                                        ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                                    }`}
                                  >
                                    <span>{name}</span>
                                    {isNew && (
                                      <span className="text-[9px] font-bold text-amber-400 uppercase">
                                        NEW
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-500">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-neutral-650 mb-2" />
              <p className="text-sm font-semibold text-neutral-400">
                No schedule data entered yet
              </p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                Copy and paste your table from Google Sheets or Excel above, or click{' '}
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-red-400 underline hover:text-red-300 font-semibold"
                >
                  Load Screenshot Master
                </button>{' '}
                to try the sample schedule.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            {parseResult.rows.length > 0 ? (
              <span>
                Ready to update{' '}
                <strong className="text-white">
                  {new Date(targetDate).toLocaleDateString('en-IE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </strong>{' '}
                ({importMode === 'replace' ? 'Wiping & Replacing' : 'Merging'} with{' '}
                {parseResult.slots.length} sessions and {parseResult.fixtures.length} fixtures).
              </span>
            ) : (
              <span>Paste table data to preview</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-xl transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={parseResult.slots.length === 0}
              onClick={handleConfirmImport}
              className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Apply Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleImportModal;
