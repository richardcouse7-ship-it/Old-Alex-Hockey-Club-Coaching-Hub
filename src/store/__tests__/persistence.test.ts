import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStoragePersistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { STORAGE_KEYS, safeGetStorage, safeSetStorage } from '../persistence/migration';
import { INITIAL_SESSION_SLOTS, COACHES } from '../../data/initialData';

describe('LocalStoragePersistenceAdapter and Migration Layer', () => {
  let adapter: LocalStoragePersistenceAdapter;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    adapter = new LocalStoragePersistenceAdapter();
  });

  describe('Storage Keys Backward Compatibility', () => {
    it('exact STORAGE_KEYS contract is strictly maintained without alteration', () => {
      // Must match the established oldalex_* keys to protect real user data
      expect(STORAGE_KEYS.SLOTS).toBe('oldalex_session_slots_v2');
      expect(STORAGE_KEYS.DRILLS).toBe('oldalex_drills_v1');
      expect(STORAGE_KEYS.COACHES).toBe('oldalex_coaches_v2');
      expect(STORAGE_KEYS.CHECKLIST).toBe('oldalex_prep_checklist_v1');
      expect(STORAGE_KEYS.NOTIFICATIONS).toBe('oldalex_notifications_v1');
      expect(STORAGE_KEYS.OFFLINE_SIM).toBe('oldalex_offline_sim_mode');
      expect(STORAGE_KEYS.AVAILABILITY).toBe('oldalex_coach_availability_v2');
      expect(STORAGE_KEYS.GEAR).toBe('oldalex_sector_gear_v2');
      expect(STORAGE_KEYS.FIRST_AID).toBe('oldalex_first_aid_v2');
      expect(STORAGE_KEYS.DIRECTOR_UNLOCKED).toBe('oldalex_director_unlocked_v1');
      expect(STORAGE_KEYS.DIRECTOR_PIN).toBe('oldalex_director_pin_v1');
      expect(STORAGE_KEYS.FIXTURES).toBe('oldalex_fixtures_v2');
      expect(STORAGE_KEYS.CUSTOM_TEMPLATES).toBe('oldalex_custom_sunday_templates_v1');
      expect(STORAGE_KEYS.WHATSAPP_GROUPS).toBe('oldalex_whatsapp_groups_v1');
      expect(STORAGE_KEYS.PLAYERS).toBe('oldalex_players_v2');
      expect(STORAGE_KEYS.ATTENDANCE).toBe('oldalex_attendance_v2');
      expect(STORAGE_KEYS.BLITZ_TOURNAMENTS).toBe('oldalex_blitz_tournaments_v2');
      expect(STORAGE_KEYS.SUN_MODE).toBe('oldalex_sun_mode_v1');
      expect(STORAGE_KEYS.SIDEBAR_COLLAPSED).toBe('oldalex_sidebar_collapsed_v1');
    });
  });

  describe('Safe Storage Helpers', () => {
    it('safeGetStorage returns defaultValue if key does not exist', () => {
      const fallback = [{ id: 'fallback-1' }];
      const result = safeGetStorage('non_existent_key', fallback);
      expect(result).toBe(fallback);
    });

    it('safeGetStorage returns parsed JSON if key exists', () => {
      localStorage.setItem('test_key', JSON.stringify({ name: 'Old Alex' }));
      const result = safeGetStorage('test_key', { name: 'Default' });
      expect(result).toEqual({ name: 'Old Alex' });
    });

    it('safeGetStorage catches JSON parse syntax error and returns fallback safely', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('corrupted_key', '{bad_json: missing_quotes');
      
      const result = safeGetStorage('corrupted_key', { safe: true });
      expect(result).toEqual({ safe: true });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('safeSetStorage serializes and writes value to localStorage', () => {
      safeSetStorage('set_test_key', { active: true, count: 42 });
      expect(localStorage.getItem('set_test_key')).toBe(JSON.stringify({ active: true, count: 42 }));
    });
  });

  describe('Adapter load() Behavior', () => {
    it('loads fallback defaults when localStorage is empty', () => {
      const loaded = adapter.load();
      expect(loaded.slots).toEqual(INITIAL_SESSION_SLOTS);
      expect(loaded.coaches).toEqual(COACHES);
      expect(loaded.isSunMode).toBe(false);
      expect(loaded.isSidebarCollapsed).toBe(false);
      expect(loaded.isDirectorUnlocked).toBe(false);
      expect(loaded.players).toEqual([]);
      expect(loaded.attendance).toEqual({});
    });

    it('loads persisted values when present in localStorage', () => {
      const testSlots = [
        {
          id: 'custom-slot-101',
          date: '2026-10-18',
          sectorId: 'sector-1',
          startTime: '09:00',
          endTime: '10:00',
          title: 'U14 Blitz Prep',
          ageGroup: 'U14',
          groupGender: 'Girls',
          coachIds: ['c1'],
          notes: 'Tactical',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(testSlots));
      localStorage.setItem(STORAGE_KEYS.SUN_MODE, JSON.stringify(true));
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(true));

      const loaded = adapter.load();
      expect(loaded.slots).toEqual(testSlots);
      expect(loaded.isSunMode).toBe(true);
      expect(loaded.isSidebarCollapsed).toBe(true);
    });

    it('recovers gracefully from corrupt non-array slot payload', () => {
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify({ notAnArray: true }));
      const loaded = adapter.load();
      expect(loaded.slots).toEqual(INITIAL_SESSION_SLOTS);
    });
  });

  describe('Adapter save() and saveKey() Behavior', () => {
    it('saves specific key to localStorage using saveKey', () => {
      const newSlots = [
        {
          id: 'slot-persisted-1',
          date: '2026-10-25',
          sectorId: 'sector-2',
          startTime: '10:00',
          endTime: '11:00',
          title: 'Goalkeeper Clinic',
          ageGroup: 'U16',
          groupGender: 'Boys',
          coachIds: [],
        },
      ];

      adapter.saveKey('slots', newSlots as any);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SLOTS) || '[]');
      expect(stored).toEqual(newSlots);
    });

    it('saves batch partial state using save()', () => {
      adapter.save({
        isSunMode: true,
        isSidebarCollapsed: true,
        customSundayTemplates: [
          {
            id: 'tmpl-1',
            name: 'Custom Blitz Morning',
            description: 'Custom blitz layout',
            badge: 'Custom',
            pitchCoverage: 'P1N',
            focusSummary: 'Blitz',
            slots: [],
          },
        ],
      });

      expect(localStorage.getItem(STORAGE_KEYS.SUN_MODE)).toBe('true');
      expect(localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)).toBe('true');
      const templates = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES) || '[]');
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('tmpl-1');
    });

    it('ignores unpersisted ephemeral keys gracefully', () => {
      // Ephemeral keys like activeModal, selectedDate, etc. should not crash saveKey
      expect(() => {
        adapter.saveKey('activeModal' as any, 'ADD_SLOT' as any);
      }).not.toThrow();
    });
  });
});
