import React, { useState } from 'react';
import {
  Users,
  Shield,
  CloudRain,
  Smartphone,
  Clock,
  Trophy,
  Package,
  Calendar,
  Sparkles,
  MessageSquare,
  Check,
  Link,
  Settings,
  Copy,
  Send,
  X,
} from 'lucide-react';
import {
  Coach,
  FirstAidIncident,
  MatchFixture,
  PitchSector,
  SectorGearAllocation,
  SessionSlot,
  ClubWhatsAppGroup,
} from '../../../types';
import { ExportService } from '../../../services/exportService';
import { useAppStore } from '../../../store';

export interface WhatsAppExportTabProps {
  slots: SessionSlot[];
  coaches: Coach[];
  sectors: PitchSector[];
  drills: any[];
  fixtures: MatchFixture[];
  sectorGear: SectorGearAllocation[];
  firstAid: FirstAidIncident[];
  selectedDate: string;
  initialSlotId?: string;
  showToast: (msg: string) => void;
}

export const WhatsAppExportTab: React.FC<WhatsAppExportTabProps> = ({
  slots,
  coaches,
  sectors,
  drills,
  fixtures,
  sectorGear,
  firstAid,
  selectedDate,
  initialSlotId,
  showToast,
}) => {
  const [waTemplate, setWaTemplate] = useState<
    'full_timetable' | 'coach_briefing' | 'parent_update' | 'weather_delay' | 'coach_personal' | 'availability_call' | 'matchday_squad' | 'kitshed_safety'
  >('coach_briefing');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSlotId || slots[0]?.id || ''
  );
  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(fixtures[0]?.id || '');
  const [customWeeklyNote, setCustomWeeklyNote] = useState<string>('');
  const [waCopied, setWaCopied] = useState(false);

  // WhatsApp Groups Directory State from Store
  const waGroups = useAppStore((s) => s.whatsAppGroups);
  const updateWhatsAppGroup = useAppStore((s) => s.updateWhatsAppGroup);
  const [showGroupDirectoryModal, setShowGroupDirectoryModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClubWhatsAppGroup | null>(null);
  const [editGroupLinkInput, setEditGroupLinkInput] = useState('');
  const [editGroupPhoneInput, setEditGroupPhoneInput] = useState('');

  const currentSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];
  const currentSector = sectors.find((sec) => sec.id === currentSlot?.pitchSectorId) || sectors[0];
  const currentFixture = fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0];

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

  return (
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
