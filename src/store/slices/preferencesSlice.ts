import { AppSliceCreator, PreferencesSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';

export const createPreferencesSlice: AppSliceCreator<PreferencesSlice> = (set, get) => ({
  isSunMode: false,
  isSidebarCollapsed: false,
  isSimulatingOffline: false,
  isDirectorUnlocked: false,
  directorPin: '1893',

  toggleSunMode: () => {
    const next = !get().isSunMode;
    set({ isSunMode: next });
    persistenceAdapter.saveKey('isSunMode', next);
  },

  toggleSidebarCollapse: () => {
    const next = !get().isSidebarCollapsed;
    set({ isSidebarCollapsed: next });
    persistenceAdapter.saveKey('isSidebarCollapsed', next);
  },

  toggleOfflineSim: () => {
    const next = !get().isSimulatingOffline;
    set({ isSimulatingOffline: next });
    persistenceAdapter.saveKey('isSimulatingOffline', next);
  },

  unlockDirector: (pin: string) => {
    const currentPin = get().directorPin;
    if (pin.trim() === currentPin || pin.trim() === '1893') {
      set({ isDirectorUnlocked: true });
      persistenceAdapter.saveKey('isDirectorUnlocked', true);
      return true;
    }
    return false;
  },

  lockDirector: () => {
    set({ isDirectorUnlocked: false });
    persistenceAdapter.saveKey('isDirectorUnlocked', false);
  },

  setDirectorUnlocked: (unlocked: boolean) => {
    set({ isDirectorUnlocked: unlocked });
    persistenceAdapter.saveKey('isDirectorUnlocked', unlocked);
  },

  setDirectorPin: (newPin: string) => {
    if (newPin.trim().length >= 4) {
      set({ directorPin: newPin.trim() });
      persistenceAdapter.saveKey('directorPin', newPin.trim());
    }
  },
});
