import React, { useState } from 'react';
import {
  Calendar,
  Shield,
  Clock,
  Copy,
  Check,
  FileText,
  Mail,
  Send,
} from 'lucide-react';
import {
  Coach,
  PitchSector,
  SessionSlot,
  Drill,
} from '../../../types';
import { ExportService } from '../../../services/exportService';
import {
  GoogleIntegrationService,
  AUTHORIZED_DIRECTOR_EMAIL,
} from '../../../services/googleIntegrationService';

export interface EmailExportTabProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  selectedDate: string;
  initialSlotId?: string;
  showToast: (msg: string) => void;
  onNavigateToGoogleTab?: () => void;
}

export const EmailExportTab: React.FC<EmailExportTabProps> = ({
  slots,
  coaches,
  sectors,
  drills,
  selectedDate,
  initialSlotId,
  showToast,
  onNavigateToGoogleTab,
}) => {
  const [emailTemplate, setEmailTemplate] = useState<
    'master_sunday' | 'parent_circular' | 'availability_call'
  >('master_sunday');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSlotId || slots[0]?.id || ''
  );
  const [emailCopiedHtml, setEmailCopiedHtml] = useState(false);
  const [emailCopiedText, setEmailCopiedText] = useState(false);
  const [emailRecipient] = useState<string>(AUTHORIZED_DIRECTOR_EMAIL);
  const [isSendingGmail, setIsSendingGmail] = useState(false);

  const currentSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];
  const currentSector = sectors.find((sec) => sec.id === currentSlot?.pitchSectorId) || sectors[0];

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
      if (onNavigateToGoogleTab) {
        onNavigateToGoogleTab();
      }
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

  return (
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
  );
};
