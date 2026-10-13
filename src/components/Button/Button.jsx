import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({
  children, variant = 'primary', size = 'md', to, loading = false, icon: Icon, block = false, className = '', disabled = false, type = 'button', ...rest
}) => {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block ? 'btn--block' : '', className].filter(Boolean).join(' ');
  const content = (
    <>
      {loading ? <Loader2 size={16} className="btn__spinner" /> : Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
};

export default Button;
