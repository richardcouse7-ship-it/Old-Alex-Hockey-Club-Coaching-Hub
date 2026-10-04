import React, { useState } from 'react';
import {
  Share2,
  Mail,
  Calendar,
  FileSpreadsheet,
  FileDown,
  Database,
  Cloud,
  X,
} from 'lucide-react';
import {
  Coach,
  CoachAvailability,
  Drill,
  FirstAidIncident,
  MatchFixture,
  PitchSector,
  SectorGearAllocation,
  SessionSlot,
  GoogleAuthStatus,
  GoogleDriveBackupFile,
} from '../../types';
import { HubBackupData } from '../../services/exportService';
import { useAppStore } from '../../store';
import {
  GoogleIntegrationService,
  AUTHORIZED_DIRECTOR_EMAIL,
  DRIVE_FOLDER_NAME,
} from '../../services/googleIntegrationService';
import { WhatsAppExportTab } from './tabs/WhatsAppExportTab';
import { EmailExportTab } from './tabs/EmailExportTab';
import { CalendarExportTab } from './tabs/CalendarExportTab';
import { CsvExportTab } from './tabs/CsvExportTab';
import { PrintExportTab } from './tabs/PrintExportTab';
import { BackupRestoreTab } from './tabs/BackupRestoreTab';
import { GoogleDriveTab } from './tabs/GoogleDriveTab';

export type ExportHubTab = 'whatsapp' | 'email' | 'calendar' | 'csv' | 'print' | 'backup' | 'google';

export interface ExportHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ExportHubTab;
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  fixtures: MatchFixture[];
  availability: CoachAvailability[];
  sectorGear: SectorGearAllocation[];
  firstAid: FirstAidIncident[];
  selectedDate: string;
  initialSlotId?: string;
  onOpenDirectorPack?: () => void;
  onRestoreBackupSuccess: (backup: HubBackupData) => void;
  onResetToOfficialMaster?: () => void;
  showToast: (msg: string) => void;
}

export const ExportHubModal: React.FC<ExportHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'whatsapp',
  slots,
  coaches,
  sectors,
  drills,
  fixtures,
  availability,
  sectorGear,
  firstAid,
  selectedDate,
  initialSlotId,
  onOpenDirectorPack,
  onRestoreBackupSuccess,
  onResetToOfficialMaster,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<ExportHubTab>(initialTab);

  // Google Integration (Gmail & Drive) state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthStatus>(() =>
    GoogleIntegrationService.getAuthStatus()
  );
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingDriveBackups, setIsLoadingDriveBackups] = useState(false);

  if (!isOpen) return null;

  const loadDriveFiles = async () => {
    setIsLoadingDriveBackups(true);
    try {
      const files = await GoogleIntegrationService.listBackupsFromDrive();
      setDriveBackups(files);
    } catch (err) {
      console.warn('Could not load drive backups:', err);
    } finally {
      setIsLoadingDriveBackups(false);
    }
  };

  const handleBackupToGoogleDrive = async () => {
    const auth = GoogleIntegrationService.getAuthStatus();
    if (!auth.isSignedIn) {
      setActiveTab('google');
      showToast('Please connect your Google account first.');
      return;
    }
    setIsBackingUpDrive(true);
    try {
      showToast('Uploading vault backup to Google Drive...');
      const state = useAppStore.getState();
      const fullVault: HubBackupData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        director: 'Richard Couse',
        slots: state.slots,
        drills: state.drills,
        coaches: state.coaches,
        availability: state.availability,
        sectorGear: state.sectorGear,
        firstAid: state.firstAid,
        fixtures: state.fixtures,
        players: state.players,
        whatsAppGroups: state.whatsAppGroups,
        checklist: state.checklist,
        blitzTournaments: state.blitzTournaments,
      };
      const res = await GoogleIntegrationService.backupVaultToDrive(fullVault);
      showToast(`Saved to Drive folder "${DRIVE_FOLDER_NAME}": ${res.name}!`);
      loadDriveFiles();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Google Drive backup failed');
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  const handleOpenDirectGmail = () => {
    const defaultEmail = slots.length > 0 && sectors.length > 0
      ? `Sunday Coaching Plan for ${selectedDate}`
      : 'Old Alex Coaching Hub Update';
    GoogleIntegrationService.openDirectGmail({
      to: AUTHORIZED_DIRECTOR_EMAIL,
      subject: defaultEmail,
      body: 'Please find attached the latest coaching schedule update.',
    });
    showToast('Launched Gmail compose in new tab!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Communications & Export Hub
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-[11px] text-neutral-400 font-semibold">Single-User Director Mode</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Export & Dispatch Center
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'email'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>Email Circulars</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Calendar (.ics)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'csv'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Spreadsheets (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'print'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <FileDown className="w-4 h-4 text-purple-400" />
            <span>Digital PDFs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Database className="w-4 h-4 text-rose-400" />
            <span>Director Data Vault</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              loadDriveFiles();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'google'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Google Drive & Gmail</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-black space-y-5">
          {activeTab === 'whatsapp' && (
            <WhatsAppExportTab
              slots={slots}
              coaches={coaches}
              sectors={sectors}
              drills={drills}
              fixtures={fixtures}
              sectorGear={sectorGear}
              firstAid={firstAid}
              selectedDate={selectedDate}
              initialSlotId={initialSlotId}
              showToast={showToast}
            />
          )}

          {activeTab === 'email' && (
            <EmailExportTab
              slots={slots}
              coaches={coaches}
              sectors={sectors}
              drills={drills}
              selectedDate={selectedDate}
              initialSlotId={initialSlotId}
              showToast={showToast}
              onNavigateToGoogleTab={() => {
                setActiveTab('google');
                loadDriveFiles();
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarExportTab
              slots={slots}
              coaches={coaches}
              sectors={sectors}
              fixtures={fixtures}
              selectedDate={selectedDate}
              showToast={showToast}
            />
          )}

          {activeTab === 'csv' && (
            <CsvExportTab
              slots={slots}
              coaches={coaches}
              sectors={sectors}
              drills={drills}
              fixtures={fixtures}
              availability={availability}
              selectedDate={selectedDate}
              showToast={showToast}
            />
          )}

          {activeTab === 'print' && (
            <PrintExportTab
              slots={slots}
              coaches={coaches}
              sectors={sectors}
              drills={drills}
              selectedDate={selectedDate}
              onOpenDirectorPack={onOpenDirectorPack}
              onCloseParentModal={onClose}
              showToast={showToast}
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreTab
              slots={slots}
              coaches={coaches}
              drills={drills}
              fixtures={fixtures}
              availability={availability}
              sectorGear={sectorGear}
              firstAid={firstAid}
              onRestoreBackupSuccess={onRestoreBackupSuccess}
              onResetToOfficialMaster={onResetToOfficialMaster}
              showToast={showToast}
              onNavigateToGoogleTab={() => {
                setActiveTab('google');
                loadDriveFiles();
              }}
              onBackupToGoogleDrive={handleBackupToGoogleDrive}
              isBackingUpDrive={isBackingUpDrive}
            />
          )}

          {activeTab === 'google' && (
            <GoogleDriveTab
              googleAuth={googleAuth}
              setGoogleAuth={setGoogleAuth}
              driveBackups={driveBackups}
              setDriveBackups={setDriveBackups}
              isLoadingDriveBackups={isLoadingDriveBackups}
              loadDriveFiles={loadDriveFiles}
              isBackingUpDrive={isBackingUpDrive}
              handleBackupToGoogleDrive={handleBackupToGoogleDrive}
              onOpenDirectGmail={handleOpenDirectGmail}
              onRestoreBackupSuccess={onRestoreBackupSuccess}
              onCloseParentModal={onClose}
              showToast={showToast}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Old Alex HC · Director Richard Couse Suite</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
