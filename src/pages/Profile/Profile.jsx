import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff } from 'lucide-react';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userAPI, categoryAPI } from '../../services/api.js';
import { DAY_NAMES, getErrorMessage } from '../../utils/helpers.js';
import './Profile.css';

const Profile = () => {
  const { user, provider, updateSession } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const isProvider = user.role === 'provider';

  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(user.profileImage || '');
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    bio: provider?.bio || '',
    location: provider?.location || '',
    experience: provider?.experience ?? '',
    category: provider?.category?._id || '',
    availabilityDays: provider?.availability?.days || [],
    startTime: provider?.availability?.startTime || '09:00',
    endTime: provider?.availability?.endTime || '18:00',
  });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (isProvider) categoryAPI.getAll().then((data) => setCategories(data.categories)).catch(() => {});
  }, [isProvider]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      availabilityDays: current.availabilityDays.includes(day) ? current.availabilityDays.filter((item) => item !== day) : [...current.availabilityDays, day],
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');

    if (!form.name.trim()) {
      setProfileError('Your name cannot be empty.');
      return;
    }
    if (isProvider && form.availabilityDays.length === 0) {
      setProfileError('Choose at least one working day.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('phone', form.phone.trim());
    if (imageFile) formData.append('image', imageFile);

    if (isProvider) {
      formData.append('bio', form.bio.trim());
      formData.append('location', form.location.trim());
      formData.append('experience', form.experience);
      formData.append('category', form.category);
      formData.append('availabilityDays', form.availabilityDays.join(','));
      formData.append('startTime', form.startTime);
      formData.append('endTime', form.endTime);
    }

    setSavingProfile(true);
    try {
      const result = await userAPI.updateProfile(formData);
      updateSession(result.user, result.provider);
      toast.success('Profile updated');
    } catch (err) {
      setProfileError(getErrorMessage(err, 'We could not update your profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Fill in both password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Your new password needs at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await userAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'We could not change your password.'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="page">
      <div className="container profile">
        <div className="page__head">
          <h1>Profile settings</h1>
          <p>Update your details, {isProvider ? 'availability' : 'contact information'} and password.</p>
        </div>

        <section className="profile__card">
          <h2>Personal information</h2>
          <form onSubmit={handleProfileSubmit} className="profile__form">
            <button type="button" className="profile__avatar-btn" onClick={() => fileInputRef.current?.click()}>
              <Avatar name={form.name} src={imagePreview} size="xl" />
              <span><Camera size={15} /> Change photo</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImageChange} />

            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" type="tel" className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" value={user.email} disabled />
              <span className="field__hint">Your email cannot be changed.</span>
            </div>

            {isProvider && (
              <>
                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label htmlFor="category">Category</label>
                    <select id="category" className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                      {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="experience">Years of experience</label>
                    <input id="experience" type="number" min="0" max="60" className="input" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="location">Area you work in</label>
                  <input id="location" className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="bio">Bio</label>
                  <textarea id="bio" className="textarea" maxLength={600} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
                </div>
                <div className="field">
                  <label>Working days</label>
                  <div className="profile__days">
                    {DAY_NAMES.map((day) => (
                      <button type="button" key={day} className={form.availabilityDays.includes(day) ? 'is-selected' : ''} onClick={() => toggleDay(day)}>{day}</button>
                    ))}
                  </div>
                </div>
                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label htmlFor="startTime">Start time</label>
                    <input id="startTime" type="time" className="input" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="endTime">End time</label>
                    <input id="endTime" type="time" className="input" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
                  </div>
                </div>
              </>
            )}

            {profileError && <div className="alert alert--error" role="alert">{profileError}</div>}

            <Button type="submit" loading={savingProfile}>Save changes</Button>
          </form>
        </section>

        <section className="profile__card">
          <h2>Change password</h2>
          <form onSubmit={handlePasswordSubmit} className="profile__form">
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
            {passwordError && <div className="alert alert--error" role="alert">{passwordError}</div>}
            <Button type="submit" variant="secondary" loading={changingPassword}>Update password</Button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
