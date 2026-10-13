import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from '../components/Toast/Toast.jsx';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, type) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toast toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
