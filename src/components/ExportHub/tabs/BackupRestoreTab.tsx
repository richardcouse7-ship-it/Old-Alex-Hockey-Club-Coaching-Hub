import React from 'react';
import {
  Database,
  Unlock,
  Lock,
  Cloud,
  Upload,
  ExternalLink,
  Download,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  Coach,
  CoachAvailability,
  Drill,
  FirstAidIncident,
  MatchFixture,
  SectorGearAllocation,
  SessionSlot,
} from '../../../types';
import { ExportService, HubBackupData } from '../../../services/exportService';
import {
  AUTHORIZED_DIRECTOR_EMAIL,
  DRIVE_FOLDER_NAME,
} from '../../../services/googleIntegrationService';
import { useAppStore } from '../../../store';

export interface BackupRestoreTabProps {
  slots: SessionSlot[];
  coaches: Coach[];
  drills: Drill[];
  fixtures: MatchFixture[];
  availability: CoachAvailability[];
  sectorGear: SectorGearAllocation[];
  firstAid: FirstAidIncident[];
  onRestoreBackupSuccess: (backup: HubBackupData) => void;
  onResetToOfficialMaster?: () => void;
  showToast: (msg: string) => void;
  onNavigateToGoogleTab?: () => void;
  onBackupToGoogleDrive?: () => Promise<void>;
  isBackingUpDrive?: boolean;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
  slots,
  coaches,
  drills,
  fixtures,
  availability,
  sectorGear,
  firstAid,
  onRestoreBackupSuccess,
  onResetToOfficialMaster,
  showToast,
  onNavigateToGoogleTab,
  onBackupToGoogleDrive,
  isBackingUpDrive = false,
}) => {
  const alwaysUnlocked = useAppStore((s) => s.isDirectorUnlocked);
  const setAlwaysUnlocked = useAppStore((s) => s.setDirectorUnlocked);

  const handleDownloadBackup = () => {
    const state = useAppStore.getState();
    const backup: HubBackupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      director: 'Richard Couse',
      slots,
      drills,
      coaches,
      availability,
      sectorGear,
      firstAid,
      fixtures,
      players: state.players,
      whatsAppGroups: state.whatsAppGroups,
      checklist: state.checklist,
      blitzTournaments: state.blitzTournaments,
    };
    ExportService.downloadFullBackupJSON(backup);
    showToast('Old Alex Hub full data backup saved to your device!');
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = ExportService.validateAndParseBackup(content);
      if (parsed) {
        onRestoreBackupSuccess(parsed);
        showToast(`Successfully restored ${parsed.slots.length} slots & ${parsed.drills.length} drills from backup!`);
      } else {
        alert('Invalid Old Alex backup file format. Please check the file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleToggleAlwaysUnlocked = () => {
    const next = !alwaysUnlocked;
    setAlwaysUnlocked(next);
    showToast(next ? 'Director Fast Access enabled (No PIN needed on this device).' : 'Director PIN prompt restored.');
  };

  const handlePurgePlaceholdersAndReset = () => {
    if (window.confirm('Purge all leftover placeholder records and restore the official Old Alex 15-squad master schedule with 31 coaches?')) {
      if (onResetToOfficialMaster) {
        onResetToOfficialMaster();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-white">
            Director Personal Data Vault & Single-User Controls
          </h3>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          As the sole director running the Old Alex Coaching Hub, your data (slots, drills, coaching roster, templates, fixtures) is stored locally on this machine.
          Download full JSON backups to preserve your changes or restore across your laptop and tablet.
        </p>
      </div>

      {/* Fast Access Toggle for Richard */}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
            {alwaysUnlocked ? <Unlock className="w-4 h-4 text-red-400" /> : <Lock className="w-4 h-4 text-red-400" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Director Fast Access (Single-User Mode)</h4>
            <p className="text-[11px] text-neutral-400">
              Bypass PIN prompt on this device so you can access all Director Master Packs instantly.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAlwaysUnlocked}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            alwaysUnlocked
              ? 'bg-red-600 text-white font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-750'
          }`}
        >
          {alwaysUnlocked ? 'Unlocked (Active)' : 'Require PIN 1893'}
        </button>
      </div>

      {/* Google Drive Cloud Sync Card */}
      <div className="p-5 bg-neutral-950 border border-emerald-900/50 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
              Google Drive Cloud Sync ({DRIVE_FOLDER_NAME})
            </h4>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
            Director Personal
          </span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Save your entire coaching database (15 squads, 31 coaches, tactical drills, fixtures) directly to your personal Google Drive for {AUTHORIZED_DIRECTOR_EMAIL}.
        </p>
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {onBackupToGoogleDrive && (
            <button
              type="button"
              onClick={onBackupToGoogleDrive}
              disabled={isBackingUpDrive}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isBackingUpDrive ? 'Uploading to Drive...' : 'Backup Vault to Google Drive'}</span>
            </button>
          )}

          {onNavigateToGoogleTab && (
            <button
              type="button"
              onClick={onNavigateToGoogleTab}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-white flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manage Drive Backups</span>
            </button>
          )}
        </div>
      </div>

      {/* Backup & Restore Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
            Export Full Hub Backup (JSON)
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Saves all sessions, drills, custom blueprints, coach roster, safety records, and match fixtures into a single backup file.
          </p>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Hub Backup File</span>
          </button>
        </div>

        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
            Restore Hub from Backup (JSON)
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Load a previously saved backup file to restore your entire database on any browser or new device.
          </p>
          <label className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all cursor-pointer text-center">
            <Upload className="w-4 h-4 text-red-400" />
            <span>Select Backup File to Restore</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Purge Placeholders & Reset to Official Master Schedule */}
      <div className="p-5 bg-neutral-950 border border-amber-900/40 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono-data">
            Purge Placeholder Data & Reset to Official Schedule
          </h4>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Permanently clears leftover placeholder records (mock players, fake injury logs, dummy slots) from this browser, and re-syncs the official 15-squad Old Alex master schedule with all 31 verified coaches.
        </p>
        <button
          type="button"
          onClick={handlePurgePlaceholdersAndReset}
          className="w-full sm:w-auto py-2.5 px-4 text-xs font-bold rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Purge Placeholders & Reset to Real Master</span>
        </button>
      </div>
    </div>
  );
};
