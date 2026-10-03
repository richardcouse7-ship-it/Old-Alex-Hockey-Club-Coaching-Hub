import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  Users,
  Tag,
  Filter,
  Layers,
  ChevronRight,
  Edit2,
  X,
  Sparkles,
  Layout,
  Award,
  PenTool,
  Check,
  Play,
} from 'lucide-react';
import { AgeGroup, Drill, DrillDiagramElement, Pathway } from '../../types';
import { TacticalDiagram } from '../TacticalBoard/TacticalDiagram';
import { TacticalWhiteboard } from '../TacticalBoard/TacticalWhiteboard';
import { TacticalDrillAnimator } from '../TacticalBoard/TacticalDrillAnimator';

interface LeinsterSkillFilter {
  id: string;
  label: string;
  badge: string;
  keywords: string[];
}

const LEINSTER_CURRICULUM_SKILLS: LeinsterSkillFilter[] = [
  { id: 'ALL', label: 'All Curriculum Skills', badge: 'All', keywords: [] },
  {
    id: 'elimination',
    label: 'Elimination & 3D Skills',
    badge: '3D Skills',
    keywords: ['elimination', '3d', 'v-drag', 'lift', 'jink', 'carrying', 'dribbling', 'carry'],
  },
  {
    id: 'passing',
    label: 'Passing & First Touch',
    badge: 'Passing',
    keywords: ['passing', 'pass', 'give-and-go', 'receiving', 'first touch', 'push', 'wall pass'],
  },
  {
    id: 'tackling',
    label: '1v1 Tackling & Channeling',
    badge: '1v1 Defense',
    keywords: ['tackle', 'channeling', 'jab', 'defending', 'containment', 'defense', 'sideline'],
  },
  {
    id: 'overloads',
    label: '2v1 & Circle Overloads',
    badge: '2v1 Waves',
    keywords: ['2v1', 'overload', '3v2', 'circle entry', 'penetration', 'circle'],
  },
  {
    id: 'set_pieces',
    label: 'Penalty Corners & Set Pieces',
    badge: 'PC Tactics',
    keywords: ['penalty corner', 'pc', 'routine', 'injection', 'set piece', 'trapping'],
  },
  {
    id: 'goalkeeping',
    label: 'Goalkeeping & Deflections',
    badge: 'GK & Finishing',
    keywords: ['goalkeeping', 'gk', 'deflection', 'rebound', 'shot-stopping', 'circle shooting', 'shooting'],
  },
  {
    id: 'gameplay',
    label: 'Small-Sided Games & Blitz',
    badge: 'Match Play',
    keywords: ['game', 'blitz', 'match', 'tournament', 'super 7s', 'small-sided', 'conditioned'],
  },
];

const PITCH_STARTER_PRESETS: { name: string; description: string; elements: DrillDiagramElement[] }[] = [
  {
    name: '2v1 Overload Channel',
    description: '2 Attackers vs 1 Defender with passing lane & mini-goal',
    elements: [
      { type: 'cone', x: 80, y: 70, color: '#f97316' },
      { type: 'cone', x: 500, y: 70, color: '#f97316' },
      { type: 'cone', x: 500, y: 270, color: '#f97316' },
      { type: 'cone', x: 80, y: 270, color: '#f97316' },
      { type: 'player', x: 130, y: 130, label: 'A1' },
      { type: 'player', x: 130, y: 210, label: 'A2' },
      { type: 'defender', x: 300, y: 170, label: 'D1' },
      { type: 'pass_arrow', x: 145, y: 140, toX: 280, toY: 220, color: '#38bdf8' },
      { type: 'goal', x: 520, y: 170 },
      { type: 'ball', x: 150, y: 130 },
    ],
  },
  {
    name: '3D Elimination Slalom',
    description: 'Zig-zag cone gate with 3D lift obstacle & active tackle',
    elements: [
      { type: 'cone', x: 120, y: 170, color: '#eab308' },
      { type: 'cone', x: 220, y: 130, color: '#eab308' },
      { type: 'cone', x: 320, y: 210, color: '#eab308' },
      { type: 'cone', x: 420, y: 150, color: '#eab308' },
      { type: 'player', x: 75, y: 170, label: 'P1' },
      { type: 'ball', x: 95, y: 170 },
      { type: 'run_arrow', x: 100, y: 170, toX: 460, toY: 170, color: '#a855f7' },
      { type: 'defender', x: 480, y: 170, label: 'D1' },
    ],
  },
  {
    name: 'Circle Deflection & Post Finish',
    description: 'Striker baseline cross to far-post deflection & Goalkeeper',
    elements: [
      { type: 'goal', x: 520, y: 170 },
      { type: 'defender', x: 490, y: 170, label: 'GK' },
      { type: 'player', x: 430, y: 120, label: 'Post' },
      { type: 'player', x: 200, y: 220, label: 'Striker' },
      { type: 'ball', x: 215, y: 220 },
      { type: 'pass_arrow', x: 230, y: 210, toX: 420, toY: 130, color: '#38bdf8' },
      { type: 'cone', x: 300, y: 80, color: '#3b82f6' },
      { type: 'cone', x: 300, y: 260, color: '#3b82f6' },
    ],
  },
  {
    name: 'Passing Diamond Box',
    description: '4-cone continuous give-and-go rotation',
    elements: [
      { type: 'cone', x: 300, y: 60, color: '#10b981' },
      { type: 'cone', x: 480, y: 170, color: '#10b981' },
      { type: 'cone', x: 300, y: 280, color: '#10b981' },
      { type: 'cone', x: 120, y: 170, color: '#10b981' },
      { type: 'player', x: 300, y: 85, label: 'P1' },
      { type: 'player', x: 450, y: 170, label: 'P2' },
      { type: 'player', x: 300, y: 255, label: 'P3' },
      { type: 'player', x: 150, y: 170, label: 'P4' },
      { type: 'pass_arrow', x: 165, y: 170, toX: 285, toY: 85, color: '#38bdf8' },
      { type: 'pass_arrow', x: 315, y: 85, toX: 435, toY: 170, color: '#38bdf8' },
    ],
  },
  {
    name: 'Blank Turf Canvas',
    description: 'Clean turf sheet ready for custom diagramming',
    elements: [],
  },
];

interface DrillLibraryViewProps {
  drills: Drill[];
  onAddDrill: (drill: Drill) => void;
  onUpdateDrill: (drill: Drill) => void;
}

const ALL_AGE_GROUPS: AgeGroup[] = [
  'PEN',
  '1st Class',
  '2nd Class',
  '3rd Class',
  '4th Class',
  '5th Class',
  '6th Class',
  '1st Years',
  'Minors',
  'Inters',
];

export const DrillLibraryView: React.FC<DrillLibraryViewProps> = ({
  drills,
  onAddDrill,
  onUpdateDrill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPathway, setSelectedPathway] = useState<Pathway | 'ALL'>('ALL');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | 'ALL'>('ALL');
  const [selectedDuration, setSelectedDuration] = useState<'ALL' | 'short' | 'standard' | 'extended'>('ALL');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);

  // Tactical Whiteboard state
  const [whiteboardDrill, setWhiteboardDrill] = useState<Drill | null>(null);
  const [customNewElements, setCustomNewElements] = useState<DrillDiagramElement[]>(
    PITCH_STARTER_PRESETS[0].elements
  );
  const [showNewDrillWhiteboard, setShowNewDrillWhiteboard] = useState(false);
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

  // New drill form state
  const [newTitle, setNewTitle] = useState('');
  const [newPathway, setNewPathway] = useState<Pathway>('Foundation');
  const [newSkill, setNewSkill] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newSetup, setNewSetup] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newPoints, setNewPoints] = useState('');

  const handleOpenCreateModal = (presetElements?: DrillDiagramElement[]) => {
    setEditingDrillId(null);
    setNewTitle('');
    setNewPathway('Foundation');
    setNewSkill('');
    setNewDuration(15);
    setNewSetup('');
    setNewInstructions('');
    setNewPoints('');
    setCustomNewElements(presetElements || PITCH_STARTER_PRESETS[0].elements);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (drill: Drill) => {
    setEditingDrillId(drill.id);
    setNewTitle(drill.title);
    setNewPathway(drill.pathway);
    setNewSkill(drill.skill);
    setNewDuration(drill.durationMinutes);
    setNewSetup(drill.setup);
    setNewInstructions(drill.instructions);
    setNewPoints(drill.coachingPoints.join('\n'));
    setCustomNewElements(drill.diagramElements || PITCH_STARTER_PRESETS[0].elements);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
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

    if (editingDrillId) {
      const existing = drills.find((d) => d.id === editingDrillId);
      if (existing) {
        const updated: Drill = {
          ...existing,
          title: newTitle.trim(),
          pathway: newPathway,
          skill: newSkill.trim() || 'General Ball Skills',
          durationMinutes: newDuration,
          setup: newSetup.trim() || existing.setup,
          instructions: newInstructions.trim() || existing.instructions,
          coachingPoints: newPoints
            ? newPoints.split('\n').filter((p) => p.trim())
            : existing.coachingPoints,
          diagramElements: customNewElements.length > 0 ? customNewElements : existing.diagramElements,
        };
        onUpdateDrill(updated);
        if (selectedDrill?.id === updated.id) {
          setSelectedDrill(updated);
        }
      }
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
        equipment: ['Balls', 'Cones', 'Bibs'],
        diagramElements: customNewElements.length > 0 ? customNewElements : fallbackDiagram,
      };
      onAddDrill(created);
    }

    setShowCreateModal(false);
    setEditingDrillId(null);
    setCustomNewElements(PITCH_STARTER_PRESETS[0].elements);
    setNewTitle('');
    setNewSkill('');
    setNewSetup('');
    setNewInstructions('');
    setNewPoints('');
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
            onClick={() => handleOpenCreateModal()}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Drill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search drills by skill, name, or keywords (e.g. 2v1, carrying, pressing)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Pathway Segmented Tabs */}
          <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800">
            {(['ALL', 'Foundation', 'Development', 'Youth Performance'] as const).map((pw) => (
              <button
                key={pw}
                type="button"
                onClick={() => setSelectedPathway(pw)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                  selectedPathway === pw
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {pw === 'ALL' ? 'All Skill Levels' : pw}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Row: Age Group, Duration, and Quick Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-xl text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Age Group Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono-data text-neutral-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>Age Group:</span>
              </span>
              <select
                aria-label="Filter drills by age group"
                value={selectedAgeGroup}
                onChange={(e) => setSelectedAgeGroup(e.target.value as AgeGroup | 'ALL')}
                className="bg-black border border-neutral-750 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-500 cursor-pointer font-medium"
              >
                <option value="ALL">All Age Groups (PEN to Inters)</option>
                {ALL_AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono-data text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <span>Duration:</span>
              </span>
              <div className="flex items-center bg-black p-0.5 rounded-lg border border-neutral-800">
                {(
                  [
                    { id: 'ALL', label: 'All' },
                    { id: 'short', label: '≤ 10m' },
                    { id: 'standard', label: '11–15m' },
                    { id: 'extended', label: '16m+' },
                  ] as const
                ).map((dur) => (
                  <button
                    key={dur.id}
                    type="button"
                    onClick={() => setSelectedDuration(dur.id)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                      selectedDuration === dur.id
                        ? 'bg-neutral-800 text-white font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Status & Reset */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-data text-neutral-400">
              Showing <strong className="text-white">{filteredDrills.length}</strong> of {drills.length} drills
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2 py-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 rounded-lg flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Leinster Curriculum Skill Filter Tag Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Award className="w-3.5 h-3.5 text-red-500" />
            <span>Leinster Skill:</span>
          </span>
          {LEINSTER_CURRICULUM_SKILLS.map((skill) => {
            const isSelected = selectedSkillFilter === skill.id;
            const count =
              skill.id === 'ALL'
                ? drills.length
                : drills.filter((d) => {
                    const text = `${d.title} ${d.skill} ${d.setup} ${d.instructions} ${d.coachingPoints.join(' ')}`.toLowerCase();
                    return skill.keywords.some((kw) => text.includes(kw.toLowerCase()));
                  }).length;

            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => setSelectedSkillFilter(skill.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                <span>{skill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-data ${
                    isSelected ? 'bg-red-800 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Drills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredDrills.map((drill) => (
          <div
            key={drill.id}
            className="group bg-neutral-950 border border-neutral-800 hover:border-red-500 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg cursor-pointer"
            onClick={() => setSelectedDrill(drill)}
          >
            <div>
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    drill.pathway === 'Foundation'
                      ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                      : drill.pathway === 'Development'
                      ? 'bg-neutral-900 text-white border border-neutral-700'
                      : 'bg-red-600/20 text-red-300 border border-red-500/50'
                  }`}
                >
                  {drill.pathway}
                </span>

                <div className="flex items-center gap-3 text-[11px] font-mono-data text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-red-500" />
                    {drill.durationMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-neutral-400" />
                    {drill.minPlayers}–{drill.maxPlayers}
                  </span>
                </div>
              </div>

              {/* Title & Skill */}
              <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                {drill.title}
              </h3>
              <p className="text-xs text-red-400 font-semibold mt-0.5">{drill.skill}</p>

              {/* Pitch Diagram */}
              {drill.diagramElements && (
                <div className="mt-3 relative group/diag">
                  <TacticalDiagram
                    elements={drill.diagramElements}
                    height={160}
                    title={`${drill.title}`}
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnimatorDrill(drill);
                        setShowTacticalAnimator(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                      title="Watch animated drill walkthrough"
                    >
                      <Play className="w-3 h-3 fill-current text-red-400" />
                      <span>Animate</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWhiteboardDrill(drill);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                      title="Open interactive tactical whiteboard"
                    >
                      <Edit2 className="w-3 h-3 text-red-400" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Short setup */}
              <p className="text-xs text-neutral-300 mt-3 line-clamp-2 leading-relaxed">
                {drill.setup}
              </p>
            </div>

            {/* Card footer */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnimatorDrill(drill);
                    setShowTacticalAnimator(true);
                  }}
                  className="text-neutral-400 hover:text-white font-medium flex items-center gap-1 text-[11px]"
                >
                  <Play className="w-3 h-3 fill-current text-red-500" />
                  <span>Animate</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhiteboardDrill(drill);
                  }}
                  className="text-neutral-400 hover:text-white font-medium flex items-center gap-1 text-[11px]"
                >
                  <Edit2 className="w-3 h-3 text-neutral-400" />
                  <span>Edit</span>
                </button>
              </div>
              <span className="text-red-400 hover:text-red-300 font-bold group-hover:underline flex items-center gap-1">
                View Details <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Drill Detail Modal */}
      {selectedDrill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-black border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    selectedDrill.pathway === 'Foundation'
                      ? 'bg-neutral-900 text-emerald-300 border border-emerald-800'
                      : selectedDrill.pathway === 'Development'
                      ? 'bg-neutral-900 text-white border border-neutral-700'
                      : 'bg-red-600/20 text-red-300 border border-red-500/50'
                  }`}
                >
                  {selectedDrill.pathway} Pathway
                </span>
                <h2 className="text-2xl font-bold text-white mt-1.5">{selectedDrill.title}</h2>
                <p className="text-xs text-red-400 font-mono-data mt-0.5 font-bold">
                  Skill Focus: {selectedDrill.skill} · Duration: {selectedDrill.durationMinutes} mins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrill(null)}
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagram with edit launcher */}
            <div className="relative">
              {selectedDrill.diagramElements && (
                <TacticalDiagram
                  elements={selectedDrill.diagramElements}
                  title={`${selectedDrill.title} Pitch Schematic`}
                />
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnimatorDrill(selectedDrill);
                    setShowTacticalAnimator(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                  title="Watch dynamic animation of this drill"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-red-500" />
                  <span>Tactical Animation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWhiteboardDrill(selectedDrill)}
                  className="px-3 py-1.5 text-xs font-bold bg-black/90 hover:bg-red-950 text-white border border-neutral-750 hover:border-red-500 rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Whiteboard</span>
                </button>
              </div>
            </div>

            {/* Setup & Instructions */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                  Pitch & Equipment Setup
                </h4>
                <p className="text-xs text-neutral-200 mt-1 leading-relaxed">{selectedDrill.setup}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                  Drill Instructions & Rules
                </h4>
                <p className="text-xs text-neutral-200 mt-1 leading-relaxed">{selectedDrill.instructions}</p>
              </div>
            </div>

            {/* Coaching Points */}
            <div>
              <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-2">
                Key Coaching Points
              </h4>
              <ul className="space-y-1.5">
                {selectedDrill.coachingPoints.map((pt, i) => (
                  <li key={i} className="text-xs text-neutral-200 flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Equipment list */}
            <div>
              <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-1.5">
                Required Equipment
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedDrill.equipment.map((eq, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-white font-medium"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnimatorDrill(selectedDrill);
                    setShowTacticalAnimator(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-red-400" />
                  <span>Tactical Animation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWhiteboardDrill(selectedDrill)}
                  className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5 text-red-500" />
                  <span>Edit Pitch Diagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const drill = selectedDrill;
                    setSelectedDrill(null);
                    handleOpenEditModal(drill);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-750 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Edit Drill Details</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDrill(null)}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Drill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-black border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-mono-data text-red-500 font-bold uppercase tracking-wider">
                  Tactical Curriculum
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editingDrillId ? 'Edit Drill & Tactical Setup' : 'Create Custom Hockey Drill'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
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
                  onClick={() => setShowNewDrillWhiteboard(true)}
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
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{editingDrillId ? 'Save Drill Changes' : 'Save Drill to Library'}</span>
              </button>
            </div>
          </form>
        </div>
      )}


      {/* Tactical Whiteboard for Editing an Existing Drill */}
      {whiteboardDrill && (
        <TacticalWhiteboard
          initialElements={whiteboardDrill.diagramElements || []}
          title={`Edit Diagram: ${whiteboardDrill.title}`}
          onSave={handleSaveWhiteboardForDrill}
          onClose={() => setWhiteboardDrill(null)}
        />
      )}

      {/* Tactical Whiteboard for New Drill Creation */}
      {showNewDrillWhiteboard && (
        <TacticalWhiteboard
          initialElements={customNewElements}
          title="Design Custom Drill Pitch Setup"
          onSave={(elements) => {
            setCustomNewElements(elements);
            setShowNewDrillWhiteboard(false);
          }}
          onClose={() => setShowNewDrillWhiteboard(false)}
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
