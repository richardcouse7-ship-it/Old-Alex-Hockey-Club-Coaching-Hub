import { AppSliceCreator, NavigationSlice } from '../types';
import { persistenceAdapter } from '../persistence/LocalStoragePersistenceAdapter';
import { getUpcomingSunday } from '../../utils/dateUtils';

export const createNavigationSlice: AppSliceCreator<NavigationSlice> = (set) => {
  const initialSelectedDate =
    (persistenceAdapter.loadKey?.('selected_date' as any) as string | undefined) ||
    getUpcomingSunday();

  return {
    currentTab: 'dashboard',
    selectedDate: initialSelectedDate,

    setCurrentTab: (currentTab: string) => {
      set({ currentTab });
    },

    setSelectedDate: (selectedDate: string) => {
      set({ selectedDate });
      persistenceAdapter.saveKey('selected_date' as any, selectedDate);
    },
  };
};

