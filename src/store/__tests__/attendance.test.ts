import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../index';
import { Player } from '../../types';

describe('Player Roster and Attendance Roll Call', () => {
  const synthPlayer1: Player = {
    id: 'synth-p1',
    name: 'Synthetic Player One',
    ageGroupId: '3rd Class',
    parentName: 'Parent One',
    parentPhone: '0871111111',
    emergencyContactPhone: '0871111111',
    isActive: true,
  };

  const synthPlayer2: Player = {
    id: 'synth-p2',
    name: 'Synthetic Player Two',
    ageGroupId: '3rd Class',
    parentName: 'Parent Two',
    parentPhone: '0872222222',
    emergencyContactPhone: '0872222222',
    isActive: true,
  };

  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().setPlayers([synthPlayer1, synthPlayer2]);
    // Reset attendance map in store
    useAppStore.setState({ attendance: {} });
  });

  it('adds and updates player profiles safely', () => {
    const newPlayer: Player = {
      id: 'synth-p3',
      name: 'Synthetic Player Three',
      ageGroupId: '4th Class',
      parentName: 'Parent Three',
      parentPhone: '0873333333',
      emergencyContactPhone: '0873333333',
      isActive: true,
    };

    useAppStore.getState().addPlayer(newPlayer);
    expect(useAppStore.getState().players.length).toBe(3);

    useAppStore.getState().updatePlayer('synth-p3', {
      medicalNotes: 'Asthma inhaler in kit bag',
    });

    const updated = useAppStore.getState().players.find((p) => p.id === 'synth-p3');
    expect(updated?.medicalNotes).toBe('Asthma inhaler in kit bag');
  });

  it('records player attendance status by date and age group', () => {
    useAppStore.getState().recordPlayerAttendanceStatus(
      '2026-09-13',
      '3rd Class',
      'synth-p1',
      'present',
      'Arrived on time'
    );

    const records = useAppStore.getState().attendance['2026-09-13'] || [];
    expect(records.length).toBe(1);
    expect(records[0].playerId).toBe('synth-p1');
    expect(records[0].status).toBe('present');
    expect(records[0].notes).toBe('Arrived on time');

    // Change status to injured
    useAppStore.getState().recordPlayerAttendanceStatus(
      '2026-09-13',
      '3rd Class',
      'synth-p1',
      'injured',
      'Twisted ankle'
    );

    const updatedRecords = useAppStore.getState().attendance['2026-09-13'];
    expect(updatedRecords.length).toBe(1);
    expect(updatedRecords[0].status).toBe('injured');
    expect(updatedRecords[0].notes).toBe('Twisted ankle');
  });

  it('marks entire squad present and verifies gear in bulk', () => {
    const players = useAppStore.getState().players;

    // Mark squad present
    useAppStore.getState().markSquadPresent('2026-09-13', '3rd Class', players);

    let dateRecords = useAppStore.getState().attendance['2026-09-13'] || [];
    expect(dateRecords.length).toBe(2);
    expect(dateRecords.every((r) => r.status === 'present')).toBe(true);

    // Bulk verify gear
    useAppStore.getState().bulkVerifySquadGear('2026-09-13', '3rd Class', players);
    dateRecords = useAppStore.getState().attendance['2026-09-13'] || [];
    expect(dateRecords.every((r) => r.gearChecked === true)).toBe(true);
  });

  it('isolates attendance records across different dates', () => {
    useAppStore.getState().recordPlayerAttendanceStatus(
      '2026-09-13',
      '3rd Class',
      'synth-p1',
      'present'
    );

    useAppStore.getState().recordPlayerAttendanceStatus(
      '2026-09-20',
      '3rd Class',
      'synth-p1',
      'absent'
    );

    const sep13 = useAppStore.getState().attendance['2026-09-13'];
    const sep20 = useAppStore.getState().attendance['2026-09-20'];

    expect(sep13[0].status).toBe('present');
    expect(sep20[0].status).toBe('absent');
  });
});
