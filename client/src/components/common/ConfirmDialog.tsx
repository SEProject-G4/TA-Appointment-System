import React from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  isProcessing?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = "Confirm Action",
  message,
  onConfirm,
  onCancel,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonClassName = "px-4 py-2 font-medium text-white bg-gray-700 rounded-lg shadow-sm hover:bg-gray-800 transition",
  cancelButtonClassName = "px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition",
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 space-y-4 bg-white rounded-lg shadow-lg transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={`p-1 transition rounded-full hover:bg-gray-100 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-600">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={cancelButtonClassName}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={confirmButtonClassName}
          >
            {isProcessing && (
              <svg className="inline w-4 h-4 mr-2 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
