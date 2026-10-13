import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Pencil, Power, Trash2, ImagePlus } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { serviceAPI, categoryAPI, providerAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDuration, formatPrice, getErrorMessage } from '../../utils/helpers.js';
import './Services.css';

const emptyForm = { title: '', description: '', price: '', duration: '', category: '', provider: '' };

const Services = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = () => {
    setLoading(true);
    setError('');
    Promise.all([serviceAPI.getAllAdmin(), categoryAPI.getAllAdmin(), providerAPI.getAllAdmin('approved')])
      .then(([serviceData, categoryData, providerData]) => {
        setServices(serviceData.services);
        setCategories(categoryData.categories);
        setProviders(providerData.providers);
      })
      .catch((err) => setError(getErrorMessage(err, 'We could not load services.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return services;
    return services.filter((service) => service.title.toLowerCase().includes(term) || service.provider?.name?.toLowerCase().includes(term));
  }, [services, search]);

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
    setForm({ title: service.title, description: service.description, price: service.price, duration: service.duration, category: service.category?._id || '', provider: service.provider?._id || '' });
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

    if (!form.title.trim() || !form.description.trim() || form.price === '' || !form.duration || !form.category || (!editing && !form.provider)) {
      setFormError('Fill in every field before saving.');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('price', form.price);
    formData.append('duration', form.duration);
    formData.append('category', form.category);
    if (!editing) formData.append('provider', form.provider);
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await serviceAPI.remove(confirmDelete._id);
      setServices((current) => current.filter((item) => item._id !== confirmDelete._id));
      toast.success('Service deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not delete this service.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Service',
      render: (row) => (
        <div className="table__cell-main">
          {row.image ? <img src={row.image} alt="" className="services__thumb" /> : <span className="services__thumb services__thumb--empty" />}
          <div>
            <strong>{row.title}</strong>
            <small>{row.provider?.name || 'Unknown provider'}</small>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '-' },
    { key: 'price', label: 'Price', render: (row) => formatPrice(row.price) },
    { key: 'duration', label: 'Duration', render: (row) => formatDuration(row.duration) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="services__status">
          <span className={`badge ${row.isAvailable ? 'badge--success' : 'badge--neutral'}`}>{row.isAvailable ? 'Live' : 'Off'}</span>
          {!row.provider?.isApproved && <span className="badge badge--warning">Provider pending</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          <button type="button" className="table__icon-btn" onClick={() => openEditModal(row)} aria-label="Edit"><Pencil size={16} /></button>
          <button type="button" className="table__icon-btn" onClick={() => handleToggle(row)} disabled={busyId === row._id} aria-label={row.isAvailable ? 'Turn off' : 'Turn on'}><Power size={16} /></button>
          <button type="button" className="table__icon-btn table__icon-btn--danger" onClick={() => setConfirmDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Services</h1>
          <p>Every service listed on ServiceHub, across all providers.</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Add service</Button>
      </div>

      <div className="toolbar">
        <div className="toolbar__search">
          <Search size={17} />
          <input className="input" placeholder="Search by title or provider" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      {error ? (
        <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadAll} />
      ) : loading ? (
        <Loader label="Loading services" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No services found" message="Try a different search, or add the first service." />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

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
        <form className="services__form" onSubmit={handleSubmit}>
          <button type="button" className="services__image" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? <img src={imagePreview} alt="" /> : <ImagePlus size={20} />}
            <span>{imagePreview ? 'Change photo' : 'Add a photo'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImageChange} />

          {!editing && (
            <div className="field">
              <label htmlFor="svc-provider">Provider</label>
              <select id="svc-provider" className="select" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })}>
                <option value="">Choose a provider</option>
                {providers.map((provider) => <option key={provider._id} value={provider._id}>{provider.name}</option>)}
              </select>
              <span className="field__hint">Only approved providers are listed here.</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="svc-title">Title</label>
            <input id="svc-title" className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="svc-description">Description</label>
            <textarea id="svc-description" className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="svc-price">Price</label>
              <input id="svc-price" type="number" min="0" className="input" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="svc-duration">Duration (minutes)</label>
              <input id="svc-duration" type="number" min="15" step="15" className="input" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="svc-category">Category</label>
            <select id="svc-category" className="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option value="">Choose a category</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>
          {formError && <div className="alert alert--error" role="alert">{formError}</div>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this service?"
        message={confirmDelete ? `This permanently removes "${confirmDelete.title}". This cannot be undone.` : ''}
        confirmLabel="Delete service"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Services;
