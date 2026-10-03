import React from 'react';
import { OldAlexCrest } from './OldAlexCrest';

interface OldAlexLoadingSpinnerProps {
  message?: string;
  isModal?: boolean;
}

export const OldAlexLoadingSpinner: React.FC<OldAlexLoadingSpinnerProps> = ({
  message = 'Loading pitch view...',
  isModal = false,
}) => {
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-black border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <OldAlexCrest size={44} className="animate-pulse" />
            <div className="absolute -inset-1 rounded-full border border-red-500/50 animate-ping opacity-30" />
          </div>
          <p className="text-xs font-semibold text-neutral-300 tracking-wide font-mono-data">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative">
        <OldAlexCrest size={56} className="animate-pulse drop-shadow-xl" />
        <div className="absolute -inset-2 rounded-full border-2 border-red-500/40 animate-ping opacity-25" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-white tracking-tight">Old Alexandra Hockey Club</h3>
        <p className="text-xs text-neutral-400 font-mono-data">{message}</p>
      </div>
    </div>
  );
};
