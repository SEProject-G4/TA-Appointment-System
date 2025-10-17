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
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3 pointer-events-none">
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


  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-bg-card border-l-4 border-green-500 text-text-primary shadow-xl',
          icon: 'bg-green-500/10 text-green-600',
          close: 'text-green-600 hover:bg-green-500/10'
        };
      case 'error':
        return {
          container: 'bg-bg-card border-l-4 border-red-500 text-text-primary shadow-xl',
          icon: 'bg-red-500/10 text-red-600',
          close: 'text-red-600 hover:bg-red-500/10'
        };
      case 'info':
        return {
          container: 'bg-bg-card border-l-4 border-blue-500 text-text-primary shadow-xl',
          icon: 'bg-blue-500/10 text-blue-600',
          close: 'text-blue-600 hover:bg-blue-500/10'
        };
      default:
        return {
          container: 'bg-bg-card border-l-4 border-text-secondary text-text-primary shadow-xl',
          icon: 'bg-text-secondary/10 text-text-secondary',
          close: 'text-text-secondary hover:bg-text-secondary/10'
        };
    }
  };

  const styles = getStyles();

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'info':
        return 'i';
      default:
        return 'i';
    }
  };

  return (
    <div className={`p-4 rounded-md pointer-events-auto flex items-start gap-3 transform transition-all duration-300 ease-out animate-slideIn backdrop-blur-sm ${styles.container}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${styles.icon}`}>
        {getTypeIcon()}
      </div>
      <span className="flex-1 text-sm font-medium leading-relaxed">{message}</span>
      <button
        onClick={() => removeToast(id)}
        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold leading-none transition-colors duration-200 flex-shrink-0 ${styles.close}`}
      >
        ×
      </button>
    </div>
  );
};