import React from 'react';
import type { ReactNode } from 'react';

// Define the props interface for the Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  showCloseButton: boolean;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, showCloseButton, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div className="bg-bg-card rounded-lg shadow-lg p-8 max-w-md relative" onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button className="px-2 text-3xl absolute top-4 right-4 rounded-full text-text-secondary hover:text-text-primary" onClick={onClose}>
            &times;
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;