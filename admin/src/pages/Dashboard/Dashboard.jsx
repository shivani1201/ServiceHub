import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BadgeCheck, Wrench, CalendarCheck, Clock3, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import StatCard from '../../components/StatCard/StatCard.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import EmptyState from '../../components/EmptyState/EmptyState.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import { dashboardAPI } from '../../services/api.js';
import { BOOKING_STATUS, formatDateTime, formatPrice, getErrorMessage } from '../../utils/helpers.js';
import './Dashboard.css';

const STATUS_COLORS = { pending: '#9a5f08', confirmed: '#2c5fc9', completed: '#17805a', cancelled: '#8e89a3', rejected: '#c63a4a' };

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = () => {
    setLoading(true);
    setError('');
    dashboardAPI
      .getStats()
      .then((result) => setData(result))
      .catch((err) => setError(getErrorMessage(err, 'We could not load the dashboard.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadStats, []);

  if (loading) return <Loader fullPage label="Loading dashboard" />;
  if (error || !data) {
    return <EmptyState variant="error" title="Something went wrong" message={error} actionLabel="Try again" onAction={loadStats} />;
  }

  const { stats, charts, recentBookings } = data;
  const statusData = charts.bookingsByStatus.map((row) => ({ ...row, fill: STATUS_COLORS[row.status] || '#8e89a3' }));

  return (
    <div>
      <div className="page__head">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of what is happening across ServiceHub.</p>
        </div>
      </div>

      <div className="dash__stats">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={BadgeCheck} label="Total providers" value={stats.totalProviders} />
        <StatCard icon={Wrench} label="Total services" value={stats.totalServices} />
        <StatCard icon={CalendarCheck} label="Total bookings" value={stats.totalBookings} />
        <StatCard icon={Clock3} label="Pending providers" value={stats.pendingProviders} tone="warning" />
        <StatCard icon={CheckCircle2} label="Completed bookings" value={stats.completedBookings} tone="success" />
      </div>

      <div className="dash__charts">
        <div className="chart-card">
          <h3>Bookings, last 6 months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.bookingsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5d5873' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5d5873' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Bookings" stroke="#3f2a9e" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>New users, last 6 months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5d5873' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5d5873' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="New users" stroke="#ff6f59" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Most popular services</h3>
          {charts.popularServices.length === 0 ? (
            <p className="muted chart-card__empty">No bookings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.popularServices} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#5d5873' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 12, fill: '#5d5873' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="bookings" name="Bookings" fill="#3f2a9e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Bookings by status</h3>
          {statusData.length === 0 ? (
            <p className="muted chart-card__empty">No bookings yet.</p>
          ) : (
            <div className="chart-card__pie-row">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {statusData.map((entry) => <Cell key={entry.status} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="chart-card__legend">
                {statusData.map((entry) => (
                  <li key={entry.status}>
                    <span style={{ background: entry.fill }} />
                    {BOOKING_STATUS[entry.status]?.label || entry.status} ({entry.count})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="dash__recent">
        <div className="section-head">
          <h2>Recent bookings</h2>
          <Link to="/bookings" className="text-link">View all</Link>
        </div>
        {recentBookings.length === 0 ? (
          <EmptyState title="No bookings yet" message="Bookings will appear here once customers start booking services." />
        ) : (
          <ul className="recent-list">
            {recentBookings.map((booking) => {
              const status = BOOKING_STATUS[booking.status] || BOOKING_STATUS.pending;
              return (
                <li key={booking._id} className="recent-list__item">
                  <Avatar name={booking.user?.name || '?'} size="sm" />
                  <div className="recent-list__info">
                    <strong>{booking.service?.title || 'Service removed'}</strong>
                    <span className="muted">{booking.user?.name} with {booking.provider?.name} &middot; {formatDateTime(booking.createdAt)}</span>
                  </div>
                  <span className="recent-list__price">{formatPrice(booking.price)}</span>
                  <span className={`badge badge--${status.tone}`}>{status.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
