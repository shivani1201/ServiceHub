import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BadgeCheck, Wrench, Tags, CalendarCheck, Star, Settings, X } from 'lucide-react';
import './Sidebar.css';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/providers', label: 'Providers', icon: BadgeCheck },
  { to: '/services', label: 'Services', icon: Wrench },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ open, onClose }) => (
  <>
    {open && <div className="sidebar__scrim" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar__brand">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="18" fill="#3f2a9e" />
          <path d="M42 22C40 18 36 17 32 17C27 17 23 19 23 24C23 32 41 28 41 38C41 43 37 46 32 46C27 46 23 44 22 40" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          <circle cx="47" cy="17" r="5" fill="#ff6f59" />
        </svg>
        <span>ServiceHub</span>
        <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
      </div>

      <nav className="sidebar__nav" aria-label="Admin">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="sidebar__link" onClick={onClose}>
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <p className="sidebar__foot">ServiceHub Admin</p>
    </aside>
  </>
);

export default Sidebar;
