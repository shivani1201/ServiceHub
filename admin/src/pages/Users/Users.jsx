import { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Power, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { userAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, getErrorMessage } from '../../utils/helpers.js';
import './Users.css';

const ROLE_LABEL = { user: 'Customer', provider: 'Provider', admin: 'Admin' };

const Users = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    setError('');
    userAPI
      .getAll()
      .then((data) => setUsers(data.users))
      .catch((err) => setError(getErrorMessage(err, 'We could not load users.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (!term) return true;
      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    });
  }, [users, search, roleFilter]);

  const openDetails = async (user) => {
    setDetailLoading(true);
    setDetailUser({ _id: user._id });
    try {
      const data = await userAPI.getById(user._id);
      setDetailUser(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not load this user.'));
      setDetailUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    setBusyId(user._id);
    try {
      const { user: updated } = await userAPI.toggleActive(user._id);
      setUsers((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(updated.isActive ? 'User activated' : 'User deactivated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not update this user.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await userAPI.remove(confirmDelete._id);
      setUsers((current) => current.filter((item) => item._id !== confirmDelete._id));
      toast.success('User deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not delete this user.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (row) => (
        <div className="table__cell-main">
          <Avatar name={row.name} src={row.profileImage} size="sm" />
          <div>
            <strong>{row.name}</strong>
            <small>{row.email}</small>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (row) => <span className="badge badge--violet">{ROLE_LABEL[row.role]}</span> },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '-' },
    { key: 'status', label: 'Status', render: (row) => <span className={`badge ${row.isActive ? 'badge--success' : 'badge--neutral'}`}>{row.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'joined', label: 'Joined', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          <button type="button" className="table__icon-btn" onClick={() => openDetails(row)} aria-label="View details"><Eye size={16} /></button>
          {row.role !== 'admin' && (
            <>
              <button type="button" className="table__icon-btn" onClick={() => handleToggleActive(row)} disabled={busyId === row._id} aria-label={row.isActive ? 'Deactivate' : 'Activate'}><Power size={16} /></button>
              <button type="button" className="table__icon-btn table__icon-btn--danger" onClick={() => setConfirmDelete(row)} aria-label="Delete user"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Users</h1>
          <p>Everyone with a ServiceHub account: customers, providers and admins.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search">
          <Search size={17} />
          <input className="input" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="toolbar__tabs">
          {['all', 'user', 'provider', 'admin'].map((role) => (
            <button key={role} type="button" className={roleFilter === role ? 'is-active' : ''} onClick={() => setRoleFilter(role)}>
              {role === 'all' ? 'All' : ROLE_LABEL[role]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadUsers} />
      ) : loading ? (
        <Loader label="Loading users" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" message="Try a different search or filter." />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={Boolean(detailUser)} onClose={() => setDetailUser(null)} title="User details">
        {detailLoading || !detailUser?.user ? (
          <Loader label="Loading" />
        ) : (
          <div className="user-detail">
            <div className="user-detail__head">
              <Avatar name={detailUser.user.name} src={detailUser.user.profileImage} size="lg" />
              <div>
                <strong>{detailUser.user.name}</strong>
                <span className="muted">{detailUser.user.email}</span>
                <span className="badge badge--violet">{ROLE_LABEL[detailUser.user.role]}</span>
              </div>
            </div>
            <dl className="user-detail__grid">
              <div><dt>Phone</dt><dd>{detailUser.user.phone || '-'}</dd></div>
              <div><dt>Joined</dt><dd>{formatDate(detailUser.user.createdAt)}</dd></div>
              <div><dt>Bookings made</dt><dd>{detailUser.stats?.bookings ?? 0}</dd></div>
              <div><dt>Reviews written</dt><dd>{detailUser.stats?.reviews ?? 0}</dd></div>
              {detailUser.provider && (
                <>
                  <div><dt>Provider category</dt><dd>{detailUser.provider.category?.name || '-'}</dd></div>
                  <div><dt>Provider status</dt><dd>{detailUser.provider.approvalStatus}</dd></div>
                </>
              )}
            </dl>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this user?"
        message={confirmDelete ? `This permanently deletes ${confirmDelete.name}'s account${confirmDelete.role === 'provider' ? ', provider profile, services and bookings' : ''}. This cannot be undone.` : ''}
        confirmLabel="Delete user"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Users;
