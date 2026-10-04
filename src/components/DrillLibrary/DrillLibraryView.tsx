import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Play } from 'lucide-react';
import { AgeGroup, Drill, DrillDiagramElement, Pathway } from '../../types';
import { TacticalWhiteboard } from '../TacticalBoard/TacticalWhiteboard';
import { TacticalDrillAnimator } from '../TacticalBoard/TacticalDrillAnimator';
import { DurationFilter, LEINSTER_CURRICULUM_SKILLS } from './constants';
import { DrillFilterBar } from './components/DrillFilterBar';
import { DrillCardGrid } from './components/DrillCardGrid';
import { DrillDetailDrawer } from './components/DrillDetailDrawer';
import { DrillEditorModal } from './components/DrillEditorModal';

export interface DrillLibraryViewProps {
  drills: Drill[];
  onAddDrill: (drill: Drill) => void;
  onUpdateDrill: (drill: Drill) => void;
}

export const DrillLibraryView: React.FC<DrillLibraryViewProps> = ({
  drills,
  onAddDrill,
  onUpdateDrill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPathway, setSelectedPathway] = useState<Pathway | 'ALL'>('ALL');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | 'ALL'>('ALL');
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>('ALL');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drillToEdit, setDrillToEdit] = useState<Drill | null>(null);

  // Tactical Whiteboard state
  const [whiteboardDrill, setWhiteboardDrill] = useState<Drill | null>(null);
  const [showTacticalAnimator, setShowTacticalAnimator] = useState(false);
  const [animatorDrill, setAnimatorDrill] = useState<Drill | null>(null);

  const filteredDrills = useMemo(() => {
    return drills.filter((drill) => {
      // 1. Skill Level / Pathway
      if (selectedPathway !== 'ALL' && drill.pathway !== selectedPathway) return false;

      // 2. Age Group
      if (selectedAgeGroup !== 'ALL') {
        if (!drill.targetAgeGroups || !drill.targetAgeGroups.includes(selectedAgeGroup)) {
          return false;
        }
      }

      // 3. Duration
      if (selectedDuration !== 'ALL') {
        if (selectedDuration === 'short' && drill.durationMinutes > 10) return false;
        if (selectedDuration === 'standard' && (drill.durationMinutes <= 10 || drill.durationMinutes > 15)) return false;
        if (selectedDuration === 'extended' && drill.durationMinutes <= 15) return false;
      }

      // 4. Leinster Curriculum Skill Filter
      if (selectedSkillFilter !== 'ALL') {
        const skillObj = LEINSTER_CURRICULUM_SKILLS.find((s) => s.id === selectedSkillFilter);
        if (skillObj && skillObj.keywords.length > 0) {
          const textToSearch = `${drill.title} ${drill.skill} ${drill.setup} ${drill.instructions} ${drill.coachingPoints.join(' ')}`.toLowerCase();
          const matches = skillObj.keywords.some((kw) => textToSearch.includes(kw.toLowerCase()));
          if (!matches) return false;
        }
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchable = `${drill.title} ${drill.skill} ${drill.setup} ${drill.instructions} ${drill.coachingPoints.join(' ')} ${drill.targetAgeGroups?.join(' ') || ''}`.toLowerCase();
        return searchable.includes(q);
      }
      return true;
    });
  }, [drills, selectedPathway, selectedAgeGroup, selectedDuration, selectedSkillFilter, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedPathway !== 'ALL' ||
    selectedAgeGroup !== 'ALL' ||
    selectedDuration !== 'ALL' ||
    selectedSkillFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPathway('ALL');
    setSelectedAgeGroup('ALL');
    setSelectedDuration('ALL');
    setSelectedSkillFilter('ALL');
  };

  const handleOpenCreateModal = () => {
    setDrillToEdit(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (drill: Drill) => {
    setDrillToEdit(drill);
    setShowCreateModal(true);
  };

  const handleSaveDrill = (savedDrill: Drill) => {
    if (drillToEdit) {
      onUpdateDrill(savedDrill);
      if (selectedDrill?.id === savedDrill.id) {
        setSelectedDrill(savedDrill);
      }
    } else {
      onAddDrill(savedDrill);
    }
  };

  const handleSaveWhiteboardForDrill = (updatedElements: DrillDiagramElement[]) => {
    if (!whiteboardDrill) return;
    const updated: Drill = {
      ...whiteboardDrill,
      diagramElements: updatedElements,
    };
    onUpdateDrill(updated);
    if (selectedDrill?.id === updated.id) {
      setSelectedDrill(updated);
    }
    setWhiteboardDrill(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black border border-neutral-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-data text-red-500 font-bold uppercase">
              Curated Curriculum
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">95 Total Drill Variations</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
            <BookOpen className="w-6 h-6 text-red-500" />
            <span>Old Alex Drill Library</span>
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            Standardized tactical and skill exercises with interactive pitch setups and coaching points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAnimatorDrill(null);
              setShowTacticalAnimator(true);
            }}
            className="min-h-[44px] px-4 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-red-400 border border-red-500/40 hover:border-red-400 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Launch Interactive Tactical Drill Animator (Dugout Mode)"
          >
            <Play className="w-4 h-4 fill-current text-red-500" />
            <span>Tactical Animator</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Drill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <DrillFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPathway={selectedPathway}
        onPathwayChange={setSelectedPathway}
        selectedAgeGroup={selectedAgeGroup}
        onAgeGroupChange={setSelectedAgeGroup}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        selectedSkillFilter={selectedSkillFilter}
        onSkillFilterChange={setSelectedSkillFilter}
        totalDrillsCount={drills.length}
        filteredDrillsCount={filteredDrills.length}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        drills={drills}
      />

      {/* Drills Grid */}
      <DrillCardGrid
        drills={filteredDrills}
        onSelectDrill={setSelectedDrill}
        onAnimateDrill={(drill) => {
          setAnimatorDrill(drill);
          setShowTacticalAnimator(true);
        }}
        onEditDiagram={(drill) => setWhiteboardDrill(drill)}
      />

      {/* Drill Detail Drawer / Modal */}
      <DrillDetailDrawer
        drill={selectedDrill}
        onClose={() => setSelectedDrill(null)}
        onAnimateDrill={(drill) => {
          setAnimatorDrill(drill);
          setShowTacticalAnimator(true);
        }}
        onEditDiagram={(drill) => setWhiteboardDrill(drill)}
        onEditDrill={(drill) => {
          setSelectedDrill(null);
          handleOpenEditModal(drill);
        }}
      />

      {/* Create / Edit Drill Modal */}
      <DrillEditorModal
        isOpen={showCreateModal}
        drillToEdit={drillToEdit}
        onClose={() => {
          setShowCreateModal(false);
          setDrillToEdit(null);
        }}
        onSave={handleSaveDrill}
      />

      {/* Tactical Whiteboard for Editing an Existing Drill Diagram */}
      {whiteboardDrill && (
        <TacticalWhiteboard
          initialElements={whiteboardDrill.diagramElements || []}
          title={`Edit Diagram: ${whiteboardDrill.title}`}
          onSave={handleSaveWhiteboardForDrill}
          onClose={() => setWhiteboardDrill(null)}
        />
      )}

      {/* Interactive Tactical Drill Animator Modal */}
      <TacticalDrillAnimator
        isOpen={showTacticalAnimator}
        onClose={() => {
          setShowTacticalAnimator(false);
          setAnimatorDrill(null);
        }}
        customFrames={animatorDrill?.animationFrames}
        drillTitle={animatorDrill?.title}
      />
    </div>
  );
};
