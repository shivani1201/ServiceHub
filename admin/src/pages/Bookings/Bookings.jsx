import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../../components/DataTable/DataTable.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { bookingAPI } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { BOOKING_STATUS, formatDate, formatPrice, formatTime, getErrorMessage } from '../../utils/helpers.js';
import './Bookings.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const Bookings = () => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadBookings = () => {
    setLoading(true);
    setError('');
    bookingAPI
      .getAll()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(getErrorMessage(err, 'We could not load bookings.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadBookings, []);

  const filtered = useMemo(() => (tab === 'all' ? bookings : bookings.filter((booking) => booking.status === tab)), [bookings, tab]);

  const handleStatusChange = async (status) => {
    if (!detail) return;
    setUpdating(true);
    try {
      const { booking: updated } = await bookingAPI.updateStatus(detail._id, status);
      setBookings((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setDetail(updated);
      toast.success(`Booking marked as ${status}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not update this booking.'));
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: 'service',
      label: 'Booking',
      render: (row) => (
        <div>
          <strong>{row.service?.title || 'Service removed'}</strong>
          <div className="muted bookings__sub">{row.user?.name} with {row.provider?.name}</div>
        </div>
      ),
    },
    { key: 'date', label: 'Date & time', render: (row) => `${formatDate(row.date)} at ${formatTime(row.time)}` },
    { key: 'price', label: 'Price', render: (row) => formatPrice(row.price) },
    { key: 'status', label: 'Status', render: (row) => { const s = BOOKING_STATUS[row.status] || BOOKING_STATUS.pending; return <span className={`badge badge--${s.tone}`}>{s.label}</span>; } },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="table__actions">
          <button type="button" className="table__icon-btn" onClick={() => setDetail(row)} aria-label="View details"><Eye size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Bookings</h1>
          <p>Every booking made across ServiceHub.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__tabs">
          {TABS.map((item) => (
            <button key={item.key} type="button" className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadBookings} />
      ) : loading ? (
        <Loader label="Loading bookings" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No bookings found" message="Nothing matches this filter yet." />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Booking details">
        {detail && (
          <div className="booking-detail">
            <dl className="booking-detail__grid">
              <div><dt>Service</dt><dd>{detail.service?.title || 'Service removed'}</dd></div>
              <div><dt>Customer</dt><dd>{detail.user?.name} ({detail.user?.email})</dd></div>
              <div><dt>Provider</dt><dd>{detail.provider?.name} ({detail.provider?.phone || 'no phone'})</dd></div>
              <div><dt>Date & time</dt><dd>{formatDate(detail.date)} at {formatTime(detail.time)}</dd></div>
              <div><dt>Price</dt><dd>{formatPrice(detail.price)}</dd></div>
              <div><dt>Address</dt><dd>{detail.address}</dd></div>
              {detail.notes && <div className="booking-detail__full"><dt>Notes</dt><dd>{detail.notes}</dd></div>}
            </dl>

            <div className="booking-detail__status">
              <span className="label">Change status</span>
              <div className="booking-detail__options">
                {STATUS_OPTIONS.map((status) => {
                  const meta = BOOKING_STATUS[status];
                  return (
                    <button key={status} type="button" className={`badge badge--${meta.tone} ${detail.status === status ? 'is-selected' : ''}`} disabled={updating || detail.status === status} onClick={() => handleStatusChange(status)}>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
