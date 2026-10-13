import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ open, title, onClose, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
};

export default Modal;
