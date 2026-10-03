import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Search,
  PhoneCall,
  MessageSquare,
  Filter,
  UserCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  HeartPulse,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { AgeGroup, AttendanceRecord, Player, SessionSlot } from '../../types';
import { useAppStore } from '../../store';

interface PlayerAttendanceViewProps {
  selectedDate: string;
  slots: SessionSlot[];
  onOpenEmergencyModal: (player?: Player) => void;
}

const ALL_AGE_GROUPS: AgeGroup[] = [
  'PEN',
  '1st Class',
  '2nd Class',
  '3rd Class',
  '4th Class',
  '5th Class',
  '6th Class',
  '1st Years',
  'Minors',
  'Inters',
];

export const PlayerAttendanceView: React.FC<PlayerAttendanceViewProps> = ({
  selectedDate,
  slots,
  onOpenEmergencyModal,
}) => {
  const players = useAppStore((s) => s.players);
  const allAttendance = useAppStore((s) => s.attendance);
  const attendance = useMemo(() => allAttendance[selectedDate] || [], [allAttendance, selectedDate]);

  const recordPlayerStatus = useAppStore((s) => s.recordPlayerAttendanceStatus);
  const toggleGearCheck = useAppStore((s) => s.togglePlayerGearCheck);
  const markSquadPresent = useAppStore((s) => s.markSquadPresent);
  const bulkVerifyGear = useAppStore((s) => s.bulkVerifySquadGear);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const updatePlayer = useAppStore((s) => s.updatePlayer);
  const deletePlayer = useAppStore((s) => s.deletePlayer);

  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | 'all'>('3rd Class');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // New player form state
  const [formName, setFormName] = useState('');
  const [formAgeGroup, setFormAgeGroup] = useState<AgeGroup>('3rd Class');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formMedicalNotes, setFormMedicalNotes] = useState('None');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter players
  const filteredPlayers = players.filter((p) => {
    const matchesGroup = selectedAgeGroup === 'all' || p.ageGroupId === selectedAgeGroup;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.parentPhone.includes(searchQuery);
    return matchesGroup && matchesSearch && p.isActive;
  });

  // Calculate statistics
  const currentSquadRecords = attendance.filter((r: AttendanceRecord) =>
    selectedAgeGroup === 'all' ? true : r.ageGroupId === selectedAgeGroup
  );

  const presentCount = filteredPlayers.filter((p) => {
    const rec = currentSquadRecords.find((r: AttendanceRecord) => r.playerId === p.id);
    return rec?.status === 'present';
  }).length;

  const gearCheckedCount = filteredPlayers.filter((p) => {
    const rec = currentSquadRecords.find((r: AttendanceRecord) => r.playerId === p.id);
    return rec?.gearChecked;
  }).length;

  const medicalAlertCount = filteredPlayers.filter(
    (p) => p.medicalNotes && p.medicalNotes.toLowerCase() !== 'none'
  ).length;

  // Actions
  const handleSetStatus = (player: Player, status: AttendanceRecord['status']) => {
    recordPlayerStatus(
      selectedDate,
      player.ageGroupId,
      player.id,
      status
    );
    showToast(`${player.name} marked ${status.toUpperCase()}`);
  };

  const handleToggleGear = (player: Player) => {
    toggleGearCheck(selectedDate, player.ageGroupId, player.id);
  };

  const handleMarkAllPresent = () => {
    if (selectedAgeGroup === 'all') return;
    markSquadPresent(
      selectedDate,
      selectedAgeGroup,
      players
    );
    showToast(`All ${selectedAgeGroup} players marked PRESENT`);
  };

  const handleBulkVerifyGear = () => {
    if (selectedAgeGroup === 'all') return;
    bulkVerifyGear(
      selectedDate,
      selectedAgeGroup,
      players
    );
    showToast(`Protective gear verified for all ${selectedAgeGroup}`);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formParentPhone.trim()) return;

    if (editingPlayer) {
      updatePlayer(editingPlayer.id, {
        name: formName.trim(),
        ageGroupId: formAgeGroup,
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim(),
        medicalNotes: formMedicalNotes.trim() || 'None',
      });
      setEditingPlayer(null);
      showToast(`Updated player ${formName}`);
    } else {
      const newPlayer: Player = {
        id: `ply-${Date.now()}`,
        name: formName.trim(),
        ageGroupId: formAgeGroup,
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim(),
        medicalNotes: formMedicalNotes.trim() || 'None',
        isActive: true,
      };
      addPlayer(newPlayer);
      showToast(`Added ${formName} to ${formAgeGroup} roster`);
    }

    setShowAddPlayerModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormAgeGroup(selectedAgeGroup === 'all' ? '3rd Class' : selectedAgeGroup);
    setFormParentName('');
    setFormParentPhone('');
    setFormMedicalNotes('None');
    setEditingPlayer(null);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormAgeGroup(player.ageGroupId);
    setFormParentName(player.parentName);
    setFormParentPhone(player.parentPhone);
    setFormMedicalNotes(player.medicalNotes || 'None');
    setShowAddPlayerModal(true);
  };

  const handleDeletePlayer = (playerId: string, name: string) => {
    if (window.confirm(`Remove ${name} from player roster?`)) {
      deletePlayer(playerId);
      showToast(`Removed ${name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-black border border-neutral-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
              Old Alex Youth Welfare & Pitch Safety
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 pt-0.5">
            <Users className="w-6 h-6 text-red-600" />
            <span>Player Attendance & Emergency Directory</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Sunday roll call, mandatory mouthguard/shinguard verification, and instant emergency parent contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenEmergencyModal()}
            className="px-4 py-2.5 rounded-2xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Emergency Fast-Dial</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddPlayerModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register Player</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Attendance Card */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-data text-neutral-400 uppercase tracking-wider">
              Checked In Today
            </span>
            <div className="text-2xl font-black text-white flex items-baseline gap-2 mt-0.5">
              <span>{presentCount}</span>
              <span className="text-xs text-neutral-400 font-normal">
                / {filteredPlayers.length} ({filteredPlayers.length > 0 ? Math.round((presentCount / filteredPlayers.length) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Protective Gear Compliance Card */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-data text-neutral-400 uppercase tracking-wider">
              Mouthguard & Shinguards
            </span>
            <div className="text-2xl font-black text-white flex items-baseline gap-2 mt-0.5">
              <span>{gearCheckedCount}</span>
              <span className="text-xs text-neutral-400 font-normal">
                / {filteredPlayers.length} verified
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Medical Alerts Card */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-data text-neutral-400 uppercase tracking-wider">
              Medical / Allergy Alerts
            </span>
            <div className="text-2xl font-black text-amber-400 flex items-baseline gap-2 mt-0.5">
              <span>{medicalAlertCount}</span>
              <span className="text-xs text-neutral-400 font-normal">
                players on pitch
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Squad Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Squad Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedAgeGroup('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedAgeGroup === 'all'
                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            All Squads ({players.length})
          </button>

          {ALL_AGE_GROUPS.map((grp) => {
            const count = players.filter((p) => p.ageGroupId === grp).length;
            const isSelected = selectedAgeGroup === grp;
            return (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedAgeGroup(grp)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <span>{grp}</span>
                <span className="ml-1.5 text-[10px] font-mono-data opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Bulk Operations Toolbar */}
        <div className="bg-neutral-950 border border-neutral-850 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player, parent name or mobile..."
              className="w-full bg-black border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {selectedAgeGroup !== 'all' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleBulkVerifyGear}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Verify All Gear</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Player List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-neutral-500 bg-neutral-950 border border-neutral-850 rounded-3xl">
            No players found for {selectedAgeGroup}. Register players above to start roll call.
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const record = attendance.find((r: AttendanceRecord) => r.playerId === player.id);
            const status = record?.status || 'absent';
            const isGearChecked = record?.gearChecked ?? true;
            const hasMedical = player.medicalNotes && player.medicalNotes.toLowerCase() !== 'none';

            return (
              <div
                key={player.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                  status === 'present'
                    ? 'bg-neutral-950 border-neutral-800'
                    : status === 'injured'
                    ? 'bg-red-950/20 border-red-800/50'
                    : 'bg-black border-neutral-850 opacity-80'
                }`}
              >
                {/* Header Row: Name & Age Group */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white">{player.name}</h3>
                      <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-md bg-neutral-900 text-red-400 border border-red-500/20 font-bold">
                        {player.ageGroupId}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <span>Parent:</span>
                      <strong className="text-neutral-200">{player.parentName}</strong>
                      <span className="font-mono-data text-neutral-400">({player.parentPhone})</span>
                    </p>
                  </div>

                  {/* Edit / Delete / Emergency Fast Action */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEmergencyModal(player)}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 transition-colors"
                      title="Open Emergency Fast-Dial / WhatsApp Parent Alert"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(player)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                      title="Edit player details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePlayer(player.id, player.name)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
                      title="Delete player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Medical Note Badge (If Any) */}
                {hasMedical && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="leading-snug">
                      <strong>Medical Note:</strong> {player.medicalNotes}
                    </span>
                  </div>
                )}

                {/* Roll Call Status Selector & Gear Check */}
                <div className="pt-2 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-2">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetStatus(player, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        status === 'present'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(player, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        status === 'absent'
                          ? 'bg-neutral-800 text-white border-neutral-700'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(player, 'injured')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        status === 'injured'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      Injured / Late
                    </button>
                  </div>

                  {/* Gear Check Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleGear(player)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                      isGearChecked
                        ? 'bg-sky-950/60 text-sky-300 border-sky-700/60'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                    }`}
                    title="Mouthguard & Shinguard Safety Check"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${isGearChecked ? 'text-sky-400' : 'text-neutral-500'}`} />
                    <span>{isGearChecked ? 'Gear Checked' : 'Check Gear'}</span>
                  </button>
                </div>

                {/* 1-Tap Call & WhatsApp Links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${player.parentPhone}`}
                    className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                    <span>Call Parent</span>
                  </a>

                  <a
                    href={`https://wa.me/${player.parentPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Parent</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePlayer}
            className="bg-black border border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" />
                <span>{editingPlayer ? 'Edit Player Roster' : 'Register New Player'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPlayerModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Player Full Name
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Aoife Kelly"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Age Group Squad
                </label>
                <select
                  value={formAgeGroup}
                  onChange={(e) => setFormAgeGroup(e.target.value as AgeGroup)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {ALL_AGE_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  required
                  value={formParentName}
                  onChange={(e) => setFormParentName(e.target.value)}
                  placeholder="e.g. Fiona Kelly"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Parent Mobile Phone Number
              </label>
              <input
                type="tel"
                required
                value={formParentPhone}
                onChange={(e) => setFormParentPhone(e.target.value)}
                placeholder="e.g. +353 87 234 5671"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono-data"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Medical Notes / Allergies / Inhaler Requirements
              </label>
              <textarea
                rows={2}
                value={formMedicalNotes}
                onChange={(e) => setFormMedicalNotes(e.target.value)}
                placeholder="e.g. Mild asthma (inhaler in kit bag), or None"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAddPlayerModal(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95"
              >
                {editingPlayer ? 'Save Changes' : 'Register Player'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
