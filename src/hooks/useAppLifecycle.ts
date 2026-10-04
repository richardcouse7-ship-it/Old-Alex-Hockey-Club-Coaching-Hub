/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../store';

/**
 * Custom hook to manage browser and window lifecycle concerns:
 * - Online / offline network connectivity state and user notifications
 * - Body scroll lock management when mobile sidebar drawer is open
 */
export function useAppLifecycle() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const showToast = useAppStore((s) => s.showToast);
  const mobileSidebarOpen = useAppStore((s) => s.mobileSidebarOpen);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored: Synchronized with Old Alex Cloud');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode Active: Changes saved to pitch cache');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Lock body scroll when mobile drawer is open so touch scrolling targets the menu
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  return { isOnline };
}
