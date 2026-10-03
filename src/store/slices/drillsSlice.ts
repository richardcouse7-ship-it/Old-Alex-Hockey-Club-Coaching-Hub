import { AppSliceCreator, DrillsSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { Drill } from '../../types';

export const createDrillsSlice: AppSliceCreator<DrillsSlice> = (set, get) => ({
  drills: [],

  setDrills: (drills: Drill[]) => {
    set({ drills });
    persistenceAdapter.saveKey('drills', drills);
  },

  addDrill: (drill: Drill) => {
    const next = [drill, ...get().drills];
    set({ drills: next });
    persistenceAdapter.saveKey('drills', next);
  },

  updateDrill: (drill: Drill) => {
    const next = get().drills.map((d) => (d.id === drill.id ? drill : d));
    set({ drills: next });
    persistenceAdapter.saveKey('drills', next);
  },

  deleteDrill: (drillId: string) => {
    const next = get().drills.filter((d) => d.id !== drillId);
    set({ drills: next });
    persistenceAdapter.saveKey('drills', next);
  },
});
