import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff } from 'lucide-react';
import Logo from '../../components/Logo/Logo.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { categoryAPI } from '../../services/api.js';
import { getErrorMessage } from '../../utils/helpers.js';
import '../Login/Login.css';
import './Register.css';

const CUSTOMER_POINTS = ['Book trusted local providers in a few taps', 'Track every booking in one place', 'Leave reviews to help others choose'];
const PROVIDER_POINTS = ['List your services and set your working hours', 'Accept or decline booking requests', 'Build a reputation with reviews'];

const Register = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [accountType, setAccountType] = useState(searchParams.get('type') === 'provider' ? 'provider' : 'user');
  const [categories, setCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', category: '', location: '', experience: '', bio: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isProvider = accountType === 'provider';

  useEffect(() => {
    if (!isProvider || categories.length > 0) return;
    categoryAPI.getAll().then((data) => setCategories(data.categories)).catch(() => setError('We could not load the categories. Refresh the page to try again.'));
  }, [isProvider, categories.length]);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Enter your name, email and a password.');
      return;
    }
    if (form.password.length < 6) {
      setError('Your password needs at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    if (isProvider && (!form.category || !form.location.trim())) {
      setError('Choose your category and enter the area you work in.');
      return;
    }

    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password, accountType };
    if (isProvider) {
      Object.assign(payload, { category: form.category, location: form.location.trim(), experience: form.experience, bio: form.bio.trim() });
    }

    setSubmitting(true);
    try {
      await register(payload);
      if (isProvider) toast.info('Account created. An admin will review your profile before it goes live.');
      else toast.success('Welcome to ServiceHub!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const points = isProvider ? PROVIDER_POINTS : CUSTOMER_POINTS;

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo light />
        <div className="auth__pitch">
          <h2>{isProvider ? 'Grow your local business.' : 'Get things done, locally.'}</h2>
          <ul className="auth__points">
            {points.map((point) => <li key={point}><Check size={18} /> {point}</li>)}
          </ul>
        </div>
        <p className="auth__aside-note">It takes about a minute to sign up.</p>
      </aside>

      <main className="auth__main">
        <div className="auth__card auth__card--wide">
          <Logo />
          <div className="auth__head">
            <h1>Create your account</h1>
            <p className="muted">Choose how you want to use ServiceHub.</p>
          </div>

          <div className="seg" role="radiogroup" aria-label="Account type">
            <button type="button" role="radio" aria-checked={!isProvider} className={!isProvider ? 'is-active' : ''} onClick={() => setAccountType('user')}>I want to book services</button>
            <button type="button" role="radio" aria-checked={isProvider} className={isProvider ? 'is-active' : ''} onClick={() => setAccountType('provider')}>I offer services</button>
          </div>

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert--error" role="alert">{error}</div>}

            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" name="name" className="input" autoComplete="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" value={form.phone} onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="password-field">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} className="input" autoComplete="new-password" value={form.password} onChange={handleChange} />
                  <button type="button" className="password-field__toggle" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span className="field__hint">At least 6 characters.</span>
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} className="input" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            {isProvider && (
              <fieldset className="register__provider">
                <legend>About your business</legend>
                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label htmlFor="category">Category</label>
                    <select id="category" name="category" className="select" value={form.category} onChange={handleChange}>
                      <option value="">Choose a category</option>
                      {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="experience">Years of experience</label>
                    <input id="experience" name="experience" type="number" min="0" max="60" className="input" value={form.experience} onChange={handleChange} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="location">Area you work in</label>
                  <input id="location" name="location" className="input" placeholder="For example: Lakeview" value={form.location} onChange={handleChange} />
                </div>
                <div className="field">
                  <label htmlFor="bio">Short bio</label>
                  <textarea id="bio" name="bio" className="textarea" maxLength={600} placeholder="Tell customers what you do and what makes you good at it." value={form.bio} onChange={handleChange} />
                </div>
                <p className="field__hint">An admin reviews every provider profile before it appears on the site.</p>
              </fieldset>
            )}

            <Button type="submit" size="lg" block loading={submitting}>Create account</Button>
          </form>

          <p className="auth__foot">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </main>
    </div>
  );
};

export default Register;
