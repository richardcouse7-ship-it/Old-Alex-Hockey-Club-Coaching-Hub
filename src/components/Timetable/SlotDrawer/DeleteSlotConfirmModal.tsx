import React from 'react';

export interface DeleteSlotConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteSlotConfirmModal: React.FC<DeleteSlotConfirmModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="flex items-center gap-2 bg-red-950/80 border border-red-700/80 rounded-xl px-3 py-1.5 animate-in fade-in duration-150">
      <span className="text-xs text-red-200 font-bold">Delete this session permanently?</span>
      <button
        type="button"
        onClick={onConfirm}
        className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-sm"
      >
        Yes, Delete
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-2.5 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};
