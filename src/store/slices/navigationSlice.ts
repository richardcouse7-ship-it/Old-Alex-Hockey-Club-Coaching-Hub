import { AppSliceCreator, NavigationSlice } from '../types';

export const createNavigationSlice: AppSliceCreator<NavigationSlice> = (set) => ({
  currentTab: 'dashboard',
  selectedDate: '2026-09-13',

  setCurrentTab: (currentTab: string) => {
    set({ currentTab });
  },

  setSelectedDate: (selectedDate: string) => {
    set({ selectedDate });
  },
});
