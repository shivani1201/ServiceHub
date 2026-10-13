import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'md', loading = false, icon: Icon, block = false, className = '', disabled = false, type = 'button', ...rest }) => {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block ? 'btn--block' : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={15} className="btn__spinner" /> : Icon ? <Icon size={15} /> : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
