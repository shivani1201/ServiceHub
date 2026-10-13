import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../utils/helpers.js';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form);
    } catch (err) {
      setError(getErrorMessage(err, 'We could not log you in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="18" fill="#3f2a9e" />
            <path d="M42 22C40 18 36 17 32 17C27 17 23 19 23 24C23 32 41 28 41 38C41 43 37 46 32 46C27 46 23 44 22 40" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
            <circle cx="47" cy="17" r="5" fill="#ff6f59" />
          </svg>
          <span>ServiceHub</span>
        </div>

        <div className="admin-login__head">
          <span className="admin-login__badge"><ShieldCheck size={14} /> Admin panel</span>
          <h1>Sign in to manage ServiceHub</h1>
          <p className="muted">Approve providers, manage services and track bookings.</p>
        </div>

        {import.meta.env.DEV && (
          <div className="alert alert--info">
            <span>
              Demo admin (after running the seed script): <strong>admin@servicehub.com</strong> / <strong>Admin@123</strong>.{' '}
              <button type="button" className="admin-login__fill" onClick={() => setForm({ email: 'admin@servicehub.com', password: 'Admin@123' })}>Fill it in</button>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email" placeholder="admin@servicehub.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="input" autoComplete="current-password" value={form.password} onChange={handleChange} />
              <button type="button" className="password-field__toggle" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button type="submit" size="lg" block loading={submitting}>Sign in</Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
