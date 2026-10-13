import { Link } from 'react-router-dom';
import { Clock, MapPin, Phone, MessageSquare, Check } from 'lucide-react';
import Button from '../Button/Button.jsx';
import { BOOKING_STATUS, formatDate, formatPrice, formatTime, getDateParts } from '../../utils/helpers.js';
import './BookingCard.css';

const BookingCard = ({ booking, viewer = 'customer', busy = false, onCancel, onReview, onStatusChange }) => {
  const { service, provider, user } = booking;
  const status = BOOKING_STATUS[booking.status] || BOOKING_STATUS.pending;
  const parts = getDateParts(booking.date);
  const isCustomer = viewer === 'customer';
  const isClosed = ['cancelled', 'rejected'].includes(booking.status);

  return (
    <article className={`bk ${isClosed ? 'bk--closed' : ''}`}>
      <div className="bk__date" aria-hidden="true">
        <span>{parts.weekday}</span>
        <strong>{parts.day}</strong>
        <span>{parts.month}</span>
      </div>
      <div className="bk__main">
        <div className="bk__top">
          <h3>{service?.title || 'Service no longer available'}</h3>
          <span className={`badge badge--${status.tone}`}>{status.label}</span>
        </div>
        <p className="bk__who">
          {isCustomer ? (
            provider ? (<>With <Link to={`/providers/${provider._id}`}>{provider.name}</Link></>) : ('Provider no longer available')
          ) : (
            <>Customer: <strong>{user?.name || 'Unknown'}</strong></>
          )}
        </p>
        <ul className="bk__facts">
          <li><Clock size={15} /> {formatDate(booking.date)} at {formatTime(booking.time)}</li>
          <li><MapPin size={15} /> {booking.address}</li>
          {!isCustomer && user?.phone && <li><Phone size={15} /> {user.phone}</li>}
        </ul>
        {booking.notes && <p className="bk__notes"><MessageSquare size={15} /> {booking.notes}</p>}
      </div>
      <div className="bk__side">
        <span className="bk__price">{formatPrice(booking.price)}</span>
        <div className="bk__actions">
          {isCustomer && booking.status === 'completed' && !booking.isReviewed && (
            <Button size="sm" onClick={() => onReview(booking)}>Leave a review</Button>
          )}
          {isCustomer && booking.status === 'completed' && booking.isReviewed && (
            <span className="bk__reviewed"><Check size={15} /> Reviewed</span>
          )}
          {isCustomer && ['pending', 'confirmed'].includes(booking.status) && (
            <Button size="sm" variant="outline" onClick={() => onCancel(booking)} disabled={busy}>Cancel booking</Button>
          )}
          {!isCustomer && booking.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => onStatusChange(booking, 'confirmed')} loading={busy}>Confirm</Button>
              <Button size="sm" variant="danger" onClick={() => onStatusChange(booking, 'rejected')} disabled={busy}>Decline</Button>
            </>
          )}
          {!isCustomer && booking.status === 'confirmed' && (
            <>
              <Button size="sm" onClick={() => onStatusChange(booking, 'completed')} loading={busy}>Mark as completed</Button>
              <Button size="sm" variant="outline" onClick={() => onStatusChange(booking, 'cancelled')} disabled={busy}>Cancel</Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default BookingCard;
