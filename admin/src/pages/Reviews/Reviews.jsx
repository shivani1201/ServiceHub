import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { reviewAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, getErrorMessage } from '../../utils/helpers.js';
import './Reviews.css';

const Reviews = () => {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    setError('');
    reviewAPI
      .getAll()
      .then((data) => setReviews(data.reviews))
      .catch((err) => setError(getErrorMessage(err, 'We could not load reviews.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadReviews, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await reviewAPI.remove(confirmDelete._id);
      setReviews((current) => current.filter((item) => item._id !== confirmDelete._id));
      toast.success('Review removed');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not remove this review.'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Customer',
      render: (row) => (
        <div className="table__cell-main">
          <Avatar name={row.user?.name || '?'} src={row.user?.profileImage} size="sm" />
          <div>
            <strong>{row.user?.name || 'Deleted user'}</strong>
            <small>{row.service?.title}</small>
          </div>
        </div>
      ),
    },
    { key: 'provider', label: 'Provider', render: (row) => row.provider?.name || '-' },
    { key: 'rating', label: 'Rating', render: (row) => '\u2605'.repeat(row.rating) + '\u2606'.repeat(5 - row.rating) },
    { key: 'comment', label: 'Comment', render: (row) => <span className="reviews__comment">{row.comment || <span className="muted">No comment</span>}</span> },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          <button type="button" className="table__icon-btn table__icon-btn--danger" onClick={() => setConfirmDelete(row)} aria-label="Remove review"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Reviews</h1>
          <p>Remove reviews that are inappropriate or against guidelines.</p>
        </div>
      </div>

      {error ? (
        <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadReviews} />
      ) : loading ? (
        <Loader label="Loading reviews" />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" message="Reviews will appear here once customers complete bookings and rate them." />
      ) : (
        <DataTable columns={columns} data={reviews} />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Remove this review?"
        message="This permanently removes the review and recalculates the provider's and service's rating."
        confirmLabel="Remove review"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Reviews;
