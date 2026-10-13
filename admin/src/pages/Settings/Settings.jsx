import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../../components/Button/Button.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userAPI } from '../../services/api.js';
import { getErrorMessage } from '../../utils/helpers.js';
import './Settings.css';

const Settings = () => {
  const { admin } = useAuth();
  const toast = useToast();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Fill in both password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Your new password needs at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await userAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(getErrorMessage(err, 'We could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings">
      <div className="page__head">
        <div>
          <h1>Settings</h1>
          <p>Manage your admin account.</p>
        </div>
      </div>

      <section className="settings__card">
        <div className="settings__identity">
          <Avatar name={admin?.name} size="lg" />
          <div>
            <strong>{admin?.name}</strong>
            <span className="muted">{admin?.email}</span>
            <span className="badge badge--violet">Admin</span>
          </div>
        </div>
      </section>

      <section className="settings__card">
        <h2>Change password</h2>
        <form className="settings__form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="currentPassword">Current password</label>
            <div className="password-field">
              <input id="currentPassword" type={showPasswords ? 'text' : 'password'} className="input" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} />
              <button type="button" className="password-field__toggle" onClick={() => setShowPasswords((show) => !show)} aria-label="Toggle password visibility">
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" type={showPasswords ? 'text' : 'password'} className="input" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="confirmNewPassword">Confirm new password</label>
              <input id="confirmNewPassword" type={showPasswords ? 'text' : 'password'} className="input" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} />
            </div>
          </div>
          {error && <div className="alert alert--error" role="alert">{error}</div>}
          <Button type="submit" loading={saving}>Update password</Button>
        </form>
      </section>
    </div>
  );
};

export default Settings;
