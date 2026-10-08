import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  Plus,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Flag,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AgeGroup, MatchFixture, PitchSector, SessionSlot } from '../../types';
import { ExportService } from '../../services/exportService';
import { QuickScoreModal } from './QuickScoreModal';
import { LeinsterFixturesImportModal } from './LeinsterFixturesImportModal';
import { useAppStore } from '../../store';

interface FixturesViewProps {
  fixtures: MatchFixture[];
  slots: SessionSlot[];
  sectors: PitchSector[];
  onUpdateFixtures: (updated: MatchFixture[]) => void;
  selectedDate: string;
  onShareWhatsApp: (text: string) => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({
  fixtures,
  slots,
  sectors,
  onUpdateFixtures,
  selectedDate,
  onShareWhatsApp,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'HOME' | 'AWAY'>('ALL');
  const [dateScope, setDateScope] = useState<'ALL_SEASON' | 'SELECTED_DATE'>('ALL_SEASON');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'ALL' | AgeGroup>('ALL');
  const [selectedRankedTeamFilter, setSelectedRankedTeamFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFixtureForScore, setSelectedFixtureForScore] = useState<MatchFixture | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Discover distinct Training Groups and Ranked Teams from fixtures
  const availableTrainingGroups = useMemo(() => {
    const groups = new Set<AgeGroup>();
    fixtures.forEach((f) => {
      if (f.trainingGroup) groups.add(f.trainingGroup);
    });
    return Array.from(groups);
  }, [fixtures]);

  const availableRankedTeams = useMemo(() => {
    const teams = new Set<string>();
    fixtures.forEach((f) => {
      if (selectedGroupFilter !== 'ALL' && f.trainingGroup && f.trainingGroup !== selectedGroupFilter) return;
      if (f.rankedTeam) teams.add(f.rankedTeam);
      else if (f.ageGroupOrTeam) teams.add(f.ageGroupOrTeam);
    });
    return Array.from(teams).sort();
  }, [fixtures, selectedGroupFilter]);


  // New fixture form state
  const [newTeam, setNewTeam] = useState('Minors A (U15)');
  const [newOpp, setNewOpp] = useState('');
  const [newComp, setNewComp] = useState('Leinster Minor League Div 1');
  const [newPushback, setNewPushback] = useState('14:30');
  const [newIsHome, setNewIsHome] = useState(true);
  const [newVenue, setNewVenue] = useState('Milltown Pitch 1 (Full)');
  const [newLeadCoach, setNewLeadCoach] = useState('Alex McGonigle');
  const [newUmpires, setNewUmpires] = useState('David Gray, Club Appointed');
  const [newNotes, setNewNotes] = useState('');

  // Check for pitch clashes with Sunday coaching slots
  const detectedClashes: { fixture: MatchFixture; conflictingSlot: SessionSlot }[] = [];
  for (const fix of fixtures) {
    if (fix.isHome && fix.date === selectedDate) {
      // Check if slot overlaps with match time
      const matchHour = parseInt(fix.pushbackTime.split(':')[0], 10);
      for (const slot of slots) {
        if (slot.date === selectedDate) {
          const slotStartHour = parseInt(slot.timeSlot.split('–')[0]?.trim().split(':')[0] || '0', 10);
          if (Math.abs(matchHour - slotStartHour) <= 1) {
            detectedClashes.push({ fixture: fix, conflictingSlot: slot });
          }
        }
      }
    }
  }

  const filteredFixtures = useMemo(() => {
    return fixtures
      .filter((f) => {
        if (dateScope === 'SELECTED_DATE' && f.date !== selectedDate) return false;
        if (filterType === 'HOME' && !f.isHome) return false;
        if (filterType === 'AWAY' && f.isHome) return false;
        if (selectedGroupFilter !== 'ALL' && f.trainingGroup && f.trainingGroup !== selectedGroupFilter) {
          return false;
        }
        if (selectedRankedTeamFilter !== 'ALL') {
          const team = f.rankedTeam || f.ageGroupOrTeam;
          if (team !== selectedRankedTeamFilter) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            f.ageGroupOrTeam.toLowerCase().includes(q) ||
            (f.rankedTeam && f.rankedTeam.toLowerCase().includes(q)) ||
            f.opposition.toLowerCase().includes(q) ||
            f.competition.toLowerCase().includes(q) ||
            f.venue.toLowerCase().includes(q) ||
            f.date.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.pushbackTime.localeCompare(b.pushbackTime);
      });
  }, [
    fixtures,
    dateScope,
    selectedDate,
    filterType,
    selectedGroupFilter,
    selectedRankedTeamFilter,
    searchQuery,
  ]);

  const handleLeinsterImport = (imported: MatchFixture[], mode: 'replace' | 'merge') => {
    const result = useAppStore.getState().importLeinsterSeasonFixtures(imported, mode);
    onUpdateFixtures(useAppStore.getState().fixtures);
    setToastMsg(
      `Imported ${result.importedCount} fixtures (${result.updatedCount} updated, total ${result.totalCount}) across Leinster leagues.`
    );
    setTimeout(() => setToastMsg(null), 4500);
    return result;
  };

  const handleAddFixtureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpp.trim()) return;

    const fixture: MatchFixture = {
      id: `fix-${Date.now()}`,
      date: selectedDate,
      pushbackTime: newPushback,
      ageGroupOrTeam: newTeam,
      competition: newComp,
      opposition: newOpp.trim(),
      isHome: newIsHome,
      venue: newIsHome ? 'Milltown Pitch 1 (Full)' : newVenue.trim() || 'Away Venue',
      leadCoachOrManager: newLeadCoach,
      umpires: newUmpires.split(',').map((u) => u.trim()).filter(Boolean),
      notes: newNotes.trim() || undefined,
      status: 'Scheduled',
    };

    const next = [fixture, ...fixtures];
    onUpdateFixtures(next);
    setShowAddModal(false);
    setNewOpp('');
    setNewNotes('');
    setToastMsg(`Fixture added: ${fixture.ageGroupOrTeam} vs ${fixture.opposition}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleUpdateResult = (fixtureId: string, resultStr: string) => {
    const updated = fixtures.map((f) =>
      f.id === fixtureId
        ? {
            ...f,
            result: resultStr,
            status: (resultStr.trim() ? 'Completed' : 'Scheduled') as MatchFixture['status'],
          }
        : f
    );
    onUpdateFixtures(updated);
  };

  const handleSaveScoreFromModal = (updatedFixture: MatchFixture) => {
    const updated = fixtures.map((f) => (f.id === updatedFixture.id ? updatedFixture : f));
    onUpdateFixtures(updated);
    setToastMsg(`Logged final score for ${updatedFixture.ageGroupOrTeam}: ${updatedFixture.result}`);
    setTimeout(() => setToastMsg(null), 3500);
  };


  const handleShareSquadWhatsApp = (fixture: MatchFixture) => {
    const text = ExportService.generateMatchdaySquadWhatsApp(fixture);
    onShareWhatsApp(text);
  };

  const homeCount = fixtures.filter((f) => f.isHome).length;
  const awayCount = fixtures.filter((f) => !f.isHome).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-500 font-bold uppercase">
              Leinster Hockey League & EYHL
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">
              {fixtures.length} Fixtures ({homeCount} Home / {awayCount} Away)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Trophy className="w-6 h-6 text-red-500" />
            <span>Match & Fixture Hub</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Coordinate Junior & Senior matches, pitch allocations at Milltown, opposition details, umpires, and squad broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md border border-neutral-750 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-red-500" />
            <span>Import Leinster Fixtures (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add League Fixture</span>
          </button>
        </div>
      </div>

      {/* Clashes Banner if detected */}
      {detectedClashes.length > 0 && (
        <div className="bg-amber-950/50 border border-amber-800/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-amber-100 font-bold block">
              Pitch Allocation Clash Detected on Milltown Astro:
            </strong>
            {detectedClashes.map(({ fixture, conflictingSlot }, idx) => (
              <p key={idx} className="leading-snug">
                • <strong>{fixture.ageGroupOrTeam}</strong> match vs {fixture.opposition} (pushback {fixture.pushbackTime}) shares pitch timing with training slot <strong>{conflictingSlot.ageGroupId}</strong> ({conflictingSlot.timeSlot} on {conflictingSlot.pitchSectorId.toUpperCase()}). Please verify full pitch reservation.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Scope, Home/Away, Training Group & Search Controls */}
      <div className="space-y-3 bg-black p-4 rounded-2xl border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Date Scope & Home/Away Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-750">
              <button
                type="button"
                onClick={() => setDateScope('ALL_SEASON')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  dateScope === 'ALL_SEASON' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Full Season ({fixtures.length})
              </button>
              <button
                type="button"
                onClick={() => setDateScope('SELECTED_DATE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  dateScope === 'SELECTED_DATE' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sunday {selectedDate}
              </button>
            </div>

            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-750">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  filterType === 'ALL' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Venues
              </button>
              <button
                type="button"
                onClick={() => setFilterType('HOME')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  filterType === 'HOME' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Home ({homeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('AWAY')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  filterType === 'AWAY' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Away ({awayCount})
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, opposition, venue..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-750 rounded-lg text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Training Group & Multi-Ranked Team Filter Row */}
        {availableTrainingGroups.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-850">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-red-500" />
                Training Groups:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupFilter('ALL');
                  setSelectedRankedTeamFilter('ALL');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedGroupFilter === 'ALL'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                All Groups
              </button>
              {availableTrainingGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    setSelectedGroupFilter(group);
                    setSelectedRankedTeamFilter('ALL');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                    selectedGroupFilter === group
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>

            {availableRankedTeams.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Ranked Squad:</span>
                <select
                  value={selectedRankedTeamFilter}
                  onChange={(e) => setSelectedRankedTeamFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-750 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="ALL">All Ranked Squads ({availableRankedTeams.length})</option>
                  {availableRankedTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFixtures.map((fix) => (
          <div
            key={fix.id}
            className={`p-5 rounded-2xl border transition-all space-y-4 ${
              fix.isHome
                ? 'bg-black border-neutral-750 hover:border-red-500'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                    {fix.competition} {fix.round ? `· ${fix.round}` : ''}
                  </span>
                  <span className="text-neutral-600">·</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      fix.isHome
                        ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                        : 'bg-neutral-900 text-white border border-neutral-700'
                    }`}
                  >
                    {fix.isHome ? 'HOME (Milltown)' : 'AWAY'}
                  </span>
                  {fix.trainingGroup && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-750">
                      {fix.trainingGroup}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {fix.rankedTeam || fix.ageGroupOrTeam}
                </h3>
                <p className="text-xs text-neutral-300 mt-0.5 font-medium">
                  vs <strong className="text-white">{fix.opposition}</strong>
                </p>
              </div>

              <div className="text-right font-mono-data">
                <div className="text-sm font-bold text-white bg-red-600 px-2.5 py-1 rounded-lg">
                  {fix.pushbackTime}
                </div>
                <span className="text-[10px] text-neutral-400 block mt-1">{fix.date}</span>
              </div>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Venue</span>
                <span className="font-semibold text-white truncate block">{fix.venue}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Lead Coach / Mgr</span>
                <span className="font-semibold text-white truncate block">{fix.leadCoachOrManager}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-neutral-800">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Umpires</span>
                <span className="text-neutral-200">{fix.umpires.join(' & ') || 'Club Appointed'}</span>
              </div>
            </div>

            {fix.notes && (
              <p className="text-xs text-neutral-300 bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 leading-relaxed">
                ℹ️ {fix.notes}
              </p>
            )}

            {/* Result Display if completed or recorded */}
            {fix.result && (
              <div className="flex items-center justify-between gap-3 bg-black border border-neutral-750 p-3 rounded-xl ring-1 ring-red-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data text-sm font-extrabold text-white">
                        FT: {fix.result}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-neutral-900 text-white border border-neutral-700">
                        {fix.status}
                      </span>
                    </div>
                    {fix.goalscorers && (
                      <p className="text-[11px] text-red-400 truncate mt-0.5 font-semibold">
                        ⚽ {fix.goalscorers}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFixtureForScore(fix)}
                  className="px-2.5 py-1 text-[11px] font-bold text-white hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors shrink-0"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Result & Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFixtureForScore(fix)}
                  className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-red-500 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Trophy className="w-3.5 h-3.5 text-red-500" />
                  <span>{fix.result ? 'Update Score' : 'Log Match Score'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleShareSquadWhatsApp(fix)}
                className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-emerald-400 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Copy formatted match notice for WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Squad</span>
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* Add Fixture Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-red-500" />
                <span>Add Leinster League / Match Fixture</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFixtureSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Old Alex Team</label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Minors A (U15)">Minors A (U15)</option>
                    <option value="Minors B (U15)">Minors B (U15)</option>
                    <option value="Inters A (U17)">Inters A (U17)</option>
                    <option value="Inters B (U17)">Inters B (U17)</option>
                    <option value="1st Years A">1st Years A</option>
                    <option value="6th Class Blitz Squad">6th Class Blitz Squad</option>
                    <option value="Old Alex Ladies 1sts (EYHL)">Old Alex Ladies 1sts (EYHL)</option>
                    <option value="Old Alex Ladies 2nds">Old Alex Ladies 2nds (Div 1)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Opposition Club</label>
                  <input
                    type="text"
                    required
                    value={newOpp}
                    onChange={(e) => setNewOpp(e.target.value)}
                    placeholder="e.g. Loreto HC, Pembroke"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Competition</label>
                  <input
                    type="text"
                    value={newComp}
                    onChange={(e) => setNewComp(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Pushback Time</label>
                  <input
                    type="text"
                    value={newPushback}
                    onChange={(e) => setNewPushback(e.target.value)}
                    placeholder="14:30"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Location</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewIsHome(true)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                        newIsHome
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIsHome(false)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                        !newIsHome
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white'
                      }`}
                    >
                      Away
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Lead Coach / Mgr</label>
                  <input
                    type="text"
                    value={newLeadCoach}
                    onChange={(e) => setNewLeadCoach(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {!newIsHome && (
                <div>
                  <label className="text-neutral-300 font-semibold block mb-1">Away Venue Address</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Park Avenue, Sandymount"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Umpires</label>
                <input
                  type="text"
                  value={newUmpires}
                  onChange={(e) => setNewUmpires(e.target.value)}
                  placeholder="e.g. David Gray, Leinster Official"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Fixture Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Kit clash reminder, warmup sector allocation..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold shadow-md transition-colors"
                >
                  Save Fixture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Score & Result Logger Modal */}
      <QuickScoreModal
        isOpen={Boolean(selectedFixtureForScore)}
        onClose={() => setSelectedFixtureForScore(null)}
        fixture={selectedFixtureForScore}
        onSaveResult={handleSaveScoreFromModal}
      />

      {/* Leinster Season Fixtures Importer Modal */}
      <LeinsterFixturesImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleLeinsterImport}
      />

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-60 max-w-sm bg-neutral-900 border border-red-500 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-red-500" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

