import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-sky-500" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'info':
      default:
        return 'bg-sky-50 border-sky-200 text-sky-800';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Overlay Portal Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto transition-all duration-300 transform translate-x-0 ${getBgColor(t.type)}`}
            role="alert"
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(t.type)}</div>
            <div className="flex-1 text-sm font-medium">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 ml-auto p-1 rounded-full hover:bg-black/5 transition text-charcoal/50 hover:text-charcoal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
