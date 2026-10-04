import React, { useEffect } from 'react';
import {
  Check,
  Cloud,
  HardDrive,
  Upload,
  Mail,
  ExternalLink,
  Download,
  RotateCcw,
} from 'lucide-react';
import { GoogleAuthStatus, GoogleDriveBackupFile } from '../../../types';
import { HubBackupData } from '../../../services/exportService';
import {
  GoogleIntegrationService,
  AUTHORIZED_DIRECTOR_EMAIL,
  DRIVE_FOLDER_NAME,
} from '../../../services/googleIntegrationService';

export interface GoogleDriveTabProps {
  googleAuth: GoogleAuthStatus;
  setGoogleAuth: React.Dispatch<React.SetStateAction<GoogleAuthStatus>>;
  driveBackups: GoogleDriveBackupFile[];
  setDriveBackups: React.Dispatch<React.SetStateAction<GoogleDriveBackupFile[]>>;
  isLoadingDriveBackups: boolean;
  loadDriveFiles: () => Promise<void>;
  isBackingUpDrive: boolean;
  handleBackupToGoogleDrive: () => Promise<void>;
  onOpenDirectGmail: () => void;
  onRestoreBackupSuccess: (backup: HubBackupData) => void;
  onCloseParentModal: () => void;
  showToast: (msg: string) => void;
}

export const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({
  googleAuth,
  setGoogleAuth,
  driveBackups,
  setDriveBackups,
  isLoadingDriveBackups,
  loadDriveFiles,
  isBackingUpDrive,
  handleBackupToGoogleDrive,
  onOpenDirectGmail,
  onRestoreBackupSuccess,
  onCloseParentModal,
  showToast,
}) => {
  useEffect(() => {
    loadDriveFiles();
  }, []);

  return (
    <div className="space-y-4">
      {/* Account Status Card */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          googleAuth.isSignedIn
            ? 'bg-emerald-950/30 border-emerald-800/50'
            : 'bg-neutral-950 border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-3.5">
          {googleAuth.userPicture ? (
            <img
              src={googleAuth.userPicture}
              alt={googleAuth.userName || 'Richard Couse'}
              className="w-12 h-12 rounded-full border-2 border-emerald-500/60 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-neutral-850 border border-neutral-750 flex items-center justify-center text-white font-bold text-base">
              RC
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {googleAuth.userName || 'Richard Couse'}
              </span>
              {googleAuth.isSignedIn ? (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Active Sync
                </span>
              ) : (
                <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-750 px-2 py-0.5 rounded-full font-mono">
                  Zero-Setup Web Ready
                </span>
              )}
            </div>
            <p className="text-neutral-400 mt-0.5 font-mono text-xs">
              {googleAuth.userEmail || AUTHORIZED_DIRECTOR_EMAIL}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {googleAuth.isSignedIn ? (
            <button
              type="button"
              onClick={() => {
                GoogleIntegrationService.signOut();
                setGoogleAuth(GoogleIntegrationService.getAuthStatus());
                setDriveBackups([]);
                showToast('Disconnected from Google.');
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-750 transition-all"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  const status = await GoogleIntegrationService.requestToken();
                  setGoogleAuth(status);
                  showToast(`Connected as ${status.userEmail || AUTHORIZED_DIRECTOR_EMAIL}!`);
                  loadDriveFiles();
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Google authorization failed.');
                }
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Cloud className="w-4 h-4" />
              <span>Connect Google Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual Cards: Drive Backups + Gmail Web */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Drive Vault */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Google Drive Vault</span>
              </div>
              <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-mono">
                📂 {DRIVE_FOLDER_NAME}
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-xs">
              Automatically saves your entire coaching database (15 squad sessions, 31 coaches, tactical drills, fixtures) to a dedicated folder in your personal Google Drive.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-850 space-y-2">
            <button
              type="button"
              onClick={handleBackupToGoogleDrive}
              disabled={isBackingUpDrive}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isBackingUpDrive ? 'Uploading to Drive...' : 'Backup Vault to Google Drive Now'}</span>
            </button>
          </div>
        </div>

        {/* Gmail Compose */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Gmail Web Compose</span>
              </div>
              <span className="text-[10px] bg-sky-950/80 border border-sky-800/80 text-sky-300 px-2 py-0.5 rounded font-mono">
                Instant Zero-Setup
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-xs">
              Launches your personal Gmail with Sunday timetable briefings, availability callouts, or parent notices pre-filled. Works instantly with zero setup.
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-850 space-y-2">
            <button
              type="button"
              onClick={onOpenDirectGmail}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Current Briefing in Gmail Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drive Stored Backups List */}
      <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white flex items-center gap-2 text-xs">
            <Download className="w-4 h-4 text-amber-400" />
            <span>Backups Stored in Google Drive ({DRIVE_FOLDER_NAME})</span>
          </h4>
          <button
            type="button"
            onClick={loadDriveFiles}
            disabled={isLoadingDriveBackups}
            className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
          >
            <RotateCcw className={`w-3 h-3 ${isLoadingDriveBackups ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingDriveBackups ? (
          <div className="py-6 text-center text-neutral-500 text-xs">
            Scanning Google Drive folder...
          </div>
        ) : driveBackups.length === 0 ? (
          <div className="py-6 text-center text-neutral-500 bg-neutral-900/40 rounded-xl border border-neutral-850 text-xs">
            {googleAuth.isSignedIn
              ? 'No backup snapshots found yet. Tap "Backup Vault to Google Drive Now" above to create one.'
              : 'Connect your Google account above to view and restore backups stored in your Google Drive.'}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {driveBackups.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-mono text-white font-semibold text-[11px]">{b.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Created {new Date(b.createdTime).toLocaleString('en-IE')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {b.webViewLink && (
                    <a
                      href={b.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Restore entire Hub vault from "${b.name}"?`)) {
                        try {
                          const data = await GoogleIntegrationService.downloadBackupContent(b.id);
                          onRestoreBackupSuccess(data as HubBackupData);
                          showToast('Hub restored from Google Drive!');
                          onCloseParentModal();
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : 'Restore failed');
                        }
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
