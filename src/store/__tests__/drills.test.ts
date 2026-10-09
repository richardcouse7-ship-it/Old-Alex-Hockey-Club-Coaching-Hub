import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { Drill } from '../../types';
import { EXTENDED_DRILLS } from '../../data/extendedDrills';

describe('Drills Domain Store & Leinster Curriculum Alignment', () => {
  const sampleLeinsterDrill: Drill = {
    id: 'test-drill-leinster',
    title: 'Leinster PC Inject & Slip',
    pathway: 'Youth Performance',
    targetAgeGroups: ['Inters'],
    durationMinutes: 15,
    minPlayers: 6,
    maxPlayers: 12,
    skill: 'Penalty Corner Attack',
    setup: 'Half pitch setup with D circle',
    instructions: 'Inject ball, slip to P-spot, deflection into corner',
    coachingPoints: ['Stick angle down', 'Early vision'],
    equipment: ['12 balls', '4 cones'],
    competencyCategory: 'Penalty Corners & Set Pieces',
    leinsterLevel: 'Youth Performance (U16-Inters)',
    competencyCheckpoints: [
      'Injector hits baseline flush with accuracy',
      'Stopper cushions without bounce',
      'Slip angle executes before #1 runner arrives',
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().setDrills([sampleLeinsterDrill]);
  });

  it('correctly sets and retrieves drills with Leinster curriculum metadata', () => {
    const drills = useAppStore.getState().drills;
    expect(drills).toHaveLength(1);
    expect(drills[0].competencyCategory).toBe('Penalty Corners & Set Pieces');
    expect(drills[0].leinsterLevel).toBe('Youth Performance (U16-Inters)');
    expect(drills[0].competencyCheckpoints).toHaveLength(3);
  });

  it('adds a new drill with Leinster competencies', () => {
    const newDrill: Drill = {
      id: 'test-drill-press',
      title: '3-3 High Press Trap',
      pathway: 'Development',
      targetAgeGroups: ['5th Class', '6th Class'],
      durationMinutes: 20,
      minPlayers: 8,
      maxPlayers: 14,
      skill: 'Pressing',
      setup: 'Full pitch press',
      instructions: 'Channel out wide toward sideline trap',
      coachingPoints: ['Body shape closed to sideline'],
      equipment: ['10 cones'],
      competencyCategory: 'Pressing & Team Structure',
      leinsterLevel: 'Development (U12-U14)',
      competencyCheckpoints: ['CF cuts inside pass lane'],
    };

    useAppStore.getState().addDrill(newDrill);
    const drills = useAppStore.getState().drills;
    expect(drills).toHaveLength(2);
    expect(drills[0].id).toBe('test-drill-press');
    expect(drills[0].competencyCategory).toBe('Pressing & Team Structure');
  });

  it('updates an existing drill to add Leinster mastery checkpoints', () => {
    const updated = {
      ...sampleLeinsterDrill,
      competencyCheckpoints: [
        ...sampleLeinsterDrill.competencyCheckpoints!,
        'Far post deflection on bottom board',
      ],
    };

    useAppStore.getState().updateDrill(updated);
    const found = useAppStore.getState().drills.find((d) => d.id === sampleLeinsterDrill.id);
    expect(found?.competencyCheckpoints).toHaveLength(4);
    expect(found?.competencyCheckpoints?.[3]).toBe('Far post deflection on bottom board');
  });

  it('deletes a drill cleanly', () => {
    useAppStore.getState().deleteDrill(sampleLeinsterDrill.id);
    expect(useAppStore.getState().drills).toHaveLength(0);
  });

  it('contains all 22 official Leinster curriculum drills (drill-46 through drill-67) in EXTENDED_DRILLS seed dataset', () => {
    const leinsterDrillIds = [
      'drill-46',
      'drill-47',
      'drill-48',
      'drill-49',
      'drill-50',
      'drill-51',
      'drill-52',
      'drill-53',
      'drill-54',
      'drill-55',
      'drill-56',
      'drill-57',
      'drill-58',
      'drill-59',
      'drill-60',
      'drill-61',
      'drill-62',
      'drill-63',
      'drill-64',
      'drill-65',
      'drill-66',
      'drill-67',
    ];

    for (const id of leinsterDrillIds) {
      const drill = EXTENDED_DRILLS.find((d) => d.id === id);
      expect(drill, `Drill ${id} should exist in EXTENDED_DRILLS`).toBeDefined();
      expect(drill?.competencyCategory).toBeTruthy();
      expect(drill?.leinsterLevel).toBeTruthy();
      expect(drill?.competencyCheckpoints?.length).toBeGreaterThanOrEqual(3);
      expect(drill?.diagramElements?.length).toBeGreaterThan(0);
      expect(drill?.coachingPoints?.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('guarantees balanced pathway coverage across Foundation, Development, and Youth Performance', () => {
    const foundation = EXTENDED_DRILLS.filter((d) => d.pathway === 'Foundation');
    const development = EXTENDED_DRILLS.filter((d) => d.pathway === 'Development');
    const youthPerf = EXTENDED_DRILLS.filter((d) => d.pathway === 'Youth Performance');

    expect(foundation.length).toBeGreaterThanOrEqual(6);
    expect(development.length).toBeGreaterThanOrEqual(10);
    expect(youthPerf.length).toBeGreaterThanOrEqual(12);
  });
});
