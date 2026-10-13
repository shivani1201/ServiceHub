import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Clock, MapPin } from 'lucide-react';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { serviceAPI, providerAPI, bookingAPI } from '../../services/api.js';
import { formatDuration, formatPrice, formatTime, getDateParts, getErrorMessage, getNextDays, toDateString } from '../../utils/helpers.js';
import './Booking.css';

// This page sits behind ProtectedRoute in App.jsx, so a logged-in user is always present here.
const Booking = () => {
  const { serviceId } = useParams();

  const days = useMemo(() => getNextDays(21), []);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotMessage, setSlotMessage] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    serviceAPI
      .getById(serviceId)
      .then((data) => setService(data.service))
      .catch((err) => setError(getErrorMessage(err, 'This service could not be found.')))
      .finally(() => setLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (!selectedDate || !service) return;
    setSlotsLoading(true);
    setSelectedTime('');
    setSlotMessage('');

    providerAPI
      .getSlots(service.provider._id, toDateString(selectedDate))
      .then((data) => {
        setSlots(data.slots);
        if (data.message) setSlotMessage(data.message);
      })
      .catch((err) => setSlotMessage(getErrorMessage(err, 'We could not load times for this day.')))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, service]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!selectedDate || !selectedTime) {
      setFormError('Choose a date and a time for your booking.');
      return;
    }
    if (!address.trim()) {
      setFormError('Enter the address where the service will take place.');
      return;
    }

    setSubmitting(true);
    try {
      await bookingAPI.create({
        service: serviceId,
        date: toDateString(selectedDate),
        time: selectedTime,
        address: address.trim(),
        notes: notes.trim(),
      });
      setDone(true);
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not create your booking.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullPage label="Loading service" />;

  if (error || !service) {
    return (
      <div className="page">
        <div className="container">
          <EmptyState variant="error" title="Service not found" message={error} actionLabel="Browse services" actionTo="/services" />
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page">
        <div className="container">
          <div className="bkdone">
            <span className="bkdone__icon"><CheckCircle2 size={34} /></span>
            <h1>Booking request sent</h1>
            <p className="muted">{service.provider.name} will confirm your booking soon. You can track its status from My Bookings.</p>
            <div className="bkdone__actions">
              <Button to="/my-bookings">View my bookings</Button>
              <Button to="/services" variant="outline">Browse more services</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to={`/services/${serviceId}`}>{service.title}</Link>
          <ChevronRight size={14} />
          <span aria-current="page">Book</span>
        </nav>

        <div className="page__head">
          <h1>Book {service.title}</h1>
          <p>With {service.provider.name} in {service.provider.location}</p>
        </div>

        <div className="bk-form">
          <form className="bk-form__main" onSubmit={handleSubmit}>
            <section className="bk-form__section">
              <h2>1. Choose a date</h2>
              <div className="bk-form__days">
                {days.map((day) => {
                  const parts = getDateParts(toDateString(day));
                  const isSelected = selectedDate && toDateString(selectedDate) === toDateString(day);
                  return (
                    <button type="button" key={day.toISOString()} className={`bk-form__day ${isSelected ? 'is-selected' : ''}`} onClick={() => setSelectedDate(day)}>
                      <small>{parts.weekday}</small>
                      <strong>{parts.day}</strong>
                      <span>{parts.month}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bk-form__section">
              <h2>2. Choose a time</h2>
              {!selectedDate ? (
                <p className="muted">Pick a date to see the times this provider is free.</p>
              ) : slotsLoading ? (
                <Loader label="Loading times" />
              ) : slots.length === 0 ? (
                <p className="muted">{slotMessage || 'No times are available on this day.'}</p>
              ) : (
                <>
                  {slotMessage && <p className="muted">{slotMessage}</p>}
                  <div className="bk-form__times">
                    {slots.map((slot) => (
                      <button type="button" key={slot.time} className={`bk-form__time ${selectedTime === slot.time ? 'is-selected' : ''}`} disabled={!slot.available} onClick={() => setSelectedTime(slot.time)}>
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="bk-form__section">
              <h2>3. Your details</h2>
              <div className="field">
                <label htmlFor="address">Service address</label>
                <input id="address" className="input" placeholder="Street, area, city" value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="notes">Notes for the provider (optional)</label>
                <textarea id="notes" className="textarea" maxLength={500} placeholder="Anything that helps them prepare" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </section>

            {formError && <div className="alert alert--error" role="alert">{formError}</div>}

            <Button type="submit" size="lg" block loading={submitting}>Confirm booking</Button>
          </form>

          <aside className="bk-form__summary">
            <div className="bk-form__summary-card">
              <h3>Booking summary</h3>
              <p className="bk-form__service">{service.title}</p>
              <p className="muted"><Clock size={15} /> {formatDuration(service.duration)}</p>
              {selectedDate && (
                <p className="muted">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  {selectedTime ? ` at ${formatTime(selectedTime)}` : ''}
                </p>
              )}
              {address && <p className="muted"><MapPin size={15} /> {address}</p>}
              <div className="bk-form__price">
                <span>Total</span>
                <strong>{formatPrice(service.price)}</strong>
              </div>
              <p className="field__hint">No payment is taken online. You pay the provider directly.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Booking;
