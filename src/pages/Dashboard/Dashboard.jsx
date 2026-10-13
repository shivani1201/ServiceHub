import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, ListChecks, Plus, ShoppingBag, Sparkles, Wallet } from 'lucide-react';
import BookingCard from '../../components/BookingCard/BookingCard.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { bookingAPI, serviceAPI } from '../../services/api.js';
import { formatPrice, getErrorMessage } from '../../utils/helpers.js';
import './Dashboard.css';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="stat">
    <span className="stat__icon"><Icon size={20} /></span>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);

const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingAPI
      .getMine()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(getErrorMessage(err, 'We could not load your bookings.')))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === 'completed');
    const totalSpent = completed.reduce((sum, b) => sum + (b.price || 0), 0);
    return { upcoming, completedCount: completed.length, totalSpent };
  }, [bookings]);

  const upcomingBookings = bookings
    .filter((b) => ['pending', 'confirmed'].includes(b.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);

  return (
    <>
      <div className="dash__stats">
        <StatCard icon={CalendarClock} label="Upcoming bookings" value={stats.upcoming} />
        <StatCard icon={CheckCircle2} label="Completed bookings" value={stats.completedCount} />
        <StatCard icon={Wallet} label="Total spent" value={formatPrice(stats.totalSpent)} />
      </div>

      <section className="dash__section">
        <div className="section-head">
          <div><h2>Your next bookings</h2></div>
          <Link to="/my-bookings" className="text-link">View all</Link>
        </div>

        {error ? (
          <EmptyState variant="error" title="Something went wrong" message={error} />
        ) : loading ? (
          <Loader label="Loading bookings" />
        ) : upcomingBookings.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No upcoming bookings" message="When you book a service, it will show up here." actionLabel="Browse services" actionTo="/services" />
        ) : (
          <div className="bk-list">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} viewer="customer" onCancel={() => {}} onReview={() => {}} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

const ProviderDashboard = ({ provider }) => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [serviceCount, setServiceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError('');
    Promise.all([bookingAPI.getForProvider(), serviceAPI.getMine()])
      .then(([bookingData, serviceData]) => {
        setBookings(bookingData.bookings);
        setServiceCount(serviceData.count);
      })
      .catch((err) => setError(getErrorMessage(err, 'We could not load your dashboard.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleStatusChange = async (booking, status) => {
    setBusyId(booking._id);
    try {
      const { booking: updated } = await bookingAPI.updateStatus(booking._id, status);
      setBookings((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(status === 'confirmed' ? 'Booking confirmed' : status === 'rejected' ? 'Booking declined' : `Booking marked as ${status}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not update this booking.'));
    } finally {
      setBusyId(null);
    }
  };

  const pending = bookings.filter((b) => b.status === 'pending');
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;

  return (
    <>
      {!provider?.isApproved && (
        <div className={`alert ${provider?.approvalStatus === 'rejected' ? 'alert--error' : 'alert--warning'} dash__banner`}>
          {provider?.approvalStatus === 'rejected'
            ? 'Your provider profile was not approved. Please update your details in your profile and contact support if you have questions.'
            : 'Your provider profile is waiting for admin approval. Once approved, your services will appear publicly and you can add more.'}
        </div>
      )}

      <div className="dash__stats">
        <StatCard icon={Clock3} label="Pending requests" value={pending.length} />
        <StatCard icon={CalendarClock} label="Confirmed bookings" value={confirmed} />
        <StatCard icon={CheckCircle2} label="Completed jobs" value={completed} />
        <StatCard icon={ListChecks} label="Active services" value={serviceCount} />
      </div>

      <section className="dash__section">
        <div className="section-head">
          <div>
            <h2>Booking requests</h2>
            <p>New requests need a response before the customer's date arrives.</p>
          </div>
          <Button to="/my-services" variant="secondary" size="sm" icon={Plus}>Manage services</Button>
        </div>

        {error ? (
          <EmptyState variant="error" title="Something went wrong" message={error} />
        ) : loading ? (
          <Loader label="Loading requests" />
        ) : pending.length === 0 ? (
          <EmptyState icon={Sparkles} title="No pending requests" message="New booking requests will appear here as they come in." />
        ) : (
          <div className="bk-list">
            {pending.map((booking) => (
              <BookingCard key={booking._id} booking={booking} viewer="provider" busy={busyId === booking._id} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

const Dashboard = () => {
  const { user, provider } = useAuth();

  return (
    <div className="page">
      <div className="container">
        <div className="page__head">
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p>{user.role === 'provider' ? "Here's what's happening with your services." : "Here's a quick look at your bookings."}</p>
        </div>

        {user.role === 'provider' ? <ProviderDashboard provider={provider} /> : <CustomerDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
