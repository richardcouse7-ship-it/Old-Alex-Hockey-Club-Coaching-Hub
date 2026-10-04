import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  HardDrive,
  Cloud,
  Check,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  Lock,
  Sparkles,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  GoogleIntegrationService,
  AUTHORIZED_DIRECTOR_EMAIL,
  DRIVE_FOLDER_NAME,
} from '../../services/googleIntegrationService';
import { useAppStore } from '../../store';
import { GoogleAuthStatus, GoogleDriveBackupFile, HubBackupData } from '../../types';

interface GoogleIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreFromBackup?: (restoredData: unknown) => void;
  showToast: (msg: string) => void;
}

export const GoogleIntegrationModal: React.FC<GoogleIntegrationModalProps> = ({
  isOpen,
  onClose,
  onRestoreFromBackup,
  showToast,
}) => {
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>(
    GoogleIntegrationService.getAuthStatus()
  );
  const [clientIdInput, setClientIdInput] = useState<string>(
    GoogleIntegrationService.getClientId()
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [lastBackupSuccess, setLastBackupSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = GoogleIntegrationService.getAuthStatus();
      setAuthStatus(current);
      setClientIdInput(GoogleIntegrationService.getClientId());
      if (current.isSignedIn) {
        loadDriveBackups();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClientId = () => {
    GoogleIntegrationService.setClientId(clientIdInput);
    showToast('Google OAuth Client ID saved!');
  };

  const handleConnect = async () => {
    if (!clientIdInput.trim()) {
      showToast('Please enter your Google OAuth Client ID first.');
      return;
    }
    GoogleIntegrationService.setClientId(clientIdInput);
    setIsConnecting(true);
    try {
      const status = await GoogleIntegrationService.requestToken();
      setAuthStatus(status);
      showToast(`Connected as ${status.userEmail || AUTHORIZED_DIRECTOR_EMAIL}!`);
      loadDriveBackups();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Google authorization failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    GoogleIntegrationService.signOut();
    setAuthStatus(GoogleIntegrationService.getAuthStatus());
    setDriveBackups([]);
    showToast('Disconnected from Google.');
  };

  const loadDriveBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const files = await GoogleIntegrationService.listBackupsFromDrive();
      setDriveBackups(files);
    } catch (err) {
      console.warn('Could not load drive backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (!authStatus.isSignedIn) {
      showToast('Please connect your Google account first.');
      return;
    }
    setIsBackingUp(true);
    try {
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
      const uploaded = await GoogleIntegrationService.backupVaultToDrive(fullVault);
      setLastBackupSuccess(uploaded.name);
      showToast(`Vault successfully backed up to Google Drive folder "${DRIVE_FOLDER_NAME}"!`);
      loadDriveBackups();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to backup to Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromDrive = async (file: GoogleDriveBackupFile) => {
    if (!window.confirm(`Restore entire Hub vault from "${file.name}"? This will update your local schedule and coaching data.`)) {
      return;
    }
    try {
      const data = await GoogleIntegrationService.downloadBackupContent(file.id);
      if (onRestoreFromBackup) onRestoreFromBackup(data);
      showToast('Hub successfully restored from Google Drive!');
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to restore from Google Drive.');
    }
  };

  const handleTestGmailCompose = () => {
    GoogleIntegrationService.openDirectGmail({
      to: AUTHORIZED_DIRECTOR_EMAIL,
      subject: 'Old Alex Coaching Hub — Test Message',
      body: 'Hi Richard,\n\nYour Old Alex Coaching Hub Gmail integration is active and running at Milltown.\n\nWarm regards,\nDirector of Coaching',
    });
    showToast('Launched Gmail Web compose window!');
  };

  const isDirector =
    !authStatus.userEmail ||
    authStatus.userEmail.toLowerCase() === AUTHORIZED_DIRECTOR_EMAIL.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Google Workspace & Drive Sync"
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between bg-black shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Google Workspace & Drive Sync
                </h2>
                <span className="text-[10px] font-mono-data font-bold bg-red-950 text-red-300 px-2 py-0.5 rounded-full border border-red-800/60">
                  Director Personal
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dedicated Gmail & Google Drive integration for Richard Couse ({AUTHORIZED_DIRECTOR_EMAIL})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Account Status Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              authStatus.isSignedIn
                ? isDirector
                  ? 'bg-emerald-950/30 border-emerald-800/50'
                  : 'bg-amber-950/30 border-amber-800/50'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {authStatus.userPicture ? (
                <img
                  src={authStatus.userPicture}
                  alt={authStatus.userName || 'Director'}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500/60 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-neutral-850 border border-neutral-750 flex items-center justify-center text-neutral-400 font-bold text-base">
                  RC
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {authStatus.userName || 'Richard Couse'}
                  </span>
                  {authStatus.isSignedIn && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Active Sync
                    </span>
                  )}
                </div>
                <p className="text-neutral-400 mt-0.5 font-mono">
                  {authStatus.userEmail || AUTHORIZED_DIRECTOR_EMAIL}
                </p>
                {!isDirector && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Notice: Authorized specifically for {AUTHORIZED_DIRECTOR_EMAIL}.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {authStatus.isSignedIn ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-750 transition-all"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Connect Google Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Dual Features: Drive Backups + Gmail Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Drive Vault Card */}
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
                <p className="text-neutral-400 leading-relaxed">
                  Automatically backs up your 15-squad schedule, 31 coaches, tactical drills, and fixtures to your personal Google Drive folder.
                </p>
                {lastBackupSuccess && (
                  <p className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Saved: {lastBackupSuccess}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={handleBackupToDrive}
                  disabled={isBackingUp || !authStatus.isSignedIn}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-40"
                >
                  {isBackingUp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Backup Vault to Google Drive Now</span>
                </button>

                {!authStatus.isSignedIn && (
                  <p className="text-[10px] text-neutral-500 text-center">
                    Connect Google account below to enable 1-tap Drive backup.
                  </p>
                )}
              </div>
            </div>

            {/* Gmail Web & API Card */}
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>Gmail Compose & Dispatch</span>
                  </div>
                  <span className="text-[10px] bg-sky-950/80 border border-sky-800/80 text-sky-300 px-2 py-0.5 rounded font-mono">
                    Instant Zero-Setup
                  </span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Launch pre-filled timetable briefings, coach availability callouts, and parent circulars directly in your logged-in Gmail with 1 click.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={handleTestGmailCompose}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Gmail Web Compose (Test)</span>
                </button>
                <p className="text-[10px] text-neutral-500 text-center">
                  Works instantly in any browser without requiring API credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Drive Backups History (If Connected) */}
          {authStatus.isSignedIn && (
            <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Google Drive Stored Backups</span>
                </h4>
                <button
                  type="button"
                  onClick={loadDriveBackups}
                  disabled={isLoadingBackups}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingBackups ? (
                <div className="py-6 text-center text-neutral-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                  <span>Scanning Google Drive folder...</span>
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="py-6 text-center text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-850">
                  No backup files found yet in folder &quot;{DRIVE_FOLDER_NAME}&quot;.
                  Tap &quot;Backup Vault to Google Drive Now&quot; above to create your first cloud snapshot.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {driveBackups.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-700"
                    >
                      <div>
                        <div className="font-mono text-white font-semibold text-[11px]">
                          {b.name}
                        </div>
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
                          onClick={() => handleRestoreFromDrive(b)}
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
          )}

          {/* Google Cloud API Client ID Configuration (Accordion) */}
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-between cursor-pointer text-left transition-all active:scale-95"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
            >
              <div className="flex items-center gap-2 text-white font-bold">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Google Cloud OAuth Credentials (Optional for Direct API Calls)</span>
              </div>
              {showSetupGuide ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </button>

            <p className="text-neutral-400 leading-relaxed">
              <strong>Direct Gmail Web Compose</strong> works instantly with zero setup. If you want the app to automatically create Google Drive folders, upload backups in the background, or send emails via the Gmail API, add your Google Cloud Client ID below.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-750 text-white placeholder-neutral-500 font-mono text-xs focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleSaveClientId}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-neutral-850 hover:bg-neutral-800 text-white border border-neutral-700 shrink-0"
              >
                Save Client ID
              </button>
            </div>

            {showSetupGuide && (
              <div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-xl space-y-2.5 text-neutral-300 text-[11px] leading-relaxed">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How to create your free Google Cloud Client ID (2 Minutes):</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-neutral-300">
                  <li>
                    Visit the{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 underline font-semibold"
                    >
                      Google Cloud Console Credentials Page
                    </a>{' '}
                    logged in as <span className="text-white font-mono">{AUTHORIZED_DIRECTOR_EMAIL}</span>.
                  </li>
                  <li>Click <strong>+ CREATE CREDENTIALS</strong> ➔ <strong>OAuth client ID</strong>.</li>
                  <li>Select Application type: <strong>Web application</strong>.</li>
                  <li>
                    Under <strong>Authorized JavaScript origins</strong>, add:
                    <div className="mt-1 font-mono text-[10px] bg-black p-2 rounded border border-neutral-800 text-emerald-400 select-all">
                      http://localhost:3000<br />
                      http://127.0.0.1:3000
                    </div>
                  </li>
                  <li>Click <strong>Create</strong> and copy your <strong>Client ID</strong> into the field above!</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-black shrink-0 text-xs">
          <span className="text-neutral-500 flex items-center gap-1 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Configured exclusively for Richard Couse
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
