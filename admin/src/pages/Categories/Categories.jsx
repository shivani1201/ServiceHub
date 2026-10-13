import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Power, Trash2, ImagePlus } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { categoryAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage, pluralize } from '../../utils/helpers.js';
import './Categories.css';

const emptyForm = { name: '', description: '' };

const Categories = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);

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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = () => {
    setLoading(true);
    setError('');
    categoryAPI
      .getAllAdmin()
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(getErrorMessage(err, 'We could not load categories.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description || '' });
    setImageFile(null);
    setImagePreview(category.image || '');
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
    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    const payload = { name: form.name.trim(), description: form.description.trim() };
    if (imageFile) payload.image = imageFile;

    setSaving(true);
    try {
      if (editing) {
        const { category } = await categoryAPI.update(editing._id, payload);
        setCategories((current) => current.map((item) => (item._id === category._id ? { ...category, serviceCount: item.serviceCount } : item)));
        toast.success('Category updated');
      } else {
        const { category } = await categoryAPI.create(payload);
        setCategories((current) => [...current, { ...category, serviceCount: 0 }]);
        toast.success('Category created');
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not save this category.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (category) => {
    setBusyId(category._id);
    try {
      const { category: updated } = await categoryAPI.toggleActive(category._id);
      setCategories((current) => current.map((item) => (item._id === updated._id ? { ...updated, serviceCount: item.serviceCount } : item)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not update this category.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await categoryAPI.remove(confirmDelete._id);
      setCategories((current) => current.filter((item) => item._id !== confirmDelete._id));
      toast.success('Category deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not delete this category.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Category',
      render: (row) => (
        <div className="table__cell-main">
          {row.image ? <img src={row.image} alt="" className="categories__thumb" /> : <span className="categories__thumb categories__thumb--empty" />}
          <div>
            <strong>{row.name}</strong>
            <small>{pluralize(row.serviceCount, 'service')}</small>
          </div>
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: (row) => row.description || '-' },
    { key: 'status', label: 'Status', render: (row) => <span className={`badge ${row.isActive ? 'badge--success' : 'badge--neutral'}`}>{row.isActive ? 'Active' : 'Disabled'}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          <button type="button" className="table__icon-btn" onClick={() => openEditModal(row)} aria-label="Edit"><Pencil size={16} /></button>
          <button type="button" className="table__icon-btn" onClick={() => handleToggle(row)} disabled={busyId === row._id} aria-label={row.isActive ? 'Disable' : 'Enable'}><Power size={16} /></button>
          <button type="button" className="table__icon-btn table__icon-btn--danger" onClick={() => setConfirmDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Categories</h1>
          <p>Group services so customers can browse by what they need.</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Add category</Button>
      </div>

      {error ? (
        <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadCategories} />
      ) : loading ? (
        <Loader label="Loading categories" />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" message="Add your first category to get started." actionLabel="Add category" onAction={openAddModal} />
      ) : (
        <DataTable columns={columns} data={categories} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Edit category' : 'Add a new category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Add category'}</Button>
          </>
        }
      >
        <form className="categories__form" onSubmit={handleSubmit}>
          <button type="button" className="categories__image" onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? <img src={imagePreview} alt="" /> : <ImagePlus size={20} />}
            <span>{imagePreview ? 'Change photo' : 'Add a photo'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImageChange} />

          <div className="field">
            <label htmlFor="cat-name">Name</label>
            <input id="cat-name" className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Pet Care" />
          </div>
          <div className="field">
            <label htmlFor="cat-description">Description</label>
            <textarea id="cat-description" className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short description shown to customers" />
          </div>
          {formError && <div className="alert alert--error" role="alert">{formError}</div>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this category?"
        message={confirmDelete ? `"${confirmDelete.name}" can only be deleted once no services or providers use it. Disable it instead if you want to hide it for now.` : ''}
        confirmLabel="Delete category"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Categories;
