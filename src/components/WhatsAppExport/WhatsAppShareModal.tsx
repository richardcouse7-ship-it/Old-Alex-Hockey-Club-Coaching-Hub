import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Users,
  Shield,
  Clock,
  MapPin,
  Trophy,
  Bell,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Coach, Drill, MatchFixture, PitchSector, SessionSlot, WhatsAppTemplateType } from '../../types';
import { ExportService } from '../../services/exportService';
import { GoogleIntegrationService, AUTHORIZED_DIRECTOR_EMAIL } from '../../services/googleIntegrationService';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: Drill[];
  fixtures: MatchFixture[];
  selectedDate: string;
  initialSlotId?: string;
  onCopySuccess: (msg: string) => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  slots,
  coaches,
  sectors,
  drills,
  fixtures,
  selectedDate,
  initialSlotId,
  onCopySuccess,
}) => {
  const [activeTab, setActiveTab] = useState<WhatsAppTemplateType>('coach_briefing');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSlotId || slots[0]?.id || ''
  );
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(
    fixtures[0]?.id || ''
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];
  const currentSector = sectors.find((sec) => sec.id === currentSlot?.pitchSectorId) || sectors[0];
  const currentFixture = fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0];

  // Generate appropriate message based on active template tab
  let previewText = '';
  switch (activeTab) {
    case 'coach_briefing':
      if (currentSlot && currentSector) {
        previewText = ExportService.generateCoachBriefingWhatsApp(
          currentSlot,
          coaches,
          currentSector,
          drills
        );
      }
      break;

    case 'parent_update':
      if (currentSlot && currentSector) {
        previewText = ExportService.generateParentUpdateWhatsApp(
          currentSlot,
          currentSector,
          selectedDate
        );
      }
      break;

    case 'matchday_squad':
      if (currentFixture) {
        previewText = ExportService.generateMatchdaySquadWhatsApp(currentFixture);
      }
      break;

    case 'availability_callout':
      previewText = ExportService.generateAvailabilityCalloutWhatsApp(selectedDate, coaches.length);
      break;

    case 'full_timetable':
    default:
      previewText = ExportService.generateWhatsAppCopy(selectedDate, slots, coaches, sectors);
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    onCopySuccess('WhatsApp template copied to clipboard! Ready to paste into WhatsApp group.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="WhatsApp Dispatch Center"
    >
      <div
        className="bg-black border border-neutral-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                WhatsApp Dispatch Center
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                One-Tap Group Announcements
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

        {/* Tab Selection */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('coach_briefing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'coach_briefing'
                ? 'bg-red-600 text-white shadow-md font-bold'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Coach Briefing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parent_update')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'parent_update'
                ? 'bg-red-600 text-white shadow-md font-bold'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Parent & Player Notice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matchday_squad')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'matchday_squad'
                ? 'bg-red-600 text-white shadow-md font-bold'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750'
            }`}
          >
            <Trophy className="w-4 h-4 text-white" />
            <span>Matchday Squad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('availability_callout')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'availability_callout'
                ? 'bg-red-600 text-white shadow-md font-bold'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750'
            }`}
          >
            <Bell className="w-4 h-4 text-red-400" />
            <span>Coach Availability Call</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('full_timetable')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'full_timetable'
                ? 'bg-red-600 text-white shadow-md font-bold'
                : 'text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Full Timetable</span>
          </button>
        </div>

        {/* Dynamic Parameter Selector based on Tab */}
        {(activeTab === 'coach_briefing' || activeTab === 'parent_update') && (
          <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center gap-3 text-xs">
            <span className="text-neutral-300 font-semibold">Select Session Slot:</span>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ageGroupId} ({s.timeSlot} · {s.pitchSectorId.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'matchday_squad' && (
          <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center gap-3 text-xs">
            <span className="text-neutral-300 font-semibold">Select Match Fixture:</span>
            <select
              value={selectedFixtureId}
              onChange={(e) => setSelectedFixtureId(e.target.value)}
              className="bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-red-500"
            >
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ageGroupOrTeam} vs {f.opposition} ({f.pushbackTime})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-black">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider font-mono-data text-white">
              WhatsApp Formatted Message Preview
            </span>
            <span className="text-[11px] text-red-400 flex items-center gap-1 font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Includes WhatsApp bold/italic markdown</span>
            </span>
          </div>

          <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-xs text-neutral-100 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto selection:bg-red-700">
            {previewText}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-300 hidden sm:block">
            Formatted specifically for Old Alex coaches and parent chat groups.
          </p>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-750 rounded-xl"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                const subject = `[Old Alex HC] ${activeTab.replace('_', ' ').toUpperCase()} - ${selectedDate}`;
                GoogleIntegrationService.openDirectGmail({
                  to: AUTHORIZED_DIRECTOR_EMAIL,
                  subject,
                  body: previewText,
                });
              }}
              className="px-3.5 py-2.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 rounded-xl flex items-center gap-1.5 transition-all"
              title="Open prefilled draft in Gmail for Richard"
            >
              <Mail className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Open in Gmail</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy for WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
