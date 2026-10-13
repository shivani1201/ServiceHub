import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff } from 'lucide-react';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../utils/helpers.js';
import './Login.css';

const POINTS = ['See your upcoming bookings at a glance', 'Book your favourite providers again', 'Leave a review once a job is done'];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

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
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not log you in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo light />
        <div className="auth__pitch">
          <h2>Welcome back.</h2>
          <ul className="auth__points">
            {POINTS.map((point) => <li key={point}><Check size={18} /> {point}</li>)}
          </ul>
        </div>
        <p className="auth__aside-note">Local services, booked in a few taps.</p>
      </aside>

      <main className="auth__main">
        <div className="auth__card">
          <Logo />
          <div className="auth__head">
            <h1>Log in</h1>
            <p className="muted">Enter your details to manage your bookings.</p>
          </div>

          {import.meta.env.DEV && (
            <div className="alert alert--info">
              <span>
                Demo account (after running the seed script): <strong>user@servicehub.com</strong> with password <strong>User@123</strong>.{' '}
                <button type="button" className="auth__fill" onClick={() => setForm({ email: 'user@servicehub.com', password: 'User@123' })}>Fill it in</button>
              </span>
            </div>
          )}

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert--error" role="alert">{error}</div>}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="input" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={handleChange} />
                <button type="button" className="password-field__toggle" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" block loading={submitting}>Log in</Button>
          </form>

          <p className="auth__foot">New to ServiceHub? <Link to="/register">Create an account</Link></p>
        </div>
      </main>
    </div>
  );
};

export default Login;
