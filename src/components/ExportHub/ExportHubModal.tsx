import React, { useState } from 'react';
import {
  Share2,
  Mail,
  Calendar,
  FileSpreadsheet,
  Printer,
  Database,
  Copy,
  Check,
  X,
  ExternalLink,
  Users,
  Shield,
  Clock,
  MapPin,
  Trophy,
  Package,
  Download,
  Upload,
  AlertCircle,
  FileText,
  Smartphone,
  Lock,
  Unlock,
  FileDown,
  CloudRain,
  Cloud,
  HardDrive,
  Eye,
  Sparkles,
  MessageSquare,
  Link,
  Settings,
  Send,
  RotateCcw,
  Trash2,
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
  ClubWhatsAppGroup,
  GoogleAuthStatus,
  GoogleDriveBackupFile,
} from '../../types';
import { ExportService, HubBackupData } from '../../services/exportService';
import { useAppStore } from '../../store';
import {
  GoogleIntegrationService,
  AUTHORIZED_DIRECTOR_EMAIL,
  DRIVE_FOLDER_NAME,
} from '../../services/googleIntegrationService';

export type ExportHubTab = 'whatsapp' | 'email' | 'calendar' | 'csv' | 'print' | 'backup' | 'google';

interface ExportHubModalProps {
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

  // WhatsApp Sub-state
  const [waTemplate, setWaTemplate] = useState<
    'full_timetable' | 'coach_briefing' | 'parent_update' | 'weather_delay' | 'coach_personal' | 'availability_call' | 'matchday_squad' | 'kitshed_safety'
  >('coach_briefing');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSlotId || slots[0]?.id || ''
  );
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(fixtures[0]?.id || '');
  const [customWeeklyNote, setCustomWeeklyNote] = useState<string>('');
  const [selectedPdfSlotId, setSelectedPdfSlotId] = useState<string>(slots[0]?.id || '');
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const [waCopied, setWaCopied] = useState(false);

  // WhatsApp Groups Directory State from Store
  const waGroups = useAppStore((s) => s.whatsAppGroups);
  const updateWhatsAppGroup = useAppStore((s) => s.updateWhatsAppGroup);
  const [showGroupDirectoryModal, setShowGroupDirectoryModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClubWhatsAppGroup | null>(null);
  const [editGroupLinkInput, setEditGroupLinkInput] = useState('');
  const [editGroupPhoneInput, setEditGroupPhoneInput] = useState('');

  // Email Sub-state
  const [emailTemplate, setEmailTemplate] = useState<
    'master_sunday' | 'parent_circular' | 'availability_call'
  >('master_sunday');
  const [emailCopiedHtml, setEmailCopiedHtml] = useState(false);
  const [emailCopiedText, setEmailCopiedText] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string>(AUTHORIZED_DIRECTOR_EMAIL);

  // Single-user settings state from Store
  const alwaysUnlocked = useAppStore((s) => s.isDirectorUnlocked);
  const setAlwaysUnlocked = useAppStore((s) => s.setDirectorUnlocked);

  // Google Integration (Gmail & Drive) state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthStatus>(() =>
    GoogleIntegrationService.getAuthStatus()
  );
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [isLoadingDriveBackups, setIsLoadingDriveBackups] = useState(false);

  if (!isOpen) return null;

  const currentSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];
  const currentSector = sectors.find((sec) => sec.id === currentSlot?.pitchSectorId) || sectors[0];
  const currentFixture = fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0];
  const currentCoach = coaches.find((c) => c.id === selectedCoachId) || coaches[0];

  // Resolve Target WhatsApp Group
  let targetGroup: ClubWhatsAppGroup | undefined;
  if (waTemplate === 'parent_update') {
    targetGroup = waGroups.find((g) => g.ageGroupId === currentSlot?.ageGroupId);
  } else if (
    waTemplate === 'coach_briefing' ||
    waTemplate === 'full_timetable' ||
    waTemplate === 'availability_call'
  ) {
    targetGroup = waGroups.find((g) => g.id === 'grp-coaches-all') || waGroups.find((g) => g.id === 'grp-lead-coaches');
  } else if (waTemplate === 'kitshed_safety') {
    targetGroup = waGroups.find((g) => g.id === 'grp-kitshed-safety');
  } else if (waTemplate === 'matchday_squad') {
    targetGroup = waGroups.find((g) => g.ageGroupId === (currentFixture?.ageGroupOrTeam as unknown as typeof currentSlot.ageGroupId)) ||
      waGroups.find((g) => g.id === 'grp-coaches-all');
  } else if (waTemplate === 'weather_delay') {
    targetGroup = waGroups.find((g) => g.id === 'grp-coaches-all');
  }

  // ============================================
  // WHATSAPP TEXT GENERATION
  // ============================================
  let waPreviewText = '';
  switch (waTemplate) {
    case 'coach_briefing':
      if (currentSlot && currentSector) {
        waPreviewText = ExportService.generateCoachBriefingWhatsApp(
          currentSlot,
          coaches,
          currentSector,
          drills,
          customWeeklyNote
        );
      }
      break;

    case 'parent_update':
      if (currentSlot && currentSector) {
        waPreviewText = ExportService.generateParentCircularWhatsApp(
          currentSlot,
          currentSector,
          selectedDate,
          customWeeklyNote
        );
      }
      break;

    case 'weather_delay':
      waPreviewText = ExportService.generateWeatherDelayWhatsApp(
        selectedDate,
        slots.filter((s) => s.date === selectedDate),
        15,
        customWeeklyNote || 'Pitch inspection & frost clearance'
      );
      break;

    case 'coach_personal':
      waPreviewText = ExportService.generateIndividualCoachWhatsApp(
        selectedCoachId,
        selectedDate,
        slots,
        sectors,
        coaches
      );
      break;

    case 'availability_call':
      waPreviewText = ExportService.generateAvailabilityCalloutWhatsApp(selectedDate, coaches.length);
      break;

    case 'matchday_squad':
      if (currentFixture) {
        waPreviewText = ExportService.generateMatchdaySquadWhatsApp(currentFixture);
      }
      break;

    case 'kitshed_safety':
      waPreviewText = ExportService.generateKitShedSafetyWhatsApp(
        selectedDate,
        sectorGear,
        firstAid,
        slots
      );
      break;

    case 'full_timetable':
    default:
      waPreviewText = ExportService.generateWhatsAppCopy(selectedDate, slots, coaches, sectors);
      break;
  }

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(waPreviewText);
    setWaCopied(true);
    showToast('Copied formatted WhatsApp template to clipboard!');
    setTimeout(() => setWaCopied(false), 2500);
  };

  const handleLaunchWhatsApp = () => {
    ExportService.openWhatsAppDirect(waPreviewText);
  };

  // ============================================
  // EMAIL CONTENT GENERATION
  // ============================================
  let emailData = { subject: '', text: '', html: '' };
  switch (emailTemplate) {
    case 'parent_circular':
      if (currentSlot && currentSector) {
        emailData = ExportService.generateAgeGroupParentEmail(
          currentSlot,
          currentSector,
          selectedDate,
          coaches
        );
      }
      break;

    case 'availability_call':
      emailData = ExportService.generateCoachAvailabilityEmail(selectedDate, coaches);
      break;

    case 'master_sunday':
    default:
      emailData = ExportService.generateSundayMasterEmail(
        selectedDate,
        slots,
        coaches,
        sectors,
        drills
      );
      break;
  }

  const handleOpenMailto = () => {
    ExportService.openMailto(emailData.subject, emailData.text);
  };

  const handleCopyEmailHtml = async () => {
    const ok = await ExportService.copyRichEmailToClipboard(emailData.html, emailData.text);
    if (ok) {
      setEmailCopiedHtml(true);
      showToast('Rich HTML copied! Ready to paste into Gmail or Outlook.');
      setTimeout(() => setEmailCopiedHtml(false), 2500);
    }
  };

  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(emailData.text);
    setEmailCopiedText(true);
    showToast('Plain text email copied to clipboard!');
    setTimeout(() => setEmailCopiedText(false), 2500);
  };

  // ============================================
  // GOOGLE INTEGRATION (GMAIL & DRIVE)
  // ============================================
  const handleOpenDirectGmail = () => {
    GoogleIntegrationService.openDirectGmail({
      to: emailRecipient || AUTHORIZED_DIRECTOR_EMAIL,
      subject: emailData.subject,
      body: emailData.text,
    });
    showToast('Launched Gmail compose in new tab!');
  };

  const handleSendViaGmailApi = async () => {
    const auth = GoogleIntegrationService.getAuthStatus();
    if (!auth.isSignedIn) {
      setActiveTab('google');
      showToast('Please connect your Google account first to send via API.');
      return;
    }
    setIsSendingGmail(true);
    try {
      await GoogleIntegrationService.sendViaGmailApi({
        to: emailRecipient || AUTHORIZED_DIRECTOR_EMAIL,
        subject: emailData.subject,
        bodyText: emailData.text,
        bodyHtml: emailData.html,
      });
      showToast('Email sent directly via your Gmail API!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gmail dispatch failed');
    } finally {
      setIsSendingGmail(false);
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

  // ============================================
  // BACKUP & RESTORE
  // ============================================
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
          {/* ============================================================ */}
          {/* TAB 1: WHATSAPP DISPATCH */}
          {/* ============================================================ */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {/* WhatsApp Template Pills */}
              <div>
                <span className="text-xs text-neutral-400 font-medium block mb-2">Select Template Type:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'coach_briefing', label: 'Coach Briefing (Technical)', icon: Users },
                    { id: 'parent_update', label: 'Parent Notice (Logistics)', icon: Shield },
                    { id: 'weather_delay', label: 'Weather / Delay Alert', icon: CloudRain },
                    { id: 'coach_personal', label: 'Coach Personal Schedule', icon: Smartphone },
                    { id: 'availability_call', label: 'Coach Availability Callout', icon: Clock },
                    { id: 'matchday_squad', label: 'Matchday Squad', icon: Trophy },
                    { id: 'kitshed_safety', label: 'Kit Shed & Safety Handover', icon: Package },
                    { id: 'full_timetable', label: 'Full Sunday Timetable', icon: Calendar },
                  ].map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setWaTemplate(tpl.id as unknown as typeof waTemplate)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          waTemplate === tpl.id
                            ? 'bg-red-600 text-white font-bold'
                            : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tpl.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dual-Track Quick Custom Note / Presets */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Append Custom Weekly Note / Director Notice:</span>
                  </span>
                  {customWeeklyNote && (
                    <button
                      type="button"
                      onClick={() => setCustomWeeklyNote('')}
                      className="text-[10px] text-neutral-400 hover:text-white"
                    >
                      Clear Note
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={customWeeklyNote}
                  onChange={(e) => setCustomWeeklyNote(e.target.value)}
                  placeholder="Type custom note e.g. Bring thermal layers or pitch 2 frost inspection at 8:30"
                  className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                  <span className="text-neutral-500 font-mono-data uppercase">Quick Presets:</span>
                  {[
                    'Mouthguards strictly mandatory before pushback.',
                    'Park in marked clubhouse bays only.',
                    'Return all balls and lock Kit Shed #01.',
                    'Frost inspection: all sessions pushed +15m.',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomWeeklyNote(preset)}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Selectors */}
              {(waTemplate === 'coach_briefing' || waTemplate === 'parent_update') && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-neutral-400 font-semibold">Select Session Slot:</span>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ageGroupId} ({s.timeSlot} · {s.pitchSectorId.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {waTemplate === 'coach_personal' && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-neutral-400 font-semibold">Select Coach (from Coaching Roster):</span>
                  <select
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    className="bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {waTemplate === 'matchday_squad' && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-neutral-400 font-semibold">Select Match Fixture:</span>
                  <select
                    value={selectedFixtureId}
                    onChange={(e) => setSelectedFixtureId(e.target.value)}
                    className="bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    {fixtures.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.ageGroupOrTeam} vs {f.opposition} ({f.pushbackTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target WhatsApp Group Routing Bar */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Target Chat:</span>
                      <span className="font-bold text-white">
                        {targetGroup ? targetGroup.name : 'Old Alex Coaches & Squad Group'}
                      </span>
                      {targetGroup?.inviteLink ? (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> Direct Link Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-mono">
                          Standard Web Routing
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {targetGroup?.inviteLink
                        ? `Launches directly into ${targetGroup.name} with briefing pre-copied to clipboard.`
                        : `Launches WhatsApp with text pre-filled. Set invite link to jump directly into this group.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {targetGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroup(targetGroup!);
                        setEditGroupLinkInput(targetGroup!.inviteLink || '');
                        setEditGroupPhoneInput(targetGroup!.leadContactPhone || '');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-all text-xs font-semibold"
                    >
                      <Link className="w-3.5 h-3.5 text-amber-400" />
                      <span>{targetGroup.inviteLink ? 'Edit Link' : 'Set Group Link'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowGroupDirectoryModal(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all text-xs font-semibold"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-400" />
                    <span>All Groups ({waGroups.length})</span>
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono-data">
                  <span>PREVIEW (WHATSAPP FORMATTED)</span>
                  <span className="text-emerald-400 font-medium">Ready to dispatch</span>
                </div>
                <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto selection:bg-red-700">
                  {waPreviewText}
                </pre>
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-neutral-400">
                  {targetGroup?.inviteLink
                    ? `Copies text and opens ${targetGroup.name} directly.`
                    : `Opens WhatsApp with message ready to send.`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center gap-2 transition-all"
                  >
                    {waCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{waCopied ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const target = targetGroup?.inviteLink || targetGroup?.leadContactPhone || '';
                      await ExportService.openWhatsAppGroup(target, waPreviewText);
                      setWaCopied(true);
                      showToast(`Copied text & opened ${targetGroup?.name || 'WhatsApp'}!`);
                      setTimeout(() => setWaCopied(false), 2500);
                    }}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {targetGroup
                        ? `Dispatch to ${targetGroup.name.split('(')[0]?.trim() || targetGroup.name}`
                        : 'Open in WhatsApp'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: EMAIL CIRCULARS */}
          {/* ============================================================ */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              {/* Email Template Selector */}
              <div>
                <span className="text-xs text-neutral-400 font-medium block mb-2">Select Email Circular:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'master_sunday', label: 'Master Sunday Plan (Coaches & Leads)', icon: Calendar },
                    { id: 'parent_circular', label: 'Age Group Parent Circular', icon: Shield },
                    { id: 'availability_call', label: 'Weekly Availability Request (Coaches & Leads)', icon: Clock },
                  ].map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setEmailTemplate(tpl.id as unknown as typeof emailTemplate)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          emailTemplate === tpl.id
                            ? 'bg-red-600 text-white font-bold'
                            : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tpl.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Selector for Slot */}
              {emailTemplate === 'parent_circular' && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-neutral-400 font-semibold">Select Age Group Slot:</span>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="bg-black border border-neutral-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
                  >
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ageGroupId} ({s.timeSlot} · {s.pitchSectorId.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject Line Display */}
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-1">
                <span className="text-neutral-400 font-semibold block font-mono-data">EMAIL SUBJECT:</span>
                <p className="text-white font-medium">{emailData.subject}</p>
              </div>

              {/* Preview Box */}
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-mono-data">
                  <span>EMAIL BODY PREVIEW</span>
                  <span className="text-sky-400 font-medium">Includes HTML table formatting</span>
                </div>
                <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-200 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto selection:bg-red-700">
                  {emailData.text}
                </pre>
              </div>

              {/* Email Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-neutral-400">
                  Open directly in Apple Mail / Outlook, or copy styled HTML for Gmail.
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmailText}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center gap-1.5"
                  >
                    {emailCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{emailCopiedText ? 'Copied Text' : 'Copy Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyEmailHtml}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
                    title="Paste into Gmail/Outlook with tables & colors preserved"
                  >
                    {emailCopiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{emailCopiedHtml ? 'Copied HTML!' : 'Copy Rich HTML'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenDirectGmail}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95"
                    title="Launch Gmail Web with pre-filled content (0 setup needed)"
                  >
                    <Mail className="w-4 h-4 text-white" />
                    <span>Open in Gmail (Web)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendViaGmailApi}
                    disabled={isSendingGmail}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-red-300 hover:text-white flex items-center gap-1.5 transition-all"
                    title="Send automatically in background via Gmail API"
                  >
                    <Send className="w-3.5 h-3.5 text-red-400" />
                    <span>{isSendingGmail ? 'Sending...' : 'Send via Gmail API'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMailto}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 flex items-center gap-1.5 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Default Mail App</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: CALENDAR (.ICS) */}
          {/* ============================================================ */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Sync to Calendar (RFC 5545 iCalendar)</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Download an `.ics` file containing all coaching sessions and pitch sector locations.
                  Works seamlessly with <strong>Apple Calendar (iPhone, iPad, Mac)</strong>, <strong>Google Calendar</strong>, and <strong>Microsoft Outlook</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                      Sunday Pitch Sessions
                    </span>
                    <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded font-mono">
                      {slots.length} Events
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Includes exact time slots, sector allocations (e.g., Pitch 1 North), assigned coaches, and drill topics.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      ExportService.exportSundayCalendarICS(slots, coaches, sectors, selectedDate);
                      showToast('Sunday Calendar (.ics) downloaded!');
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Sunday Schedule (.ics)</span>
                  </button>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                      Match Fixtures & Blitzes
                    </span>
                    <span className="text-[10px] bg-neutral-850 text-neutral-300 px-2 py-0.5 rounded font-mono">
                      {fixtures.length} Fixtures
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Sync pushback times, home/away venues, opposing clubs, and umpire assignments.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Fixtures synced in Sunday Schedule export!');
                      ExportService.exportFixturesToCSV(fixtures);
                    }}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Fixtures Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: SPREADSHEETS (CSV) */}
          {/* ============================================================ */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>One-Click CSV Spreadsheet Exports</span>
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Export structured data compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Sunday Timetable CSV */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                      Sunday Master Timetable
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Full breakdown of times, pitch sectors, age groups, coaches, session objectives, and attached drills.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ExportService.exportTimetableToCSV(slots, coaches, sectors, drills, selectedDate);
                      showToast('Sunday Timetable CSV exported!');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Timetable (.csv)</span>
                  </button>
                </div>

                {/* 2. Coach Roster CSV */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                      Coach Roster & Contacts
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Complete coaching directory with phone numbers, emails, coaching roles, and Sunday availability status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ExportService.exportCoachesToCSV(coaches, availability);
                      showToast('Coach Roster CSV exported!');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Coach Roster (.csv)</span>
                  </button>
                </div>

                {/* 3. Match Fixtures CSV */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                      Matches & Fixtures
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      League matches, friendly blitzes, pushback times, venues, and umpire designations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ExportService.exportFixturesToCSV(fixtures);
                      showToast('Match Fixtures CSV exported!');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Fixtures (.csv)</span>
                  </button>
                </div>

                {/* 4. Drill Library Catalog CSV */}
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                      Old Alex Drill Catalog
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      All {drills.length} drills with skill focus, duration, target age groups, equipment, and coaching points.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ExportService.exportDrillsToCSV(drills);
                      showToast('Drill Library CSV exported!');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Drill Catalog (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: DIGITAL SUNLIGHT-READY PDFS */}
          {/* ============================================================ */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-purple-400" />
                    <span>Digital PDFs & Pitchside Cards (Zero Paper Required)</span>
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    High-contrast, sunlight-ready digital PDFs styled with Old Alex purple & amber. Optimized for crisp readability on iPhones, iPads, and Android devices pitchside in Milltown, or for archiving in cloud drives.
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  100% Digital
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Complete Sunday Master PDF */}
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                        Sunday Master Blueprint PDF
                      </span>
                      <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded font-mono">
                        All 10 Groups
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Complete single-document briefing with session timings, Pitch 1 & 2 allocations, P3 cage, assigned coaches, and club safety/AED contacts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const html = ExportService.generateSundayMasterPDFHtml(
                            selectedDate,
                            slots.filter((s) => s.date === selectedDate),
                            coaches,
                            sectors,
                            drills,
                            customWeeklyNote
                          );
                          setPdfPreviewHtml(html);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <span>Digital Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const html = ExportService.generateSundayMasterPDFHtml(
                            selectedDate,
                            slots.filter((s) => s.date === selectedDate),
                            coaches,
                            sectors,
                            drills,
                            customWeeklyNote
                          );
                          ExportService.printOrSavePDF(html, `OldAlex-Sunday-Master-${selectedDate}`);
                          showToast('Master Sunday PDF generated! Save or share.');
                        }}
                        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all active:scale-95"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Save as PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. 1-Page Sector & Age Group Card */}
                <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                        1-Page Sector / Age Group Card
                      </span>
                      <span className="text-[10px] bg-red-950/80 text-red-300 px-2 py-0.5 rounded font-mono">
                        Mobile Pitch Card
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                      Targeted single-page PDF containing precise drill sequence, coaching focus points, equipment checklist, and co-coaches.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-neutral-400 font-medium block">
                        Select Age Group Slot:
                      </label>
                      <select
                        value={selectedPdfSlotId}
                        onChange={(e) => setSelectedPdfSlotId(e.target.value)}
                        className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        {slots.map((s) => {
                          const sec = sectors.find((p) => p.id === s.pitchSectorId);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.ageGroupId} ({s.timeSlot} · {sec?.code || s.pitchSectorId.toUpperCase()})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const targetSlot = slots.find((s) => s.id === selectedPdfSlotId) || slots[0];
                          const targetSector = sectors.find((sec) => sec.id === targetSlot?.pitchSectorId) || sectors[0];
                          if (!targetSlot || !targetSector) return;
                          const html = ExportService.generateSlot1PagePDFHtml(
                            targetSlot,
                            coaches,
                            targetSector,
                            drills,
                            selectedDate,
                            customWeeklyNote
                          );
                          setPdfPreviewHtml(html);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-red-400" />
                        <span>Digital Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const targetSlot = slots.find((s) => s.id === selectedPdfSlotId) || slots[0];
                          const targetSector = sectors.find((sec) => sec.id === targetSlot?.pitchSectorId) || sectors[0];
                          if (!targetSlot || !targetSector) return;
                          const html = ExportService.generateSlot1PagePDFHtml(
                            targetSlot,
                            coaches,
                            targetSector,
                            drills,
                            selectedDate,
                            customWeeklyNote
                          );
                          ExportService.printOrSavePDF(html, `OldAlex-${targetSlot.ageGroupId}-${targetSlot.pitchSectorId}`);
                          showToast(`Generated ${targetSlot.ageGroupId} PDF Card!`);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all active:scale-95"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Save Slot PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Classic Director Pack button */}
              {onOpenDirectorPack && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-750 flex items-center justify-center text-neutral-400">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Classic Multi-Page Director Pack</h4>
                      <p className="text-[11px] text-neutral-400">
                        Open the legacy full binder layout generator with page breaks and cover graphics.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDirectorPack();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white transition-all shrink-0"
                  >
                    Open Pack Generator
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: DIRECTOR DATA VAULT & SINGLE-USER BACKUP */}
          {/* ============================================================ */}
          {activeTab === 'backup' && (
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
                  <button
                    type="button"
                    onClick={handleBackupToGoogleDrive}
                    disabled={isBackingUpDrive}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isBackingUpDrive ? 'Uploading to Drive...' : 'Backup Vault to Google Drive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('google');
                      loadDriveFiles();
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 hover:text-white flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manage Drive Backups</span>
                  </button>
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
          )}

          {/* ============================================================ */}
          {/* TAB 7: GOOGLE DRIVE & GMAIL (DIRECTOR PERSONAL) */}
          {/* ============================================================ */}
          {activeTab === 'google' && (
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
                      onClick={handleOpenDirectGmail}
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
                                  onClose();
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

      {/* Fullscreen Digital PDF Preview Modal */}
      {pdfPreviewHtml && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 px-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">Digital PDF Pitchside Preview</span>
                <span className="text-xs text-neutral-400 hidden sm:inline">· Sunlight-Optimized A4</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    ExportService.printOrSavePDF(pdfPreviewHtml, `OldAlex-Digital-PDF-${selectedDate}`);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfPreviewHtml(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-neutral-950 p-2 sm:p-4 overflow-auto flex justify-center">
              <iframe
                title="Digital PDF Preview"
                srcDoc={pdfPreviewHtml}
                className="w-full max-w-4xl h-full min-h-[500px] bg-white rounded-xl shadow-2xl border-0"
              />
            </div>
          </div>
        </div>
      )}
      {/* Edit Single WhatsApp Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                  <Link className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{editingGroup.name}</h3>
                  <span className="text-[10px] text-neutral-400 uppercase font-mono">
                    Direct WhatsApp Routing Configuration
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold block">
                  WhatsApp Group Invite Link:
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={editGroupLinkInput}
                  onChange={(e) => setEditGroupLinkInput(e.target.value)}
                  className="w-full bg-black border border-neutral-750 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-neutral-400">
                  In WhatsApp on your phone: Tap Group Name &rarr; <em>Invite to Group via Link</em> &rarr; Copy Link.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold block">
                  Or Squad Manager Mobile Phone:
                </label>
                <input
                  type="tel"
                  placeholder="+353 87 123 4567"
                  value={editGroupPhoneInput}
                  onChange={(e) => setEditGroupPhoneInput(e.target.value)}
                  className="w-full bg-black border border-neutral-750 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-[11px] text-neutral-300">
                🔒 <strong>Saved locally on your device:</strong> Links and phone numbers stay private in your browser storage.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateWhatsAppGroup(editingGroup.id, {
                    inviteLink: editGroupLinkInput.trim(),
                    leadContactPhone: editGroupPhoneInput.trim(),
                  });
                  showToast(`Updated WhatsApp routing for ${editingGroup.name}!`);
                  setEditingGroup(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
              >
                Save Routing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full WhatsApp Directory Modal */}
      {showGroupDirectoryModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Old Alex WhatsApp Groups Directory</h3>
                  <span className="text-[11px] text-neutral-400">
                    Pre-set 1-tap dispatch channels for all squads & coaches
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupDirectoryModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {waGroups.map((grp) => (
                <div
                  key={grp.id}
                  className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{grp.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-neutral-800 text-neutral-400">
                        {grp.category}
                      </span>
                      {grp.inviteLink && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Direct Link
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {grp.notes || (grp.inviteLink ? grp.inviteLink : 'No direct link set')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(grp);
                      setEditGroupLinkInput(grp.inviteLink || '');
                      setEditGroupPhoneInput(grp.leadContactPhone || '');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs shrink-0"
                  >
                    {grp.inviteLink ? 'Edit Link' : 'Set Link'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                Total {waGroups.length} club channels registered.
              </span>
              <button
                type="button"
                onClick={() => setShowGroupDirectoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-neutral-900 border border-neutral-750"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
