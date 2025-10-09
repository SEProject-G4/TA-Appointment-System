import React, { useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import Modal from '../components/common/Modal';

// Define the shape of the modal options object
interface ModalOptions {
  showCloseButton?: boolean;
}

// Define the shape of the context's value
interface ModalContextType {
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
}

// Create the context with a default value
const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [showCloseButton, setShowCloseButton] = useState<boolean>(true);

  const openModal = (content: ReactNode, options: ModalOptions = {}) => {
    const { showCloseButton = true } = options;
    setModalContent(content);
    setShowCloseButton(showCloseButton);
    setIsOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setIsOpen(false);
    setShowCloseButton(true);
  };

  const contextValue: ModalContextType = {
    openModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <Modal 
        isOpen={isOpen} 
        onClose={closeModal} 
        showCloseButton={showCloseButton}
      >
        {modalContent}
      </Modal>
    </ModalContext.Provider>
  );
};