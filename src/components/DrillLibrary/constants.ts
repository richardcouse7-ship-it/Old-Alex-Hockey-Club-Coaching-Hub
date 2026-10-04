import { AgeGroup, DrillDiagramElement } from '../../types';

export interface LeinsterSkillFilter {
  id: string;
  label: string;
  badge: string;
  keywords: string[];
}

export const LEINSTER_CURRICULUM_SKILLS: LeinsterSkillFilter[] = [
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

export interface PitchStarterPreset {
  name: string;
  description: string;
  elements: DrillDiagramElement[];
}

export const PITCH_STARTER_PRESETS: PitchStarterPreset[] = [
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

export const ALL_AGE_GROUPS: AgeGroup[] = [
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

export type DurationFilter = 'ALL' | 'short' | 'standard' | 'extended';
