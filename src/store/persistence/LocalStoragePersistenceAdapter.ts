import { PersistenceAdapter } from './PersistenceAdapter';
import { AppState } from '../types';
import { loadValidatedDomainData, safeGetStorage, safeSetStorage, STORAGE_KEYS } from './migration';
import { StorageService } from '../../services/storageService';

/**
 * LocalStorage adapter implementation wrapping the established StorageService and keys.
 * Preserves 100% of existing Old Alex localStorage data.
 */
export class LocalStoragePersistenceAdapter implements PersistenceAdapter {
  public load(): Partial<AppState> {
    const validated = loadValidatedDomainData();

    return {
      slots: validated.slots,
      coaches: validated.coaches,
      drills: validated.drills,
      checklist: validated.checklist,
      availability: validated.availability,
      sectorGear: validated.sectorGear,
      firstAid: validated.firstAid,
      fixtures: validated.fixtures,
      customSundayTemplates: validated.customSundayTemplates,
      blitzTournaments: validated.blitzTournaments,
      whatsAppGroups: validated.whatsAppGroups,
      players: validated.players,
      attendance: validated.attendance,
      sectors: validated.sectors,
      isSunMode: validated.isSunMode,
      isSidebarCollapsed: validated.isSidebarCollapsed,
      isSimulatingOffline: validated.isSimulatingOffline,
      isDirectorUnlocked: validated.isDirectorUnlocked,
      directorPin: validated.directorPin,
    };
  }

  public save(state: Partial<AppState>): void {
    if (state.slots !== undefined) this.saveKey('slots', state.slots);
    if (state.coaches !== undefined) this.saveKey('coaches', state.coaches);
    if (state.drills !== undefined) this.saveKey('drills', state.drills);
    if (state.checklist !== undefined) this.saveKey('checklist', state.checklist);
    if (state.availability !== undefined) this.saveKey('availability', state.availability);
    if (state.sectorGear !== undefined) this.saveKey('sectorGear', state.sectorGear);
    if (state.firstAid !== undefined) this.saveKey('firstAid', state.firstAid);
    if (state.fixtures !== undefined) this.saveKey('fixtures', state.fixtures);
    if (state.customSundayTemplates !== undefined)
      this.saveKey('customSundayTemplates', state.customSundayTemplates);
    if (state.blitzTournaments !== undefined)
      this.saveKey('blitzTournaments', state.blitzTournaments);
    if (state.whatsAppGroups !== undefined)
      this.saveKey('whatsAppGroups', state.whatsAppGroups);
    if (state.players !== undefined) this.saveKey('players', state.players);
    if (state.attendance !== undefined) this.saveKey('attendance', state.attendance);
    if (state.isSunMode !== undefined) this.saveKey('isSunMode', state.isSunMode);
    if (state.isSidebarCollapsed !== undefined)
      this.saveKey('isSidebarCollapsed', state.isSidebarCollapsed);
    if (state.isSimulatingOffline !== undefined)
      this.saveKey('isSimulatingOffline', state.isSimulatingOffline);
    if (state.isDirectorUnlocked !== undefined)
      this.saveKey('isDirectorUnlocked', state.isDirectorUnlocked);
    if (state.directorPin !== undefined) this.saveKey('directorPin', state.directorPin);
    if (state.selectedDate !== undefined) this.saveKey('selectedDate', state.selectedDate);
  }

  public saveKey<K extends keyof AppState>(key: K, value: AppState[K]): void {
    switch (key) {
      case 'slots':
        StorageService.saveSlots(value as any);
        break;
      case 'coaches':
        StorageService.saveCoaches(value as any);
        break;
      case 'drills':
        StorageService.saveDrills(value as any);
        break;
      case 'checklist':
        StorageService.saveChecklist(value as any);
        break;
      case 'availability':
        StorageService.saveAvailability(value as any);
        break;
      case 'sectorGear':
        StorageService.saveSectorGear(value as any);
        break;
      case 'firstAid':
        StorageService.saveFirstAid(value as any);
        break;
      case 'fixtures':
        StorageService.saveFixtures(value as any);
        break;
      case 'customSundayTemplates':
        safeSetStorage(STORAGE_KEYS.CUSTOM_TEMPLATES, value);
        break;
      case 'blitzTournaments':
        StorageService.saveBlitzTournaments(value as any);
        break;
      case 'whatsAppGroups':
        StorageService.saveWhatsAppGroups(value as any);
        break;
      case 'players':
        StorageService.savePlayers(value as any);
        break;
      case 'attendance':
        safeSetStorage(STORAGE_KEYS.ATTENDANCE, value);
        break;
      case 'isSunMode':
        StorageService.saveSunMode(value as any);
        break;
      case 'isSidebarCollapsed':
        StorageService.saveSidebarCollapsed(value as any);
        break;
      case 'isSimulatingOffline':
        StorageService.setOfflineSimMode(value as any);
        break;
      case 'isDirectorUnlocked':
        StorageService.setDirectorUnlocked(value as any);
        break;
      case 'directorPin':
        StorageService.setDirectorPin(value as any);
        break;
      case 'selectedDate':
      case 'selected_date' as any:
        safeSetStorage(STORAGE_KEYS.SELECTED_DATE, value);
        break;
      default:
        // Ephemeral state keys (navigation, modals, toast) are intentionally unpersisted
        break;
    }
  }

  public loadKey<K extends keyof AppState>(key: K): AppState[K] | undefined {
    switch (key) {
      case 'selectedDate':
      case 'selected_date' as any:
        return safeGetStorage<string | undefined>(STORAGE_KEYS.SELECTED_DATE, undefined) as any;
      default:
        return undefined;
    }
  }
}

export const persistenceAdapter = new LocalStoragePersistenceAdapter();
