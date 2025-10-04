import React, { useState, useEffect, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };
type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};



const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 2. Create a custom hook to use the toast functionality.
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 3. Create a ToastProvider component to manage the state and provide the context.
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to add a new toast notification.
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  };

  // Function to remove a toast by its ID.
  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotificationContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// A container to manage and display multiple toast notifications.
const ToastNotificationContainer: React.FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-xs space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

// Individual Toast Notification component.
const Toast: React.FC<{ toast: Toast; removeToast: (id: number) => void }> = ({ toast, removeToast }) => {
  const { id, message, type } = toast;

  // Automatically remove the toast after 3 seconds.
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);


  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-success text-text-inverted';
      case 'error':
        return 'bg-warning text-text-inverted';
      case 'info':
        return 'bg-info text-text-inverted';
      default:
        return 'bg-gray-700 text-text-primary';
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-lg pointer-events-auto flex items-start gap-4 transform transition-all duration-300 ease-out animate-slideIn ${getColors()}`}>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => removeToast(id)}
        className="text-text-inverted text-lg font-bold leading-none"
      >
        &times;
      </button>
    </div>
  );
};