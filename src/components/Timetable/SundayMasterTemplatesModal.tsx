import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Plus,
  Trash2,
  BookmarkPlus,
  Shield,
  ChevronRight,
  Info,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Coach, SessionSlot, SundayMasterTemplate } from '../../types';
import { PREBUILT_SUNDAY_TEMPLATES } from '../../data/sundayMasterTemplates';
import { useAppStore } from '../../store';

interface SundayMasterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  currentSlots: SessionSlot[];
  coaches: Coach[];
  onApplyTemplate: (newSlots: SessionSlot[], mode: 'replace' | 'merge') => void;
}

function instantiateSlotsFromTemplate(
  template: SundayMasterTemplate,
  targetDate: string
): SessionSlot[] {
  const timestamp = Date.now();
  return template.slots.map((s, idx) => ({
    ...s,
    id: `slot-${timestamp}-${idx + 1}`,
    date: targetDate,
    status: s.assignedCoachIds.length > 0 ? ('Ready' as const) : ('Needs Coach' as const),
    attachedDrillIds: s.attachedDrillIds || [],
    equipmentChecklist: s.equipmentChecklist || [
      { item: 'Standard hockey balls & cones', checked: true },
    ],
    runningOrder: s.runningOrder || [
      { activity: 'Warmup & dynamic stretches', durationMins: 10 },
      { activity: 'Main skill drill', durationMins: 25 },
      { activity: 'Small-sided conditioned game', durationMins: 25 },
    ],
  }));
}

export const SundayMasterTemplatesModal: React.FC<SundayMasterTemplatesModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  currentSlots,
  coaches,
  onApplyTemplate,
}) => {
  const customTemplates = useAppStore((s) => s.customSundayTemplates);
  const saveCustomTemplate = useAppStore((s) => s.saveCustomTemplate);
  const deleteCustomTemplate = useAppStore((s) => s.deleteCustomTemplate);

  const templates = useMemo<SundayMasterTemplate[]>(
    () => [...PREBUILT_SUNDAY_TEMPLATES, ...customTemplates],
    [customTemplates]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace');
  const [showSaveCustom, setShowSaveCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customBadge, setCustomBadge] = useState('Custom Blueprint');
  const [customDescription, setCustomDescription] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const selectedTemplate =
    templates.find((t: SundayMasterTemplate) => t.id === selectedTemplateId) || templates[0];

  const handleApply = () => {
    if (!selectedTemplate) return;
    const instantiated = instantiateSlotsFromTemplate(
      selectedTemplate,
      selectedDate
    );

    let finalSlots: SessionSlot[];
    if (applyMode === 'replace') {
      finalSlots = instantiated;
    } else {
      finalSlots = [...currentSlots, ...instantiated];
    }

    onApplyTemplate(finalSlots, applyMode);
    onClose();
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    if (currentSlots.length === 0) {
      alert('There are no slots currently in the Sunday timetable to save as a template.');
      return;
    }

    const newTemplate: SundayMasterTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: customName.trim(),
      badge: customBadge.trim() || 'Custom Blueprint',
      pitchCoverage: 'Active Pitch Sectors',
      description:
        customDescription.trim() ||
        `Saved snapshot of ${currentSlots.length} Sunday slots created on ${selectedDate}.`,
      focusSummary: `Custom timetable containing ${currentSlots.length} age group sessions.`,
      isCustom: true,
      slots: currentSlots.map(({ id, date, ...rest }) => rest),
    };

    saveCustomTemplate(newTemplate);
    setSelectedTemplateId(newTemplate.id);
    setShowSaveCustom(false);
    setCustomName('');
    setCustomDescription('');
    setNotificationMsg(`Saved "${newTemplate.name}" as a reusable Sunday blueprint!`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleDeleteCustomTemplate = (id: string, name: string) => {
    if (confirm(`Delete the custom template "${name}"?`)) {
      deleteCustomTemplate(id);
      if (selectedTemplateId === id) {
        setSelectedTemplateId(templates[0]?.id || '');
      }
      setNotificationMsg(`Template deleted.`);
      setTimeout(() => setNotificationMsg(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border border-neutral-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-data text-red-400 font-bold uppercase tracking-wider">
                  Sunday Operations
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-300">Master Sunday Blueprints</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Pre-Built Sunday Master Templates
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSaveCustom(!showSaveCustom)}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-xl flex items-center gap-1.5 transition-colors"
              title="Save the current active Sunday schedule as a reusable template"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-red-400" />
              <span>Snapshot Current Sunday</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {notificationMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-5 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Save Custom Drawer Form */}
        {showSaveCustom && (
          <form
            onSubmit={handleSaveCurrentAsTemplate}
            className="p-4 bg-neutral-900 border-b border-neutral-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4 text-red-500" />
                <span>Save Active Schedule ({currentSlots.length} slots) as Reusable Master Template</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSaveCustom(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn Term Standard Rotation"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                  Category Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular Sunday"
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-300 font-semibold block mb-1">
                Description / Strategic Note
              </label>
              <input
                type="text"
                placeholder="e.g. Full club morning with PEN starting at 9:00 on Pitch 1 North."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
              >
                Save as Master Template
              </button>
            </div>
          </form>
        )}

        {/* Notice bar confirming manual customizer remains 100% active */}
        <div className="px-5 py-2.5 bg-neutral-950 border-b border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>
              <strong>Full Editing Freedom:</strong> Applying a template populates the day in 1 click, but you can still edit, reassign, add, or delete any slot manually.
            </span>
          </div>
          <span className="font-mono-data text-[10px] text-neutral-400">
            Target Date: {selectedDate}
          </span>
        </div>

        {/* Main Content: Split Master List & Detail Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Template Selection List (Left Column) */}
          <div className="lg:col-span-5 p-4 border-r border-neutral-800 overflow-y-auto space-y-2.5 max-h-[55vh] lg:max-h-[60vh]">
            <span className="text-[10px] font-mono-data text-neutral-400 uppercase font-bold tracking-wider block px-1">
              Choose Master Blueprint ({templates.length})
            </span>

            {templates.map((tpl: SundayMasterTemplate) => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-neutral-900 border-red-500 shadow-md ring-1 ring-red-500/50'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[9px] font-mono-data font-bold uppercase px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-800 text-white'
                      }`}
                    >
                      {tpl.badge}
                    </span>

                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTemplate(tpl.id, tpl.name);
                        }}
                        className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-xs mt-1.5 leading-snug">
                    {tpl.name}
                  </h3>

                  <p className="text-[11px] text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 font-mono-data">
                    <span>{tpl.slots.length} age group slots</span>
                    <span className="text-neutral-300 truncate max-w-[130px]">
                      {tpl.pitchCoverage}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Template Details & Slot Preview (Right Column) */}
          <div className="lg:col-span-7 p-4 sm:p-5 overflow-y-auto max-h-[55vh] lg:max-h-[60vh] space-y-4 bg-neutral-950">
            {selectedTemplate && (
              <>
                <div className="bg-black border border-neutral-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      <span>{selectedTemplate.name}</span>
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 border border-red-500/50 font-semibold">
                      {selectedTemplate.badge}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {selectedTemplate.description}
                  </p>

                  <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <strong className="text-white">Coverage:</strong>{' '}
                      {selectedTemplate.pitchCoverage}
                    </span>
                    <span>
                      <strong className="text-white">Total Sessions:</strong>{' '}
                      {selectedTemplate.slots.length}
                    </span>
                  </div>

                  <div className="mt-2 p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] text-white">
                    💡 <strong className="text-red-400">Focus:</strong> {selectedTemplate.focusSummary}
                  </div>
                </div>

                {/* Slots Breakdown Table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono-data text-neutral-400 uppercase font-bold tracking-wider block">
                    Planned Session Running Order ({selectedTemplate.slots.length} slots)
                  </span>

                  <div className="space-y-2">
                    {selectedTemplate.slots.map((s, idx: number) => (
                      <div
                        key={idx}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono-data text-[11px] font-bold text-white bg-black px-2 py-1 rounded-lg border border-neutral-800 shrink-0">
                            {s.timeSlot}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate">
                                {s.ageGroupId}
                              </span>
                              <span className="text-[10px] text-neutral-400 uppercase font-mono-data">
                                · {s.pitchSectorId.toUpperCase()}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                  s.pathway === 'Foundation'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : s.pathway === 'Development'
                                    ? 'bg-neutral-800 text-white border border-neutral-700'
                                    : 'bg-red-600/30 text-red-300 border border-red-500/50'
                                }`}
                              >
                                {s.pathway}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-300 truncate mt-0.5">
                              {s.sessionTitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-neutral-300 shrink-0">
                          <span className="bg-black px-2 py-0.5 rounded border border-neutral-800 text-[10px]">
                            {s.attachedDrillIds?.length || 0} drills attached
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with Apply Options */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-neutral-300 font-semibold">Apply Mode:</span>
            <label className="flex items-center gap-1.5 text-white cursor-pointer">
              <input
                type="radio"
                name="applyMode"
                value="replace"
                checked={applyMode === 'replace'}
                onChange={() => setApplyMode('replace')}
                className="accent-red-600"
              />
              <span>Replace Active Day ({selectedTemplate?.slots.length} slots)</span>
            </label>

            <label className="flex items-center gap-1.5 text-white cursor-pointer">
              <input
                type="radio"
                name="applyMode"
                value="merge"
                checked={applyMode === 'merge'}
                onChange={() => setApplyMode('merge')}
                className="accent-red-600"
              />
              <span>Merge with Existing</span>
            </label>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply "{selectedTemplate?.name}"</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
