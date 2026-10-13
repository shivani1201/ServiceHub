import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

const Toast = ({ toasts, onClose }) => (
  <div className="toast-stack" aria-live="polite">
    {toasts.map((toast) => {
      const Icon = ICONS[toast.type] || Info;
      return (
        <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
          <Icon size={17} />
          <span>{toast.message}</span>
          <button type="button" onClick={() => onClose(toast.id)} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      );
    })}
  </div>
);

export default Toast;
