import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { serviceAPI, categoryAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDuration, formatPrice, getCategoryMeta, getErrorMessage } from '../../utils/helpers.js';
import './MyServices.css';

const emptyForm = { title: '', description: '', price: '', duration: '', category: '' };

const MyServices = () => {
  const { provider } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadServices = () => {
    setLoading(true);
    setError('');
    serviceAPI
      .getMine()
      .then((data) => setServices(data.services))
      .catch((err) => setError(getErrorMessage(err, 'We could not load your services.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadServices, []);
  useEffect(() => {
    categoryAPI.getAll().then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category?._id || '',
    });
    setImageFile(null);
    setImagePreview(service.image || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.title.trim() || !form.description.trim() || form.price === '' || !form.duration || !form.category) {
      setFormError('Fill in every field before saving.');
      return;
    }
    if (Number(form.price) < 0 || Number(form.duration) < 15) {
      setFormError('Duration must be at least 15 minutes and price cannot be negative.');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('price', form.price);
    formData.append('duration', form.duration);
    formData.append('category', form.category);
    if (imageFile) formData.append('image', imageFile);

    setSaving(true);
    try {
      if (editing) {
        const { service } = await serviceAPI.update(editing._id, formData);
        setServices((current) => current.map((item) => (item._id === service._id ? service : item)));
        toast.success('Service updated');
      } else {
        const { service } = await serviceAPI.create(formData);
        setServices((current) => [service, ...current]);
        toast.success('Service added');
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not save this service.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (service) => {
    setBusyId(service._id);
    try {
      const { service: updated } = await serviceAPI.toggle(service._id);
      setServices((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not update this service.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Delete "${service.title}"? This cannot be undone.`)) return;
    setBusyId(service._id);
    try {
      await serviceAPI.remove(service._id);
      setServices((current) => current.filter((item) => item._id !== service._id));
      toast.success('Service deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not delete this service.'));
    } finally {
      setBusyId(null);
    }
  };

  const canAddServices = provider?.isApproved;

  return (
    <div className="page">
      <div className="container">
        <div className="page__head myservices__head">
          <div>
            <h1>My services</h1>
            <p>Add what you offer, and turn a service off when you are fully booked.</p>
          </div>
          <Button icon={Plus} onClick={openAddModal} disabled={!canAddServices}>Add service</Button>
        </div>

        {!canAddServices && (
          <div className="alert alert--warning">Your provider profile is waiting for admin approval. You can add services once it is approved.</div>
        )}

        {error ? (
          <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadServices} />
        ) : loading ? (
          <Loader variant="cards" count={4} label="Loading your services" />
        ) : services.length === 0 ? (
          <EmptyState
            title="No services yet"
            message={canAddServices ? 'Add your first service so customers can find and book you.' : 'Once approved, add your first service here.'}
            actionLabel={canAddServices ? 'Add service' : undefined}
            onAction={canAddServices ? openAddModal : undefined}
          />
        ) : (
          <div className="myservices__grid">
            {services.map((service) => {
              const { Icon, bg, fg } = getCategoryMeta(service.category?.name);
              return (
                <article key={service._id} className={`msvc ${service.isAvailable ? '' : 'msvc--off'}`}>
                  <div className="msvc__media" style={service.image ? undefined : { background: bg, color: fg }}>
                    {service.image ? <img src={service.image} alt="" /> : <Icon size={36} strokeWidth={1.5} />}
                    <span className={`badge ${service.isAvailable ? 'badge--success' : 'badge--neutral'} msvc__badge`}>{service.isAvailable ? 'Live' : 'Off'}</span>
                  </div>
                  <div className="msvc__body">
                    <span className="msvc__cat">{service.category?.name}</span>
                    <h3>{service.title}</h3>
                    <p className="msvc__meta">{formatPrice(service.price)} &middot; {formatDuration(service.duration)}</p>
                    <div className="msvc__actions">
                      <button type="button" onClick={() => openEditModal(service)} aria-label="Edit service"><Pencil size={16} /> Edit</button>
                      <button type="button" onClick={() => handleToggle(service)} disabled={busyId === service._id} aria-label="Toggle availability"><Power size={16} /> {service.isAvailable ? 'Turn off' : 'Turn on'}</button>
                      <button type="button" className="msvc__delete" onClick={() => handleDelete(service)} disabled={busyId === service._id} aria-label="Delete service"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Edit service' : 'Add a new service'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Add service'}</Button>
          </>
        }
      >
        <form className="myservices__form" onSubmit={handleSubmit}>
          <button type="button" className="myservices__image" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? <img src={imagePreview} alt="" /> : <ImagePlus size={22} />}
            <span>{imagePreview ? 'Change photo' : 'Add a photo'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImageChange} />

          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Deep home cleaning" />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What is included, and what should customers expect?" />
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="price">Price</label>
              <input id="price" type="number" min="0" className="input" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="duration">Duration (minutes)</label>
              <input id="duration" type="number" min="15" step="15" className="input" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option value="">Choose a category</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          {formError && <div className="alert alert--error" role="alert">{formError}</div>}
        </form>
      </Modal>
    </div>
  );
};

export default MyServices;
