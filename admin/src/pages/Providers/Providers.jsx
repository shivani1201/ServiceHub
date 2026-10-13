import { useEffect, useMemo, useState } from 'react';
import { Search, Check, X as XIcon, Pencil, Power, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { providerAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { APPROVAL_STATUS, getErrorMessage, pluralize } from '../../utils/helpers.js';
import './Providers.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const Providers = () => {
  const toast = useToast();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', location: '', experience: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProviders = () => {
    setLoading(true);
    setError('');
    providerAPI
      .getAllAdmin()
      .then((data) => setProviders(data.providers))
      .catch((err) => setError(getErrorMessage(err, 'We could not load providers.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadProviders, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return providers.filter((provider) => {
      if (tab !== 'all' && provider.approvalStatus !== tab) return false;
      if (!term) return true;
      return provider.name.toLowerCase().includes(term) || provider.location.toLowerCase().includes(term);
    });
  }, [providers, search, tab]);

  const updateOne = (updated) => setProviders((current) => current.map((item) => (item._id === updated._id ? updated : item)));

  const handleApprove = async (provider) => {
    setBusyId(provider._id);
    try {
      const { provider: updated } = await providerAPI.approve(provider._id);
      updateOne(updated);
      toast.success(`${updated.name} approved`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not approve this provider.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (provider) => {
    setBusyId(provider._id);
    try {
      const { provider: updated } = await providerAPI.reject(provider._id);
      updateOne(updated);
      toast.success(`${updated.name} rejected`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not reject this provider.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (provider) => {
    setBusyId(provider._id);
    try {
      const { provider: updated } = await providerAPI.toggleActive(provider._id);
      updateOne(updated);
      toast.success(updated.isActive ? 'Provider activated' : 'Provider deactivated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not update this provider.'));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (provider) => {
    setEditing(provider);
    setEditForm({ name: provider.name, phone: provider.phone || '', location: provider.location, experience: provider.experience });
    setEditError('');
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditError('');
    if (!editForm.name.trim() || !editForm.location.trim()) {
      setEditError('Name and location cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { provider: updated } = await providerAPI.update(editing._id, editForm);
      updateOne(updated);
      toast.success('Provider updated');
      setEditing(null);
    } catch (err) {
      setEditError(getErrorMessage(err, 'We could not update this provider.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await providerAPI.remove(confirmDelete._id);
      setProviders((current) => current.filter((item) => item._id !== confirmDelete._id));
      toast.success('Provider deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not delete this provider.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Provider',
      render: (row) => (
        <div className="table__cell-main">
          <Avatar name={row.name} src={row.profileImage} size="sm" />
          <div>
            <strong>{row.name}</strong>
            <small>{row.location}</small>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '-' },
    { key: 'experience', label: 'Experience', render: (row) => pluralize(row.experience, 'year') },
    { key: 'rating', label: 'Rating', render: (row) => (row.reviewCount > 0 ? `${row.rating.toFixed(1)} (${row.reviewCount})` : '-') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const status = APPROVAL_STATUS[row.approvalStatus] || APPROVAL_STATUS.pending;
        return (
          <div className="providers__status">
            <span className={`badge badge--${status.tone}`}>{status.label}</span>
            {!row.isActive && <span className="badge badge--neutral">Deactivated</span>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          {row.approvalStatus !== 'approved' && (
            <button type="button" className="table__icon-btn" onClick={() => handleApprove(row)} disabled={busyId === row._id} aria-label="Approve"><Check size={16} /></button>
          )}
          {row.approvalStatus !== 'rejected' && (
            <button type="button" className="table__icon-btn table__icon-btn--danger" onClick={() => handleReject(row)} disabled={busyId === row._id} aria-label="Reject"><XIcon size={16} /></button>
          )}
          <button type="button" className="table__icon-btn" onClick={() => openEdit(row)} aria-label="Edit"><Pencil size={16} /></button>
          <button type="button" className="table__icon-btn" onClick={() => handleToggleActive(row)} disabled={busyId === row._id} aria-label={row.isActive ? 'Deactivate' : 'Activate'}><Power size={16} /></button>
          <button type="button" className="table__icon-btn table__icon-btn--danger" onClick={() => setConfirmDelete(row)} aria-label="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Providers</h1>
          <p>Review new sign-ups and manage everyone offering services.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search">
          <Search size={17} />
          <input className="input" placeholder="Search by name or location" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="toolbar__tabs">
          {TABS.map((item) => (
            <button key={item.key} type="button" className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadProviders} />
      ) : loading ? (
        <Loader label="Loading providers" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No providers found" message="Try a different search or filter." />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit provider"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleEditSubmit} loading={saving}>Save changes</Button>
          </>
        }
      >
        <form className="providers__form" onSubmit={handleEditSubmit}>
          <div className="field">
            <label htmlFor="edit-name">Name</label>
            <input id="edit-name" className="input" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="edit-phone">Phone</label>
              <input id="edit-phone" className="input" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="edit-experience">Years of experience</label>
              <input id="edit-experience" type="number" min="0" className="input" value={editForm.experience} onChange={(event) => setEditForm({ ...editForm, experience: event.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="edit-location">Location</label>
            <input id="edit-location" className="input" value={editForm.location} onChange={(event) => setEditForm({ ...editForm, location: event.target.value })} />
          </div>
          {editError && <div className="alert alert--error" role="alert">{editError}</div>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this provider?"
        message={confirmDelete ? `This permanently deletes ${confirmDelete.name} along with their services, bookings and reviews. This cannot be undone.` : ''}
        confirmLabel="Delete provider"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Providers;
