import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Play,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Award,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { BlitzMatch, BlitzTournament, BlitzTeam, AgeGroup } from '../../types';
import { useAppStore } from '../../store';
import {
  calculateBlitzStandings,
  generateBlitzWhatsAppReport,
  generateRoundRobinMatches,
  MILLTOWN_SECTORS,
  PRESET_BLITZ_TEAMS,
} from '../../utils/tournamentGenerator';

interface BlitzTournamentViewProps {
  selectedDate: string;
  onOpenPitchCompanion?: () => void;
  showToast?: (message: string) => void;
}

export const BlitzTournamentView: React.FC<BlitzTournamentViewProps> = ({
  selectedDate,
  onOpenPitchCompanion,
  showToast,
}) => {
  const tournaments = useAppStore((s) => s.blitzTournaments);
  const saveBlitzTournament = useAppStore((s) => s.saveBlitzTournament);

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments[0]?.id || ''
  );
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number | 'ALL'>(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // New Tournament form state
  const [newTitle, setNewTitle] = useState('Old Alex Sunday Super 7s Blitz');
  const [newAgeGroup, setNewAgeGroup] = useState<string>('3rd Class');
  const [newDuration, setNewDuration] = useState<number>(12);
  const [newBreak, setNewBreak] = useState<number>(3);
  const [newStartTime, setNewStartTime] = useState<string>('10:00');
  const [selectedTeamPreset, setSelectedTeamPreset] = useState<number>(4); // 4 or 6 teams

  const activeTournament =
    tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  const handleUpdateTournament = (updated: BlitzTournament) => {
    saveBlitzTournament(updated);
  };

  const handleScoreChange = (
    matchId: string,
    team: 'home' | 'away',
    delta: number
  ) => {
    if (!activeTournament) return;
    const updatedMatches = activeTournament.matches.map((m) => {
      if (m.id === matchId) {
        const currentHome = m.homeScore ?? 0;
        const currentAway = m.awayScore ?? 0;
        const newHome = team === 'home' ? Math.max(0, currentHome + delta) : currentHome;
        const newAway = team === 'away' ? Math.max(0, currentAway + delta) : currentAway;
        return {
          ...m,
          homeScore: newHome,
          awayScore: newAway,
          status: 'Completed' as const,
        };
      }
      return m;
    });

    handleUpdateTournament({
      ...activeTournament,
      matches: updatedMatches,
    });
  };

  const handleResetMatch = (matchId: string) => {
    if (!activeTournament) return;
    const updatedMatches = activeTournament.matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore: undefined,
          awayScore: undefined,
          status: 'Scheduled' as const,
        };
      }
      return m;
    });

    handleUpdateTournament({
      ...activeTournament,
      matches: updatedMatches,
    });
  };

  const handleCopyWhatsApp = () => {
    if (!activeTournament) return;
    const text = generateBlitzWhatsAppReport(activeTournament);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    showToast?.('Copied Blitz standings bulletin to clipboard!');
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handleCreateTournamentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teamsToUse = PRESET_BLITZ_TEAMS.slice(0, selectedTeamPreset);
    const generatedMatches = generateRoundRobinMatches(
      teamsToUse,
      newStartTime,
      newDuration,
      newBreak
    );

    const newTournament: BlitzTournament = {
      id: `blitz-${Date.now()}`,
      title: newTitle.trim() || 'Old Alex Sunday Blitz',
      date: selectedDate,
      ageGroup: newAgeGroup,
      matchDurationMinutes: newDuration,
      breakDurationMinutes: newBreak,
      startTime: newStartTime,
      teams: teamsToUse,
      matches: generatedMatches,
      isCompleted: false,
      notes: `Generated ${teamsToUse.length}-team round-robin across Milltown quadrants.`,
    };

    saveBlitzTournament(newTournament);
    setSelectedTournamentId(newTournament.id);
    setShowCreateModal(false);
    showToast?.(`Created ${newTournament.title} with ${generatedMatches.length} matches!`);
  };

  if (!activeTournament) {
    return (
      <div className="p-8 text-center bg-black border border-neutral-800 rounded-2xl space-y-4">
        <Trophy className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Blitz Tournaments Found</h2>
        <p className="text-xs text-neutral-400">
          Create your first multi-pitch Sunday blitz round-robin schedule for Milltown turf.
        </p>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
        >
          Create Sunday Blitz
        </button>
      </div>
    );
  }

  const standings = calculateBlitzStandings(
    activeTournament.teams,
    activeTournament.matches
  );

  const rounds = Array.from(
    new Set(activeTournament.matches.map((m) => m.roundNumber))
  ).sort((a, b) => a - b);

  const displayedMatches =
    selectedRoundFilter === 'ALL'
      ? activeTournament.matches
      : activeTournament.matches.filter((m) => m.roundNumber === selectedRoundFilter);

  // Group displayed matches for radar view
  const currentRoundMatches =
    selectedRoundFilter === 'ALL'
      ? activeTournament.matches.filter((m) => m.roundNumber === rounds[0])
      : activeTournament.matches.filter((m) => m.roundNumber === selectedRoundFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-500 font-bold uppercase">
              Sunday Blitz & Multi-Pitch Rota Engine
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">
              {activeTournament.ageGroup} · {activeTournament.teams.length} Teams
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <Trophy className="w-6 h-6 text-red-500" />
            <span>{activeTournament.title}</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            4-Quadrant Milltown turf scheduling, live goal scoring, real-time standings table, and 1-tap WhatsApp broadcast.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tournament Selector */}
          {tournaments.length > 1 && (
            <select
              aria-label="Select Blitz Tournament"
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-neutral-900 border border-neutral-750 text-white text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.ageGroup})
                </option>
              ))}
            </select>
          )}

          {onOpenPitchCompanion && (
            <button
              type="button"
              onClick={onOpenPitchCompanion}
              className="px-3.5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-750 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              title="Launch pitchside whistle timer"
            >
              <Clock className="w-4 h-4 text-red-500" />
              <span>Pitch Timer</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Copy formatted bulletin for WhatsApp squad groups"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-emerald-400" />}
            <span>{copiedWhatsApp ? 'Copied Bulletin!' : 'Share WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Blitz</span>
          </button>
        </div>
      </div>

      {/* 4-Quadrant Pitch Live Radar & Standings Dual Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pitch Quadrant Live Radar */}
        <div className="lg:col-span-6 bg-black border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Milltown Astro Quadrants
              </h2>
            </div>
            {/* Round Tab selector for radar */}
            <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
              {rounds.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoundFilter(r)}
                  className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                    selectedRoundFilter === r
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  R{r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedRoundFilter('ALL')}
                className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${
                  selectedRoundFilter === 'ALL'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400">
            Current pitch allocations for Round {selectedRoundFilter === 'ALL' ? rounds[0] : selectedRoundFilter} ({currentRoundMatches[0]?.scheduledTime || '10:00'} pushback):
          </p>

          {/* 4 Quadrants Visual Grid (Sector B: NW, Sector D: NE, Sector A: SW, Sector C: SE) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl relative">
            {/* Half pitch line overlay */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-600/30 -translate-x-1/2" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-emerald-600/30 -translate-y-1/2" />

            {/* Sector B (North-West) */}
            {(() => {
              const match = currentRoundMatches.find((m) => m.pitchSectorId === 'sector-b');
              const home = activeTournament.teams.find((t) => t.id === match?.homeTeamId);
              const away = activeTournament.teams.find((t) => t.id === match?.awayTeamId);
              return (
                <div className="bg-black/80 border border-emerald-800/40 rounded-lg p-3 space-y-1.5 min-h-[90px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono-data text-neutral-400">
                    <span className="font-bold text-emerald-400">SECTOR B (NW)</span>
                    <span>{match?.scheduledTime || ''}</span>
                  </div>
                  {match ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: home?.color }} />
                        <span className="truncate">{home?.name}</span>
                        <span className="text-neutral-500 font-mono">vs</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: away?.color }} />
                        <span className="truncate">{away?.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 font-mono-data">
                        Score: {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'Not started'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500 italic">No match scheduled (Sector Free)</div>
                  )}
                </div>
              );
            })()}

            {/* Sector D (North-East) */}
            {(() => {
              const match = currentRoundMatches.find((m) => m.pitchSectorId === 'sector-d');
              const home = activeTournament.teams.find((t) => t.id === match?.homeTeamId);
              const away = activeTournament.teams.find((t) => t.id === match?.awayTeamId);
              return (
                <div className="bg-black/80 border border-emerald-800/40 rounded-lg p-3 space-y-1.5 min-h-[90px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono-data text-neutral-400">
                    <span className="font-bold text-emerald-400">SECTOR D (NE)</span>
                    <span>{match?.scheduledTime || ''}</span>
                  </div>
                  {match ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: home?.color }} />
                        <span className="truncate">{home?.name}</span>
                        <span className="text-neutral-500 font-mono">vs</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: away?.color }} />
                        <span className="truncate">{away?.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 font-mono-data">
                        Score: {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'Not started'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500 italic">No match scheduled (Sector Free)</div>
                  )}
                </div>
              );
            })()}

            {/* Sector A (South-West) */}
            {(() => {
              const match = currentRoundMatches.find((m) => m.pitchSectorId === 'sector-a');
              const home = activeTournament.teams.find((t) => t.id === match?.homeTeamId);
              const away = activeTournament.teams.find((t) => t.id === match?.awayTeamId);
              return (
                <div className="bg-black/80 border border-emerald-800/40 rounded-lg p-3 space-y-1.5 min-h-[90px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono-data text-neutral-400">
                    <span className="font-bold text-emerald-400">SECTOR A (SW)</span>
                    <span>{match?.scheduledTime || ''}</span>
                  </div>
                  {match ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: home?.color }} />
                        <span className="truncate">{home?.name}</span>
                        <span className="text-neutral-500 font-mono">vs</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: away?.color }} />
                        <span className="truncate">{away?.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 font-mono-data">
                        Score: {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'Not started'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500 italic">No match scheduled (Sector Free)</div>
                  )}
                </div>
              );
            })()}

            {/* Sector C (South-East) */}
            {(() => {
              const match = currentRoundMatches.find((m) => m.pitchSectorId === 'sector-c');
              const home = activeTournament.teams.find((t) => t.id === match?.homeTeamId);
              const away = activeTournament.teams.find((t) => t.id === match?.awayTeamId);
              return (
                <div className="bg-black/80 border border-emerald-800/40 rounded-lg p-3 space-y-1.5 min-h-[90px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono-data text-neutral-400">
                    <span className="font-bold text-emerald-400">SECTOR C (SE)</span>
                    <span>{match?.scheduledTime || ''}</span>
                  </div>
                  {match ? (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: home?.color }} />
                        <span className="truncate">{home?.name}</span>
                        <span className="text-neutral-500 font-mono">vs</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: away?.color }} />
                        <span className="truncate">{away?.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 font-mono-data">
                        Score: {match.homeScore !== undefined ? `${match.homeScore} - ${match.awayScore}` : 'Not started'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500 italic">No match scheduled (Sector Free)</div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right: Live Standings Board */}
        <div className="lg:col-span-6 bg-black border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Tournament Standings
              </h2>
            </div>
            <span className="text-[11px] font-mono-data text-neutral-400">
              Win = 3 pts · Draw = 1 pt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-[11px] text-neutral-400 font-mono-data uppercase">
                  <th className="py-2 pl-2">#</th>
                  <th className="py-2">Team</th>
                  <th className="py-2 text-center">P</th>
                  <th className="py-2 text-center">W</th>
                  <th className="py-2 text-center">D</th>
                  <th className="py-2 text-center">L</th>
                  <th className="py-2 text-center">GF</th>
                  <th className="py-2 text-center">GA</th>
                  <th className="py-2 text-center">GD</th>
                  <th className="py-2 text-right pr-2 font-bold text-white">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850 font-mono-data text-xs">
                {standings.map((st, idx) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <tr
                      key={st.teamId}
                      className={`hover:bg-neutral-900/60 transition-colors ${
                        idx === 0 ? 'bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 pl-2 font-bold text-neutral-400">
                        {medals[idx] || idx + 1}
                      </td>
                      <td className="py-2.5 font-sans font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: st.teamColor }}
                        />
                        <span className="truncate">{st.teamName}</span>
                      </td>
                      <td className="py-2.5 text-center text-neutral-300">{st.played}</td>
                      <td className="py-2.5 text-center text-emerald-400">{st.won}</td>
                      <td className="py-2.5 text-center text-neutral-400">{st.drawn}</td>
                      <td className="py-2.5 text-center text-neutral-500">{st.lost}</td>
                      <td className="py-2.5 text-center text-neutral-300">{st.goalsFor}</td>
                      <td className="py-2.5 text-center text-neutral-400">{st.goalsAgainst}</td>
                      <td className="py-2.5 text-center font-bold text-neutral-200">
                        {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                      </td>
                      <td className="py-2.5 text-right pr-2 font-bold text-white text-sm">
                        {st.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Matchday Schedule & Touch Scorekeeper */}
      <div className="bg-black border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Touch Scorekeeper & Schedule ({displayedMatches.length} Matches)
            </h2>
          </div>

          {/* Round Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-mono-data text-neutral-400 mr-1">Filter Round:</span>
            <button
              type="button"
              onClick={() => setSelectedRoundFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedRoundFilter === 'ALL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              All Rounds
            </button>
            {rounds.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRoundFilter(r)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedRoundFilter === r
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Round {r}
              </button>
            ))}
          </div>
        </div>

        {/* Match Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedMatches.map((match) => {
            const home = activeTournament.teams.find((t) => t.id === match.homeTeamId);
            const away = activeTournament.teams.find((t) => t.id === match.awayTeamId);
            const isCompleted = match.homeScore !== undefined && match.awayScore !== undefined;

            return (
              <div
                key={match.id}
                className="bg-neutral-900/80 border border-neutral-750 hover:border-neutral-600 rounded-xl p-3.5 space-y-3 transition-colors"
              >
                {/* Match Card Top */}
                <div className="flex items-center justify-between text-[11px] font-mono-data text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-bold">
                      Round {match.roundNumber}
                    </span>
                    <span className="text-red-400 font-semibold">{match.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{match.pitchSectorLabel}</span>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="grid grid-cols-12 items-center gap-2 pt-1">
                  {/* Home Team */}
                  <div className="col-span-5 flex items-center justify-between pr-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: home?.color }}
                      />
                      <span className="text-xs font-bold text-white truncate" title={home?.name}>
                        {home?.name}
                      </span>
                    </div>
                    {/* Goal controls Home */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'home', -1)}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg flex items-center justify-center active:scale-95 transition-all"
                        title="Deduct goal"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'home', 1)}
                        className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                        title="Add goal"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="col-span-2 text-center">
                    <div className="text-base font-black font-mono-data text-white bg-black py-1 px-2 rounded-lg border border-neutral-800">
                      {match.homeScore ?? 0} : {match.awayScore ?? 0}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="col-span-5 flex items-center justify-between pl-2">
                    {/* Goal controls Away */}
                    <div className="flex items-center gap-1 shrink-0 mr-1">
                      <button
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'away', -1)}
                        className="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg flex items-center justify-center active:scale-95 transition-all"
                        title="Deduct goal"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'away', 1)}
                        className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                        title="Add goal"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate" title={away?.name}>
                        {away?.name}
                      </span>
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: away?.color }}
                      />
                    </div>
                  </div>
                </div>

                {/* Match Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    {isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Result Logged
                      </span>
                    ) : (
                      <span className="text-neutral-500 italic">Score pending</span>
                    )}
                  </span>

                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleResetMatch(match.id)}
                      className="text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                      title="Reset score"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create New Blitz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-red-500" />
                  <span>Create Sunday Blitz Tournament</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Auto-generates a balanced round-robin match rota across Milltown's turf quadrants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTournamentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                  Blitz Tournament Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 2nd Class Super 7s Spring Blitz"
                  className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                    Age Group
                  </label>
                  <select
                    value={newAgeGroup}
                    onChange={(e) => setNewAgeGroup(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-medium"
                  >
                    {[
                      'PEN',
                      '1st Class',
                      '2nd Class',
                      '3rd Class',
                      '4th Class',
                      '5th Class',
                      '6th Class',
                      '1st Years',
                    ].map((ag) => (
                      <option key={ag} value={ag}>
                        {ag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                    First Pushback Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                    Game Length (Mins)
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-medium"
                  >
                    <option value={8}>8 mins (Rapid Blitz)</option>
                    <option value={10}>10 mins</option>
                    <option value={12}>12 mins (Standard)</option>
                    <option value={15}>15 mins (Extended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-400 mb-1">
                    Break Between Rounds
                  </label>
                  <select
                    value={newBreak}
                    onChange={(e) => setNewBreak(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer font-medium"
                  >
                    <option value={2}>2 mins</option>
                    <option value={3}>3 mins (Recommended)</option>
                    <option value={5}>5 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
                  Number of Teams & Rota Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamPreset(4)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTeamPreset === 4
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-neutral-900 border-neutral-750 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">4 Teams (3 Rounds)</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      6 matches total across Sectors A & B.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTeamPreset(6)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTeamPreset === 6
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-neutral-900 border-neutral-750 text-neutral-300 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">6 Teams (5 Rounds)</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      15 matches across Sectors A, B, and C.
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Blitz Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
