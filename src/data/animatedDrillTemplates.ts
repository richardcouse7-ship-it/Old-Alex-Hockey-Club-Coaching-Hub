import { DrillAnimationFrame } from '../types';

export interface AnimatedPlay {
  id: string;
  title: string;
  category: 'Overload' | 'Elimination' | 'Pressing' | 'Penalty Corner' | 'Circle Entry';
  durationSeconds: number;
  pitchArea: 'Half Pitch Attack' | 'Full Pitch' | 'Penalty Corner' | 'Right Flank';
  tacticalObjective: string;
  coachingKeyHabits: string[];
  frames: DrillAnimationFrame[];
}

export const ANIMATED_TACTICAL_PLAYS: AnimatedPlay[] = [
  // 1. 2v1 OVERLOAD & COMMIT DEFENDER
  {
    id: 'play-2v1-overload',
    title: '2v1 Overload: Commit Defender & Circle Strike',
    category: 'Overload',
    durationSeconds: 3.5,
    pitchArea: 'Half Pitch Attack',
    tacticalObjective:
      'Teach the ball carrier to carry aggressively toward the lone defender to commit their feet, before slipping a pinpoint pass to the open diagonal runner.',
    coachingKeyHabits: [
      'Ball carrier must look up to fix defender before passing',
      'Off-ball runner angles lead behind defender back',
      'First-time circle strike or deflection',
    ],
    frames: [
      {
        id: 'f1',
        frameNumber: 1,
        title: 'Phase 1: Initial Shape & Approach',
        description:
          'Ball carrier (Att 1) carries forward. Attacker 2 makes a wide lead to stretch the pitch.',
        durationSeconds: 3,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'player', x: 180, y: 170, label: 'Att 1', color: '#9333ea' },
          { type: 'ball', x: 198, y: 170 },
          { type: 'player', x: 220, y: 90, label: 'Att 2', color: '#9333ea' },
          { type: 'defender', x: 330, y: 160, label: 'Def 1', color: '#dc2626' },
          { type: 'run_arrow', x: 180, y: 170, toX: 280, toY: 170, color: '#f59e0b' },
          { type: 'run_arrow', x: 220, y: 90, toX: 370, toY: 110, color: '#f59e0b' },
        ],
      },
      {
        id: 'f2',
        frameNumber: 2,
        title: 'Phase 2: Commit Defender & Diagonal Cut',
        description:
          'Attacker 1 steps directly into defender channel. Defender commits forward. Attacker 2 bursts into open circle space.',
        durationSeconds: 3,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'player', x: 290, y: 170, label: 'Att 1', color: '#9333ea' },
          { type: 'ball', x: 305, y: 170 },
          { type: 'player', x: 380, y: 115, label: 'Att 2', color: '#9333ea' },
          { type: 'defender', x: 340, y: 165, label: 'Def 1', color: '#dc2626' },
          { type: 'pass_arrow', x: 305, y: 170, toX: 450, toY: 135, color: '#38bdf8' },
        ],
      },
      {
        id: 'f3',
        frameNumber: 3,
        title: 'Phase 3: Slip Pass & Goal Strike',
        description:
          'Attacker 1 releases a crisp push pass across. Attacker 2 receives with stick low and finishes into corner of goal.',
        durationSeconds: 3,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'player', x: 295, y: 170, label: 'Att 1', color: '#9333ea' },
          { type: 'defender', x: 345, y: 168, label: 'Def 1', color: '#dc2626' },
          { type: 'player', x: 460, y: 138, label: 'Att 2', color: '#9333ea' },
          { type: 'ball', x: 540, y: 160 },
          { type: 'pass_arrow', x: 460, y: 138, toX: 540, toY: 160, color: '#10b981' },
        ],
      },
    ],
  },

  // 2. GIVE-AND-GO (1-2 WALL PASS)
  {
    id: 'play-give-and-go',
    title: 'Give-and-Go: 1-2 Wall Pass Elimination',
    category: 'Elimination',
    durationSeconds: 3.0,
    pitchArea: 'Half Pitch Attack',
    tacticalObjective:
      'Eliminate a tight pressing midfielder by using a teammate as a wall board: pass and immediately sprint into space behind.',
    coachingKeyHabits: [
      'First pass must be crisp to receiver strong stick side',
      'Passer must NOT watch their pass—accelerate instantly off the mark',
      'Wall receiver plays first-time return pass into stride',
    ],
    frames: [
      {
        id: 'gg-1',
        frameNumber: 1,
        title: 'Phase 1: Pressing Challenge & Setup',
        description:
          'Attacker 1 carries under pressure from Defender. Support player Attacker 2 positions at a 45-degree angle.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'player', x: 160, y: 170, label: 'P1', color: '#9333ea' },
          { type: 'ball', x: 178, y: 170 },
          { type: 'defender', x: 235, y: 170, label: 'Def', color: '#dc2626' },
          { type: 'player', x: 275, y: 100, label: 'P2', color: '#9333ea' },
          { type: 'pass_arrow', x: 178, y: 170, toX: 270, toY: 105, color: '#38bdf8' },
        ],
      },
      {
        id: 'gg-2',
        frameNumber: 2,
        title: 'Phase 2: Wall Release & Off-Ball Sprint',
        description:
          'P1 releases to P2 and sprints immediately past the defender. Defender turns hips slowly.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'player', x: 250, y: 165, label: 'P1', color: '#9333ea' },
          { type: 'defender', x: 240, y: 170, label: 'Def', color: '#dc2626' },
          { type: 'player', x: 280, y: 100, label: 'P2', color: '#9333ea' },
          { type: 'ball', x: 280, y: 105 },
          { type: 'run_arrow', x: 250, y: 165, toX: 380, toY: 165, color: '#f59e0b' },
          { type: 'pass_arrow', x: 280, y: 105, toX: 375, toY: 160, color: '#38bdf8' },
        ],
      },
      {
        id: 'gg-3',
        frameNumber: 3,
        title: 'Phase 3: Return Pass into Stride',
        description:
          'P2 plays return pass into P1 leading run. P1 collects at top speed with defender completely eliminated.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'defender', x: 250, y: 175, label: 'Def', color: '#dc2626' },
          { type: 'player', x: 285, y: 105, label: 'P2', color: '#9333ea' },
          { type: 'player', x: 395, y: 160, label: 'P1', color: '#9333ea' },
          { type: 'ball', x: 412, y: 160 },
          { type: 'run_arrow', x: 395, y: 160, toX: 490, toY: 160, color: '#10b981' },
        ],
      },
    ],
  },

  // 3. 4-PLAYER CONNECTED FORWARD PRESS
  {
    id: 'play-connected-press',
    title: 'Old Alex 4-Player Connected Forward Press',
    category: 'Pressing',
    durationSeconds: 3.5,
    pitchArea: 'Full Pitch',
    tacticalObjective:
      'Deny central passing lanes and channel the opposition into a sideline turnover trap where 3 players close simultaneously.',
    coachingKeyHabits: [
      'Centre forward curves run to block switch pass',
      'Winger drops stick low to protect baseline pass',
      'Midfield pivot steps up to lock the interception pocket',
    ],
    frames: [
      {
        id: 'fp-1',
        frameNumber: 1,
        title: 'Phase 1: Opposition Free Hit & Alex Structure',
        description:
          'Opposition Centre Back (CB) has the ball at 16m line. Alex CF, LW, RW, and Mid form a connected umbrella.',
        durationSeconds: 3.2,
        elements: [
          { type: 'defender', x: 120, y: 170, label: 'CB', color: '#ffffff' },
          { type: 'ball', x: 135, y: 170 },
          { type: 'defender', x: 140, y: 70, label: 'RB', color: '#ffffff' },
          { type: 'player', x: 210, y: 170, label: 'CF', color: '#9333ea' },
          { type: 'player', x: 240, y: 90, label: 'LW', color: '#9333ea' },
          { type: 'player', x: 240, y: 250, label: 'RW', color: '#9333ea' },
          { type: 'player', x: 300, y: 170, label: 'Mid', color: '#9333ea' },
          { type: 'run_arrow', x: 210, y: 170, toX: 160, toY: 155, color: '#f59e0b' },
        ],
      },
      {
        id: 'fp-2',
        frameNumber: 2,
        title: 'Phase 2: Curved Channeling Run & Sideline Pass',
        description:
          'CF curves run, cutting off left switch. Opposition CB is forced to pass wide to RB on the right sideline.',
        durationSeconds: 3.2,
        elements: [
          { type: 'defender', x: 130, y: 170, label: 'CB', color: '#ffffff' },
          { type: 'defender', x: 155, y: 70, label: 'RB', color: '#ffffff' },
          { type: 'pass_arrow', x: 135, y: 170, toX: 165, toY: 75, color: '#dc2626' },
          { type: 'player', x: 175, y: 150, label: 'CF', color: '#9333ea' },
          { type: 'player', x: 200, y: 85, label: 'LW', color: '#9333ea' },
          { type: 'player', x: 260, y: 210, label: 'RW', color: '#9333ea' },
          { type: 'player', x: 245, y: 135, label: 'Mid', color: '#9333ea' },
          { type: 'run_arrow', x: 200, y: 85, toX: 168, toY: 76, color: '#f59e0b' },
        ],
      },
      {
        id: 'fp-3',
        frameNumber: 3,
        title: 'Phase 3: The Alex Sideline Trap & Turnover',
        description:
          'LW traps the ball, CF locks backwards pass, Mid locks inside outlet. Turnover won in attacking 23m!',
        durationSeconds: 3.2,
        elements: [
          { type: 'defender', x: 160, y: 75, label: 'RB', color: '#ffffff' },
          { type: 'player', x: 170, y: 72, label: 'LW', color: '#9333ea' },
          { type: 'ball', x: 170, y: 72 },
          { type: 'player', x: 175, y: 120, label: 'CF', color: '#9333ea' },
          { type: 'player', x: 210, y: 110, label: 'Mid', color: '#9333ea' },
          { type: 'run_arrow', x: 170, y: 72, toX: 250, toY: 150, color: '#10b981' },
        ],
      },
    ],
  },

  // 4. PENALTY CORNER SLIP TO RIGHT CASTLE
  {
    id: 'play-penalty-corner-slip',
    title: 'Penalty Corner: Injection & Right Castle Slip',
    category: 'Penalty Corner',
    durationSeconds: 3.8,
    pitchArea: 'Penalty Corner',
    tacticalObjective:
      'Fast baseline injection to the central stopper, drawing out the defensive first runner before slipping to the right castle for a low sweep.',
    coachingKeyHabits: [
      'Injection must be flat and hard along turf',
      'Stopper cushions ball dead on line with soft wrists',
      'Striker takes one stride and hits low to left corner',
    ],
    frames: [
      {
        id: 'pc-1',
        frameNumber: 1,
        title: 'Phase 1: Baseline Injection Push',
        description:
          'Injector powers ball from baseline towards Stopper at the top of the circle.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'defender', x: 545, y: 170, label: 'GK', color: '#f59e0b' },
          { type: 'player', x: 550, y: 60, label: 'Inj', color: '#9333ea' },
          { type: 'ball', x: 540, y: 65 },
          { type: 'player', x: 380, y: 170, label: 'Stop', color: '#9333ea' },
          { type: 'player', x: 375, y: 220, label: 'Castle R', color: '#9333ea' },
          { type: 'player', x: 375, y: 120, label: 'Castle L', color: '#9333ea' },
          { type: 'pass_arrow', x: 540, y: 65, toX: 395, toY: 170, color: '#38bdf8' },
        ],
      },
      {
        id: 'pc-2',
        frameNumber: 2,
        title: 'Phase 2: Ball Trap & Runner Draw',
        description:
          'Stopper cushions the ball cleanly. Defending runner sprints out, committing straight at the central stopper.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'defender', x: 545, y: 170, label: 'GK', color: '#f59e0b' },
          { type: 'defender', x: 460, y: 170, label: 'Runner 1', color: '#dc2626' },
          { type: 'player', x: 385, y: 170, label: 'Stop', color: '#9333ea' },
          { type: 'ball', x: 390, y: 170 },
          { type: 'player', x: 375, y: 220, label: 'Castle R', color: '#9333ea' },
          { type: 'pass_arrow', x: 390, y: 170, toX: 380, toY: 220, color: '#38bdf8' },
        ],
      },
      {
        id: 'pc-3',
        frameNumber: 3,
        title: 'Phase 3: Slip to Right Castle & Low Strike',
        description:
          'Stopper slips ball 2 meters right. Striker sweeps low past the diving goalkeeper into bottom corner!',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'defender', x: 540, y: 180, label: 'GK', color: '#f59e0b' },
          { type: 'defender', x: 420, y: 170, label: 'Runner 1', color: '#dc2626' },
          { type: 'player', x: 385, y: 170, label: 'Stop', color: '#9333ea' },
          { type: 'player', x: 380, y: 220, label: 'Castle R', color: '#9333ea' },
          { type: 'ball', x: 540, y: 155 },
          { type: 'pass_arrow', x: 380, y: 220, toX: 540, toY: 155, color: '#10b981' },
        ],
      },
    ],
  },

  // 5. 3D ELIMINATION & BASELINE CIRCLE CUT
  {
    id: 'play-3d-baseline',
    title: '3D Elimination & Baseline Cutback',
    category: 'Circle Entry',
    durationSeconds: 3.2,
    pitchArea: 'Right Flank',
    tacticalObjective:
      'Use a subtle 3D stick pop over a flat defender stick, carry along the baseline, and pull back to the penalty spot runner.',
    coachingKeyHabits: [
      'Gently pop ball 2 inches high using bottom edge twist',
      'Keep head up while accelerating along baseline',
      'Firm flat pass back to the penalty spot runner (do not shoot into keeper pads)',
    ],
    frames: [
      {
        id: 'el-1',
        frameNumber: 1,
        title: 'Phase 1: Baseline Drive & Defender Challenge',
        description:
          'Right Winger (RW) drives along the right flank. Defender drops into a low flat-stick tackle.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'player', x: 320, y: 70, label: 'RW', color: '#9333ea' },
          { type: 'ball', x: 335, y: 70 },
          { type: 'defender', x: 380, y: 75, label: 'Def', color: '#dc2626' },
          { type: 'player', x: 410, y: 160, label: 'Spot', color: '#9333ea' },
          { type: 'run_arrow', x: 320, y: 70, toX: 380, toY: 65, color: '#f59e0b' },
        ],
      },
      {
        id: 'el-2',
        frameNumber: 2,
        title: 'Phase 2: 3D Lift Over Stick & Baseline Carry',
        description:
          'RW pops ball over the stick, lands cleanly on turf, and accelerates along the baseline behind the defender.',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'defender', x: 380, y: 80, label: 'Def', color: '#dc2626' },
          { type: 'player', x: 470, y: 65, label: 'RW', color: '#9333ea' },
          { type: 'ball', x: 485, y: 65 },
          { type: 'player', x: 440, y: 160, label: 'Spot', color: '#9333ea' },
          { type: 'pass_arrow', x: 485, y: 65, toX: 470, toY: 155, color: '#38bdf8' },
        ],
      },
      {
        id: 'el-3',
        frameNumber: 3,
        title: 'Phase 3: Firm Cutback & First-Time Finish',
        description:
          'RW pulls the ball back to the penalty spot. Spot runner fires first-time into the open net!',
        durationSeconds: 2.8,
        elements: [
          { type: 'goal', x: 550, y: 170, color: '#ffffff' },
          { type: 'defender', x: 390, y: 85, label: 'Def', color: '#dc2626' },
          { type: 'player', x: 490, y: 68, label: 'RW', color: '#9333ea' },
          { type: 'player', x: 475, y: 155, label: 'Spot', color: '#9333ea' },
          { type: 'ball', x: 540, y: 165 },
          { type: 'pass_arrow', x: 475, y: 155, toX: 540, toY: 165, color: '#10b981' },
        ],
      },
    ],
  },
];
