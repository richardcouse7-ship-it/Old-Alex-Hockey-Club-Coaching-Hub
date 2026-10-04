import React, { useState } from 'react';
import {
  X,
  Share2,
  Clock,
  MapPin,
  FileDown,
  Compass,
  Trash2,
} from 'lucide-react';
import { Coach, Drill, PitchSector, SessionSlot } from '../../types';
import { TacticalWhiteboard } from '../TacticalBoard/TacticalWhiteboard';
import { ExportService } from '../../services/exportService';
import {
  SlotDetailsTab,
  SlotDrillsTab,
  SlotPlanTab,
  SlotReflectionTab,
  DeleteSlotConfirmModal,
} from './SlotDrawer';

export interface SlotSideDrawerProps {
  slot: SessionSlot | null;
  onClose: () => void;
  onUpdateSlot: (updatedSlot: SessionSlot) => void;
  coaches: Coach[];
  sectors: PitchSector[];
  allDrills: Drill[];
  slots?: SessionSlot[];
  onTriggerNotification?: (
    title: string,
    message: string,
    type: 'pitch_change' | 'coach_sub' | 'schedule_update'
  ) => void;
  onUpdateDrill?: (drill: Drill) => void;
  onOpenPitchCompanion?: (slot: SessionSlot) => void;
  onOpenWhatsAppModal?: (slotId: string) => void;
  onDeleteSlot?: (slotId: string) => void;
}

export const SlotSideDrawer: React.FC<SlotSideDrawerProps> = ({
  slot,
  onClose,
  onUpdateSlot,
  coaches,
  sectors,
  allDrills,
  slots = [],
  onTriggerNotification,
  onUpdateDrill,
  onOpenPitchCompanion,
  onOpenWhatsAppModal,
  onDeleteSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'drills' | 'plan' | 'reflection'>('details');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [whiteboardDrill, setWhiteboardDrill] = useState<Drill | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!slot) return null;

  const currentSector = sectors.find((s) => s.id === slot.pitchSectorId);
  const assignedCoaches = coaches.filter((c) => slot.assignedCoachIds.includes(c.id));
  const attachedDrillIds =
    slot.drillIds || (slot as unknown as { attachedDrillIds?: string[] }).attachedDrillIds || [];
  const attachedDrills = allDrills.filter((d) => attachedDrillIds.includes(d.id));

  const handleCopySlotWhatsApp = () => {
    const coachNames = assignedCoaches.map((c) => c.name).join(', ') || 'TBC';
    const text = `🏑 *OLD ALEX HOCKEY — ${slot.ageGroupId.toUpperCase()} SESSION*
⏰ *Time:* ${slot.timeSlot}
📍 *Pitch Sector:* ${currentSector?.name || slot.pitchSectorId} (${currentSector?.code})
👥 *Coaches:* ${coachNames}
🎯 *Focus:* ${slot.sessionTitle}
📝 *Purpose:* ${slot.sessionPurpose}

ℹ️ *Coaching Notes:*
${slot.coachNotes || 'Standard pathway setup.'}

*Attached Drills:*
${attachedDrills.map((d) => `• ${d.title} (${d.durationMinutes}m)`).join('\n') || 'None attached'}

_Old Alex Youth Coaching Hub_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="relative w-screen max-w-2xl bg-black border-l border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 bg-neutral-950">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      slot.pathway === 'Foundation'
                        ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                        : slot.pathway === 'Development'
                        ? 'bg-neutral-900 text-white border border-neutral-700'
                        : 'bg-red-600/20 text-red-300 border border-red-500/50'
                    }`}
                  >
                    {slot.pathway} Pathway
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-mono-data font-bold ${
                      slot.status === 'Ready'
                        ? 'text-emerald-400 bg-neutral-900 border border-emerald-800/60'
                        : slot.status === 'Needs Coach'
                        ? 'text-amber-400 bg-neutral-900 border border-amber-800/60'
                        : 'text-neutral-300 bg-neutral-900 border border-neutral-800'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{slot.ageGroupId}</span>
                  <span className="text-neutral-500 text-lg font-normal">—</span>
                  <span className="text-white text-lg font-semibold">{slot.sessionTitle}</span>
                </h2>
                <div className="flex items-center flex-wrap gap-3 text-xs text-neutral-300 mt-2 font-mono-data">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    {slot.timeSlot}
                  </span>
                  {slot.isAway || slot.pitchSectorId === 'away' ? (
                    <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <Compass className="w-3.5 h-3.5 text-blue-400" />
                      Away · {slot.venueName || 'Away Ground'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {currentSector?.name} ({currentSector?.code})
                    </span>
                  )}
                  {slot.meetTime && (
                    <span className="flex items-center gap-1 text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 font-semibold">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Meet: {slot.meetTime}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenPitchCompanion && (
                  <button
                    type="button"
                    onClick={() => onOpenPitchCompanion(slot)}
                    className="p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white transition-colors shadow-sm"
                    title="Launch Live Turf Timer with referee whistle alerts"
                  >
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="hidden sm:inline">Pitch Clock</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenWhatsAppModal) {
                      onOpenWhatsAppModal(slot.id);
                    } else {
                      handleCopySlotWhatsApp();
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    copiedWhatsApp
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-emerald-400'
                  }`}
                  title="WhatsApp Templates (Briefing / Parent update)"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {copiedWhatsApp ? 'Copied!' : 'WhatsApp'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentSector) return;
                    const html = ExportService.generateSlot1PagePDFHtml(
                      slot,
                      coaches,
                      currentSector,
                      allDrills,
                      slot.date,
                      slot.coachNotes
                    );
                    ExportService.printOrSavePDF(html, `OldAlex-${slot.ageGroupId}-${slot.pitchSectorId}`);
                  }}
                  className="p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-purple-400 hover:text-purple-300 transition-colors shadow-sm"
                  title="Save or share sunlight-ready 1-Page Digital PDF Card"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Card</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-6 border-b border-neutral-800 -mb-6">
              {[
                { id: 'details', label: 'Session Details & Roster' },
                { id: 'drills', label: `Drills Attached (${attachedDrills.length})` },
                { id: 'plan', label: 'Session Plan Viewer' },
                { id: 'reflection', label: 'Post-Review' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-red-500 text-white bg-red-600/10'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black">
            {activeTab === 'details' && (
              <SlotDetailsTab
                slot={slot}
                sectors={sectors}
                coaches={coaches}
                onUpdateSlot={onUpdateSlot}
                onTriggerNotification={onTriggerNotification}
              />
            )}

            {activeTab === 'drills' && (
              <SlotDrillsTab
                slot={slot}
                allDrills={allDrills}
                onUpdateSlot={onUpdateSlot}
                onSetWhiteboardDrill={setWhiteboardDrill}
              />
            )}

            {activeTab === 'plan' && (
              <SlotPlanTab
                slot={slot}
                currentSector={currentSector}
                slots={slots}
              />
            )}

            {activeTab === 'reflection' && (
              <SlotReflectionTab
                slot={slot}
                onUpdateSlot={onUpdateSlot}
              />
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
            <div>
              {onDeleteSlot && (
                showDeleteConfirm ? (
                  <DeleteSlotConfirmModal
                    onConfirm={() => {
                      onDeleteSlot(slot.id);
                      onClose();
                    }}
                    onCancel={() => setShowDeleteConfirm(false)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 text-xs font-bold text-neutral-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 rounded-xl flex items-center gap-1.5 transition-all"
                    title="Permanently remove this session slot from the timetable"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Delete Session</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 hidden sm:inline">
                Offline auto-saved
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tactical Whiteboard Modal */}
      {whiteboardDrill && (
        <TacticalWhiteboard
          initialElements={whiteboardDrill.diagramElements || []}
          title={`Edit Pitch Setup: ${whiteboardDrill.title}`}
          onSave={(elements) => {
            if (onUpdateDrill && whiteboardDrill) {
              onUpdateDrill({ ...whiteboardDrill, diagramElements: elements });
            }
            setWhiteboardDrill(null);
          }}
          onClose={() => setWhiteboardDrill(null)}
        />
      )}
    </div>
  );
};

export default SlotSideDrawer;
