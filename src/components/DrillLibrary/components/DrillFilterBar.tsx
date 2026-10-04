import React from 'react';
import { Search, Users, Clock, X, Award } from 'lucide-react';
import { AgeGroup, Drill, Pathway } from '../../../types';
import { ALL_AGE_GROUPS, DurationFilter, LEINSTER_CURRICULUM_SKILLS } from '../constants';

export interface DrillFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedPathway: Pathway | 'ALL';
  onPathwayChange: (pathway: Pathway | 'ALL') => void;
  selectedAgeGroup: AgeGroup | 'ALL';
  onAgeGroupChange: (ageGroup: AgeGroup | 'ALL') => void;
  selectedDuration: DurationFilter;
  onDurationChange: (duration: DurationFilter) => void;
  selectedSkillFilter: string;
  onSkillFilterChange: (skillId: string) => void;
  totalDrillsCount: number;
  filteredDrillsCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  drills: Drill[];
}

export const DrillFilterBar: React.FC<DrillFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPathway,
  onPathwayChange,
  selectedAgeGroup,
  onAgeGroupChange,
  selectedDuration,
  onDurationChange,
  selectedSkillFilter,
  onSkillFilterChange,
  totalDrillsCount,
  filteredDrillsCount,
  hasActiveFilters,
  onResetFilters,
  drills,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search drills by skill, name, or keywords (e.g. 2v1, carrying, pressing)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-750 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Pathway Segmented Tabs */}
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800">
          {(['ALL', 'Foundation', 'Development', 'Youth Performance'] as const).map((pw) => (
            <button
              key={pw}
              type="button"
              onClick={() => onPathwayChange(pw)}
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
              onChange={(e) => onAgeGroupChange(e.target.value as AgeGroup | 'ALL')}
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
                  onClick={() => onDurationChange(dur.id)}
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
            Showing <strong className="text-white">{filteredDrillsCount}</strong> of {totalDrillsCount} drills
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
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
              onClick={() => onSkillFilterChange(skill.id)}
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
  );
};
