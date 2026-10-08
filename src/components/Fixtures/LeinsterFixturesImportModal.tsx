import React, { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { AgeGroup, MatchFixture } from '../../types';
import {
  parseLeinsterFixturesCSV,
  SAMPLE_LEINSTER_SEASON_CSV,
  LeinsterParsedRow,
} from '../../utils/leinsterFixturesParser';

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
                  Leinster Hockey Association
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">Annual Season Importer</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Import Year's Fixtures from Leinster Hockey
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
          {/* File Upload / Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? 'border-red-500 bg-red-950/20'
                : 'border-neutral-750 hover:border-neutral-600 bg-black/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-neutral-800 rounded-full text-red-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {fileName ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Loaded: {fileName}
                    </span>
                  ) : (
                    'Select or drag & drop Leinster Hockey CSV/Excel spreadsheet'
                  )}
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl mx-auto">
                  Upload the schedule exported or copied from the Leinster Hockey website (GameDay).
                  Supports multi-ranked squads per training group (e.g. Inters A–E, Minors A–C, 1st Years A–D, 6th Class A–C).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-red-500" />
                  <span>Choose CSV / TSV File</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl text-xs font-bold border border-red-500/30 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <span>Load 2026/27 Leinster Sample (30 Matches)</span>
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg ${
                selectedCount > 0
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
