import { useEffect, useState } from 'react';
import BookingCard from '../../components/BookingCard/BookingCard.jsx';
import ReviewModal from '../../components/ReviewModal/ReviewModal.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { bookingAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../utils/helpers.js';
import './MyBookings.css';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const matchesTab = (booking, tab) => {
  if (tab === 'upcoming') return booking.status === 'confirmed';
  if (tab === 'pending') return booking.status === 'pending';
  if (tab === 'completed') return booking.status === 'completed';
  return ['cancelled', 'rejected'].includes(booking.status);
};

const MyBookings = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    setError('');
    bookingAPI
      .getMine()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(getErrorMessage(err, 'We could not load your bookings.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadBookings, []);

  const handleCancel = async (booking) => {
    if (!window.confirm('Cancel this booking?')) return;
    setBusyId(booking._id);
    try {
      const { booking: updated } = await bookingAPI.updateStatus(booking._id, 'cancelled');
      setBookings((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not cancel this booking.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleReviewed = (bookingId) => {
    setBookings((current) => current.map((item) => (item._id === bookingId ? { ...item, isReviewed: true } : item)));
  };

  const filtered = bookings.filter((booking) => matchesTab(booking, tab));

  return (
    <div className="page">
      <div className="container">
        <div className="page__head">
          <h1>My bookings</h1>
          <p>Track every booking you have made, from request to completion.</p>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map((item) => {
            const count = bookings.filter((booking) => matchesTab(booking, item.key)).length;
            return (
              <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>
                {item.label}
                {count > 0 && <span className="tabs__count">{count}</span>}
              </button>
            );
          })}
        </div>

        {error ? (
          <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadBookings} />
        ) : loading ? (
          <Loader label="Loading bookings" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${tab} bookings`}
            message={tab === 'upcoming' ? 'Once a provider confirms a booking, it will show up here.' : 'Nothing to show in this tab yet.'}
            actionLabel="Browse services"
            actionTo="/services"
          />
        ) : (
          <div className="bk-list">
            {filtered.map((booking) => (
              <BookingCard key={booking._id} booking={booking} viewer="customer" busy={busyId === booking._id} onCancel={handleCancel} onReview={setReviewTarget} />
            ))}
          </div>
        )}
      </div>

      <ReviewModal booking={reviewTarget} open={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} onSubmitted={handleReviewed} />
    </div>
  );
};

export default MyBookings;
