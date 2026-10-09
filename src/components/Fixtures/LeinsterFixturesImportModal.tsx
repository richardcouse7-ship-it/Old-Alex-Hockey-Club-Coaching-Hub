import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Filter,
  Search,
  Check,
  RotateCcw,
  Layers,
  ChevronDown,
  Info,
  Link,
  ClipboardPaste,
  Loader2,
} from 'lucide-react';
import { AgeGroup, MatchFixture } from '../../types';
import {
  parseLeinsterFixturesCSV,
  SAMPLE_LEINSTER_SEASON_CSV,
  LeinsterParsedRow,
  fetchGoogleSheetContent,
  GoogleSheetTab,
} from '../../utils/leinsterFixturesParser';
import {
  GoogleSheetSyncService,
  DEFAULT_INTER_SHEET_URL,
  DEFAULT_INTER_GID,
  PRIMARY_OLD_ALEX_TABS,
} from '../../services/googleSheetSyncService';

interface LeinsterFixturesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    fixtures: MatchFixture[],
    mode: 'replace' | 'merge'
  ) => { importedCount: number; updatedCount: number; totalCount: number };
}

const AGE_GROUPS: AgeGroup[] = [
  'Inters',
  'Minors',
  '1st Years',
  '6th Class',
  '5th Class',
  '4th Class',
  '3rd Class',
  '2nd Class',
  '1st Class',
  'PEN',
];

export const LeinsterFixturesImportModal: React.FC<LeinsterFixturesImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'sheet_link' | 'paste' | 'file'>('sheet_link');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    return GoogleSheetSyncService.getLinkedSheetUrl() || DEFAULT_INTER_SHEET_URL;
  });
  const [discoveredTabs, setDiscoveredTabs] = useState<GoogleSheetTab[]>(() => PRIMARY_OLD_ALEX_TABS);
  const [selectedTabGid, setSelectedTabGid] = useState<string>(() => {
    return GoogleSheetSyncService.getLinkedTabGid() || DEFAULT_INTER_GID;
  });
  const [pastedRawText, setPastedRawText] = useState<string>('');
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Editable overrides per row index: { [rowIndex]: Partial<LeinsterParsedRow> }
  const [rowOverrides, setRowOverrides] = useState<
    Record<number, { trainingGroup?: AgeGroup; rankedTeam?: string; isSelected?: boolean }>
  >({});

  // Parse result memoized
  const parseResult = useMemo(() => {
    if (!fileContent.trim()) {
      return {
        fixtures: [],
        rows: [],
        totalRows: 0,
        validCount: 0,
        errorCount: 0,
        errors: [],
        trainingGroupBreakdown: {},
        rankedTeamBreakdown: {},
        dateRange: null,
        homeCount: 0,
        awayCount: 0,
      };
    }
    return parseLeinsterFixturesCSV(fileContent);
  }, [fileContent]);

  // Reset overrides when new file is loaded
  const handleLoadContent = (text: string, name: string) => {
    setFileContent(text);
    setFileName(name);
    setRowOverrides({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleLoadContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleLoadContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleLoadContent(SAMPLE_LEINSTER_SEASON_CSV, 'leinster_season_fixtures_sample.csv');
  };

  const handleFetchSheet = async () => {
    if (!googleSheetUrl.trim()) {
      setFetchError('Please enter a Google Sheets URL or spreadsheet ID.');
      return;
    }
    setFetchError(null);
    setIsFetchingSheet(true);
    try {
      GoogleSheetSyncService.setLinkedSheetUrl(googleSheetUrl);
      const result = await fetchGoogleSheetContent(googleSheetUrl, selectedTabGid);
      if (result.discoveredTabs.length > 0) {
        setDiscoveredTabs(result.discoveredTabs);
      }
      if (result.sheetName) {
        const found = result.discoveredTabs.find((t) => t.name === result.sheetName);
        if (found) {
          setSelectedTabGid(found.gid);
          GoogleSheetSyncService.setLinkedTabGid(found.gid);
        }
      }
      handleLoadContent(
        result.csvText,
        result.sheetName ? `Google Sheet (${result.sheetName})` : 'Google Sheet'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  useEffect(() => {
    if (isOpen && !fileContent && activeTab === 'sheet_link') {
      handleFetchSheet();
    }
  }, [isOpen]);

  const handleSelectTab = async (gid: string) => {
    setSelectedTabGid(gid);
    GoogleSheetSyncService.setLinkedTabGid(gid);
    setFetchError(null);
    setIsFetchingSheet(true);
    try {
      const result = await fetchGoogleSheetContent(googleSheetUrl, gid);
      const tab = discoveredTabs.find((t) => t.gid === gid);
      handleLoadContent(
        result.csvText,
        tab ? `Google Sheet (${tab.name})` : `Google Sheet (${result.sheetName || 'Tab'})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleApplyPastedText = () => {
    if (!pastedRawText.trim()) {
      setFetchError('Please paste your Google Sheets rows into the box above.');
      return;
    }
    setFetchError(null);
    handleLoadContent(pastedRawText, 'Pasted Google Sheets Data');
  };

  // Row override handlers
  const handleUpdateRowGroup = (idx: number, group: AgeGroup) => {
    const currentRank = rowOverrides[idx]?.rankedTeam || parseResult.rows[idx]?.rankedTeam;
    // Derive new ranked team prefix if changing group
    const letter = currentRank?.match(/\b([A-E])\b/i)?.[1] || 'A';
    const prefixMap: Record<AgeGroup, string> = {
      Inters: 'Inter',
      Minors: 'Minor',
      '1st Years': '1st Year',
      '6th Class': '6th Class',
      '5th Class': '5th Class',
      '4th Class': '4th Class',
      '3rd Class': '3rd Class',
      '2nd Class': '2nd Class',
      '1st Class': '1st Class',
      PEN: 'PEN',
    };
    const newRankedTeam = `${prefixMap[group]} ${letter.toUpperCase()}`;

    setRowOverrides((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        trainingGroup: group,
        rankedTeam: newRankedTeam,
      },
    }));
  };

  const handleUpdateRowRankedTeam = (idx: number, team: string) => {
    setRowOverrides((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        rankedTeam: team.trim(),
      },
    }));
  };

  const handleToggleRowSelect = (idx: number) => {
    setRowOverrides((prev) => {
      const currentSelected = prev[idx]?.isSelected !== undefined ? prev[idx]?.isSelected : true;
      return {
        ...prev,
        [idx]: {
          ...prev[idx],
          isSelected: !currentSelected,
        },
      };
    });
  };

  const handleSelectAll = (select: boolean) => {
    const updated: Record<number, { isSelected: boolean }> = {};
    parseResult.rows.forEach((_, idx) => {
      updated[idx] = { ...rowOverrides[idx], isSelected: select };
    });
    setRowOverrides((prev) => ({ ...prev, ...updated }));
  };

  // Compile final fixtures based on parsed rows + overrides
  const effectiveRows = useMemo(() => {
    return parseResult.rows.map((row, idx) => {
      const overrides = rowOverrides[idx];
      const trainingGroup = overrides?.trainingGroup || row.trainingGroup;
      const rankedTeam = overrides?.rankedTeam || row.rankedTeam;
      const isSelected = overrides?.isSelected !== undefined ? overrides.isSelected : true;

      return {
        ...row,
        trainingGroup,
        rankedTeam,
        isSelected,
        originalIndex: idx,
      };
    });
  }, [parseResult.rows, rowOverrides]);

  const filteredRows = useMemo(() => {
    return effectiveRows.filter((row) => {
      if (selectedGroupFilter !== 'ALL' && row.trainingGroup !== selectedGroupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.rankedTeam.toLowerCase().includes(q) ||
          row.opposition.toLowerCase().includes(q) ||
          row.competition.toLowerCase().includes(q) ||
          row.resolvedVenue.toLowerCase().includes(q) ||
          row.normalizedDate.includes(q)
        );
      }
      return true;
    });
  }, [effectiveRows, selectedGroupFilter, searchQuery]);

  const selectedCount = effectiveRows.filter((r) => r.isSelected).length;

  const handleConfirmImport = () => {
    const fixturesToImport: MatchFixture[] = effectiveRows
      .filter((r) => r.isSelected)
      .map((r, idx) => ({
        id: `fix-leinster-${r.normalizedDate}-${r.rankedTeam.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}-${Date.now().toString(36)}`,
        date: r.normalizedDate,
        pushbackTime: r.normalizedTime,
        ageGroupOrTeam: r.rankedTeam,
        competition: r.competition,
        opposition: r.opposition,
        isHome: r.isHome,
        venue: r.resolvedVenue,
        pitchSectorId: r.isHome ? 'p1n' : undefined,
        leadCoachOrManager: r.leadCoach,
        umpires: r.umpires,
        notes: r.notes,
        status: 'Scheduled',
        trainingGroup: r.trainingGroup,
        rankedTeam: r.rankedTeam,
        round: r.round,
      }));

    GoogleSheetSyncService.setLastSyncTimestamp(new Date().toISOString());
    if (googleSheetUrl.trim()) GoogleSheetSyncService.setLinkedSheetUrl(googleSheetUrl.trim());
    if (selectedTabGid) GoogleSheetSyncService.setLinkedTabGid(selectedTabGid);
    onImport(fixturesToImport, importMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Leinster Hockey & Google Sheets
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">Fixtures Importer</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Import Season Fixtures (Google Sheets / CSV)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tab Selector & Import Container */}
          <div className="bg-black/30 border border-neutral-750 rounded-2xl overflow-hidden shadow-lg">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-neutral-800 bg-neutral-900/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sheet_link');
                  setFetchError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'sheet_link'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Link className="w-4 h-4" />
                <span>Google Sheets Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('paste');
                  setFetchError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'paste'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Paste from Sheet (Ctrl+V)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('file');
                  setFetchError(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'file'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload CSV / File</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-5">
              {activeTab === 'sheet_link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Google Sheets Share URL or Spreadsheet ID
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          value={googleSheetUrl}
                          onChange={(e) => {
                            setGoogleSheetUrl(e.target.value);
                            setFetchError(null);
                          }}
                          placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-red-500 rounded-xl text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleFetchSheet}
                        disabled={isFetchingSheet}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
                      >
                        {isFetchingSheet ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <Link className="w-4 h-4" />
                            <span>Fetch Fixtures</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {discoveredTabs.length > 0 && (
                    <div className="p-3 bg-neutral-900 border border-neutral-750 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-neutral-200 font-semibold">Sheet Tab to Import:</span>
                      </div>
                      <select
                        value={selectedTabGid}
                        onChange={(e) => handleSelectTab(e.target.value)}
                        disabled={isFetchingSheet}
                        className="bg-neutral-950 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-500 font-medium cursor-pointer"
                      >
                        {discoveredTabs.map((t) => (
                          <option key={t.gid} value={t.gid}>
                            {t.name} {t.name.toLowerCase() === 'old alex' ? '★ (All 5 Inter Teams Consolidated)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-start gap-2.5 text-xs text-neutral-400">
                    <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p>
                        <strong className="text-neutral-200">Tip:</strong> In Google Sheets, make sure general access is set to{' '}
                        <strong className="text-white">"Anyone with the link can view"</strong> (File → Share).
                      </p>
                      <p className="mt-0.5 text-neutral-500">
                        If your sheet is strictly private or login-restricted, simply switch to the{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('paste')}
                          className="text-red-400 underline hover:text-red-300"
                        >
                          Paste from Sheet
                        </button>{' '}
                        tab to paste the rows directly without changing share permissions!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'paste' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Copy & Paste Rows Directly from Google Sheets or Excel
                    </label>
                    <textarea
                      rows={6}
                      value={pastedRawText}
                      onChange={(e) => {
                        setPastedRawText(e.target.value);
                        setFetchError(null);
                      }}
                      placeholder={`1. Open your Google Sheet
2. Highlight the fixture rows (or press Ctrl+A)
3. Press Ctrl+C to copy
4. Paste (Ctrl+V) right here...

Example columns: Date, Time, Team (Inter A - E), Opponent, Venue, Home/Away`}
                      className="w-full p-3 bg-neutral-950 border border-neutral-750 focus:border-red-500 rounded-xl text-xs font-mono text-white placeholder-neutral-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleApplyPastedText}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      <span>Parse Pasted Fixtures</span>
                    </button>
                    {pastedRawText.trim() && (
                      <span className="text-xs text-neutral-400 font-mono">
                        {pastedRawText.split('\n').filter((l) => l.trim()).length} lines detected
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'file' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging
                      ? 'border-red-500 bg-red-950/20'
                      : 'border-neutral-750 hover:border-neutral-600 bg-black/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="p-3 bg-neutral-800 rounded-full text-red-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Drop downloaded Google Sheets CSV / TSV file here
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        In Google Sheets: File → Download → Comma Separated Values (.csv)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-red-500" />
                      <span>Browse File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status / Errors */}
              {fetchError && (
                <div className="mt-3 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Import Note:</strong>
                    <span>{fetchError}</span>
                  </div>
                </div>
              )}

              {fileName && parseResult.validCount > 0 && (
                <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Successfully loaded <strong>{fileName}</strong>: Found{' '}
                      <strong>{parseResult.validCount} valid fixtures</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileContent('');
                      setFileName('');
                      setGoogleSheetUrl('');
                      setPastedRawText('');
                    }}
                    className="text-neutral-400 hover:text-white underline text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Sample loader footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/80 text-xs">
                <span className="text-neutral-500 text-[11px]">
                  Supports multi-ranked squads (Inter A–E, Minor A–C, 1st Year A–D, 6th Class A–C)
                </span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-[11px] font-semibold border border-red-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  <span>Load Sample Season CSV (30 Matches)</span>
                </button>
              </div>
            </div>
          </div>

          {/* If Parsed: Overview Banner & Breakdown */}
          {parseResult.validCount > 0 && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-black/40 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Matches Found</span>
                  <span className="text-xl font-bold text-white mt-0.5 block">{parseResult.validCount}</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    {parseResult.homeCount} Home / {parseResult.awayCount} Away
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Season Timeline</span>
                  <span className="text-xs font-bold text-white mt-1 block truncate">
                    {parseResult.dateRange ? `${parseResult.dateRange.start} → ${parseResult.dateRange.end}` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">Autumn 2026 – Spring 2027</span>
                </div>

                <div className="p-3.5 bg-black/40 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Training Groups</span>
                  <span className="text-xl font-bold text-red-400 mt-0.5 block">
                    {Object.keys(parseResult.trainingGroupBreakdown).length}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5 truncate">
                    {Object.keys(parseResult.trainingGroupBreakdown).join(', ')}
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 border border-neutral-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Ranked Teams</span>
                  <span className="text-xl font-bold text-amber-400 mt-0.5 block">
                    {Object.keys(parseResult.rankedTeamBreakdown).length}
                  </span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Squads configured</span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white">Import Strategy:</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-red-600 focus:ring-red-500 bg-neutral-800"
                    />
                    <span>
                      <strong className="text-white">Merge & Deduplicate</strong> (Keep existing results/notes)
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer ml-3">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-red-600 focus:ring-red-500 bg-neutral-800"
                    />
                    <span>
                      <strong className="text-white">Replace All</strong> (Clean season refresh)
                    </span>
                  </label>
                </div>
              </div>

              {/* Filter Strip & Ranked Teams Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400">
                  <span>Filter by Training Group & Ranked Teams:</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Select All
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="text-neutral-400 hover:text-white underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedGroupFilter('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedGroupFilter === 'ALL'
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    All Groups ({effectiveRows.length})
                  </button>
                  {Object.entries(parseResult.trainingGroupBreakdown).map(([group, count]) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setSelectedGroupFilter(group)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        selectedGroupFilter === group
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-neutral-900 border-neutral-750 text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      {group} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Quick Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by team, opponent, venue, or division..."
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-750 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Interactive Preview Table */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">Inc</th>
                        <th className="p-3 w-28">Date / Time</th>
                        <th className="p-3 w-36">Training Group</th>
                        <th className="p-3 w-40">Ranked Team</th>
                        <th className="p-3">Matchup & Division</th>
                        <th className="p-3 w-48">Venue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.originalIndex}
                          className={`hover:bg-neutral-900/60 transition-colors ${
                            !row.isSelected ? 'opacity-40 bg-black/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.isSelected}
                              onChange={() => handleToggleRowSelect(row.originalIndex)}
                              className="rounded text-red-600 focus:ring-red-500 bg-neutral-800 border-neutral-700"
                            />
                          </td>

                          {/* Date & Time */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-mono-data font-bold text-white">{row.normalizedDate}</div>
                            <div className="text-[10px] text-neutral-400">{row.normalizedTime} pushback</div>
                          </td>

                          {/* Training Group Dropdown */}
                          <td className="p-3">
                            <select
                              value={row.trainingGroup}
                              onChange={(e) =>
                                handleUpdateRowGroup(row.originalIndex, e.target.value as AgeGroup)
                              }
                              className="bg-neutral-850 border border-neutral-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-red-500 w-full"
                            >
                              {AGE_GROUPS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Ranked Team */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={row.rankedTeam}
                              onChange={(e) =>
                                handleUpdateRowRankedTeam(row.originalIndex, e.target.value)
                              }
                              className="bg-neutral-850 border border-neutral-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-red-500 w-full font-semibold"
                            />
                          </td>

                          {/* Matchup & Division */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  row.isHome
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                }`}
                              >
                                {row.isHome ? 'HOME' : 'AWAY'}
                              </span>
                              <span className="font-bold text-white">vs {row.opposition}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 block mt-0.5 truncate">
                              {row.competition} {row.round ? `· ${row.round}` : ''}
                            </span>
                          </td>

                          {/* Venue */}
                          <td className="p-3">
                            <span className="text-neutral-300 truncate block">{row.resolvedVenue}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Any parsing errors */}
          {parseResult.errorCount > 0 && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-100 font-bold mb-1">
                  Parsing Warnings ({parseResult.errorCount} skipped):
                </strong>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-300/90 max-h-24 overflow-y-auto">
                  {parseResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-neutral-800 bg-black/60 flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-400">
            {parseResult.validCount > 0 ? (
              <span>
                Ready to import <strong className="text-white">{selectedCount}</strong> matches across{' '}
                <strong className="text-white">{Object.keys(parseResult.trainingGroupBreakdown).length}</strong>{' '}
                training groups
              </span>
            ) : (
              <span>Upload or select a Leinster Hockey fixture spreadsheet to preview</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {activeTab === 'sheet_link' && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsFetchingSheet(true);
                    const summary = await GoogleSheetSyncService.syncAllOldAlexTabs(
                      googleSheetUrl,
                      importMode
                    );
                    onImport(summary.fixtures, importMode);
                    onClose();
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setFetchError(msg);
                  } finally {
                    setIsFetchingSheet(false);
                  }
                }}
                disabled={isFetchingSheet}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Sync all 4 official Old Alex squads (Inters, Minors, 1st Years, 6th Class)"
              >
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>Import All Squads (119 Fixtures)</span>
              </button>
            )}
            <button
              type="button"
              disabled={selectedCount === 0 || isFetchingSheet}
              onClick={handleConfirmImport}
              className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                selectedCount > 0 && !isFetchingSheet
                  ? 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Import {selectedCount} Fixtures</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
