import { create } from 'zustand';
import { AppState } from './types';
import { createSlotsSlice } from './slices/slotsSlice';
import { createCoachesSlice } from './slices/coachesSlice';
import { createFixturesSlice } from './slices/fixturesSlice';
import { createOperationsSlice } from './slices/operationsSlice';
import { createDrillsSlice } from './slices/drillsSlice';
import { createNavigationSlice } from './slices/navigationSlice';
import { createUiSlice } from './slices/uiSlice';
import { createPreferencesSlice } from './slices/preferencesSlice';
import { persistenceAdapter } from './persistence/LocalStoragePersistenceAdapter';

export const useAppStore = create<AppState>()((...a) => ({
  ...createSlotsSlice(...a),
  ...createCoachesSlice(...a),
  ...createFixturesSlice(...a),
  ...createOperationsSlice(...a),
  ...createDrillsSlice(...a),
  ...createNavigationSlice(...a),
  ...createUiSlice(...a),
  ...createPreferencesSlice(...a),
}));

// Hydrate store from PersistenceAdapter (100% backward compatible with existing localStorage)
const initialPersistedState = persistenceAdapter.load();
useAppStore.setState(initialPersistedState);

if (typeof window !== 'undefined') {
  (window as any).__store = useAppStore;
}

export * from './types';
export * from './selectors';
export { persistenceAdapter } from './persistence/LocalStoragePersistenceAdapter';
