export type WhistleType = 'short' | 'rotation' | 'fulltime';

export type TimerMode = 'station' | 'match' | 'session';

export type MatchPeriod = '1st Half' | '2nd Half' | 'Half-Time Break';

export interface DrillSegment {
  id: string;
  name: string;
  durationMinutes: number;
  category: 'warmup' | 'technical' | 'tactical' | 'game' | 'debrief';
  notes?: string;
  completed: boolean;
}
