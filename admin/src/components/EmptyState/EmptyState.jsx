import { Inbox, AlertCircle } from 'lucide-react';
import Button from '../Button/Button.jsx';
import './EmptyState.css';

const EmptyState = ({ variant = 'empty', icon, title, message, actionLabel, onAction }) => {
  const Glyph = icon || (variant === 'error' ? AlertCircle : Inbox);
  return (
    <div className={`empty empty--${variant}`} role={variant === 'error' ? 'alert' : undefined}>
      <span className="empty__icon"><Glyph size={22} /></span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && <Button onClick={onAction} variant={variant === 'error' ? 'secondary' : 'primary'} size="sm">{actionLabel}</Button>}
    </div>
  );
};

export default EmptyState;
