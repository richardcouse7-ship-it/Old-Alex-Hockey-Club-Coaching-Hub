import React, { useState, useEffect } from 'react';
import { X, Sparkles, PenTool, Check } from 'lucide-react';
import { Drill, DrillDiagramElement, Pathway } from '../../../types';
import { PITCH_STARTER_PRESETS } from '../constants';
import { TacticalDiagram } from '../../TacticalBoard/TacticalDiagram';
import { TacticalWhiteboard } from '../../TacticalBoard/TacticalWhiteboard';

export interface DrillEditorModalProps {
  isOpen: boolean;
  drillToEdit: Drill | null;
  onClose: () => void;
  onSave: (drill: Drill) => void;
  presetElements?: DrillDiagramElement[];
}

export const DrillEditorModal: React.FC<DrillEditorModalProps> = ({
  isOpen,
  drillToEdit,
  onClose,
  onSave,
  presetElements,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newPathway, setNewPathway] = useState<Pathway>('Foundation');
  const [newSkill, setNewSkill] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newSetup, setNewSetup] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newEquipment, setNewEquipment] = useState('Balls, Cones, Bibs');
  const [customNewElements, setCustomNewElements] = useState<DrillDiagramElement[]>(
    PITCH_STARTER_PRESETS[0].elements
  );
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  useEffect(() => {
    if (drillToEdit) {
      setNewTitle(drillToEdit.title);
      setNewPathway(drillToEdit.pathway);
      setNewSkill(drillToEdit.skill);
      setNewDuration(drillToEdit.durationMinutes);
      setNewSetup(drillToEdit.setup);
      setNewInstructions(drillToEdit.instructions);
      setNewPoints(drillToEdit.coachingPoints.join('\n'));
      setNewEquipment(drillToEdit.equipment?.join(', ') || 'Balls, Cones, Bibs');
      setCustomNewElements(drillToEdit.diagramElements || PITCH_STARTER_PRESETS[0].elements);
    } else {
      setNewTitle('');
      setNewPathway('Foundation');
      setNewSkill('');
      setNewDuration(15);
      setNewSetup('');
      setNewInstructions('');
      setNewPoints('');
      setNewEquipment('Balls, Cones, Bibs');
      setCustomNewElements(presetElements || PITCH_STARTER_PRESETS[0].elements);
    }
  }, [drillToEdit, presetElements, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const fallbackDiagram: DrillDiagramElement[] = [
      { type: 'cone', x: 80, y: 70 },
      { type: 'cone', x: 380, y: 70 },
      { type: 'cone', x: 380, y: 170 },
      { type: 'cone', x: 80, y: 170 },
      { type: 'player', x: 140, y: 120, label: 'P1' },
      { type: 'player', x: 320, y: 120, label: 'P2' },
      { type: 'pass_arrow', x: 155, y: 120, toX: 305, toY: 120, color: '#38bdf8' },
    ];

    const parsedEquipment = newEquipment
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (drillToEdit) {
      const updated: Drill = {
        ...drillToEdit,
        title: newTitle.trim(),
        pathway: newPathway,
        skill: newSkill.trim() || 'General Ball Skills',
        durationMinutes: newDuration,
        setup: newSetup.trim() || drillToEdit.setup,
        instructions: newInstructions.trim() || drillToEdit.instructions,
        coachingPoints: newPoints
          ? newPoints.split('\n').filter((p) => p.trim())
          : drillToEdit.coachingPoints,
        equipment: parsedEquipment.length > 0 ? parsedEquipment : drillToEdit.equipment,
        diagramElements: customNewElements.length > 0 ? customNewElements : drillToEdit.diagramElements,
      };
      onSave(updated);
    } else {
      const created: Drill = {
        id: `drill-custom-${Date.now()}`,
        title: newTitle.trim(),
        pathway: newPathway,
        skill: newSkill.trim() || 'General Ball Skills',
        durationMinutes: newDuration,
        minPlayers: 6,
        maxPlayers: 18,
        targetAgeGroups: ['PEN', '1st Class', '2nd Class'],
        setup: newSetup.trim() || 'Standard pitch quadrant setup with cones.',
        instructions: newInstructions.trim() || 'Follow drill instructions as demonstrated.',
        coachingPoints: newPoints
          ? newPoints.split('\n').filter((p) => p.trim())
          : ['Two hands on stick', 'Head up to scan open space', 'Call for the ball early'],
        equipment: parsedEquipment.length > 0 ? parsedEquipment : ['Balls', 'Cones', 'Bibs'],
        diagramElements: customNewElements.length > 0 ? customNewElements : fallbackDiagram,
      };
      onSave(created);
    }

    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="bg-black border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                Tactical Curriculum
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {drillToEdit ? 'Edit Drill & Tactical Setup' : 'Create Custom Hockey Drill'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pitch Diagram Designer & Live Preview */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-500" />
                  <span>Visual Tactical Turf Canvas ({customNewElements.length} elements)</span>
                </span>
                <p className="text-[11px] text-neutral-400">
                  Place players, cones, ladders, goals, passes & runs on Milltown astro
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWhiteboard(true)}
                className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all self-start sm:self-auto shrink-0"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Open Pitch Canvas</span>
              </button>
            </div>

            {/* Pitch Starters Quick Select */}
            <div>
              <span className="text-[10px] font-mono-data text-neutral-400 uppercase font-bold block mb-1.5">
                Start From Tactical Preset:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PITCH_STARTER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomNewElements(preset.elements)}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 hover:border-red-500 text-left transition-colors"
                  >
                    <span className="text-[11px] font-bold text-white block truncate">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-neutral-400 block truncate">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Embedded Live Diagram Preview */}
            {customNewElements.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-inner">
                <TacticalDiagram
                  elements={customNewElements}
                  height={150}
                  title="Live Canvas Preview"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Drill Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="E.g. 3v2 Circle Overload Wave"
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Youth Pathway
              </label>
              <select
                value={newPathway}
                onChange={(e) => setNewPathway(e.target.value as Pathway)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Foundation">Foundation (PEN - 2nd Class)</option>
                <option value="Development">Development (3rd - 6th Class)</option>
                <option value="Youth Performance">Youth Performance (1st - Inters)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2 text-xs text-white font-mono-data focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Skill Focus Tag
            </label>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="E.g. 3D Elimination, 2v1 Overload, Penalty Corner"
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Required Equipment (comma separated)
            </label>
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="E.g. Balls, Cones, Bibs, Junior Goal"
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Pitch Setup & Dimensions
            </label>
            <textarea
              rows={2}
              value={newSetup}
              onChange={(e) => setNewSetup(e.target.value)}
              placeholder="E.g. 25m x 15m channel. Cones set at 5m intervals. 1 junior goal."
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Instructions & Player Rotation
            </label>
            <textarea
              rows={2}
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              placeholder="E.g. A1 passes into A2. A2 drives at defender D1 before releasing pass back..."
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Key Coaching Points (one per line)
            </label>
            <textarea
              rows={2}
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
              placeholder="Two hands on the stick&#10;Commit the defender before releasing the ball&#10;Head up to spot far post deflection"
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-750 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{drillToEdit ? 'Save Drill Changes' : 'Save Drill to Library'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Whiteboard when triggered from editor */}
      {showWhiteboard && (
        <TacticalWhiteboard
          initialElements={customNewElements}
          title="Design Custom Drill Pitch Setup"
          onSave={(elements) => {
            setCustomNewElements(elements);
            setShowWhiteboard(false);
          }}
          onClose={() => setShowWhiteboard(false)}
        />
      )}
    </>
  );
};
