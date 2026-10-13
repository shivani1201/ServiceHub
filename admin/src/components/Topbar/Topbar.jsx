import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, KeyRound } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Topbar.css';

const TITLES = {
  '/': 'Dashboard', '/users': 'Users', '/providers': 'Providers', '/services': 'Services',
  '/categories': 'Categories', '/bookings': 'Bookings', '/reviews': 'Reviews', '/settings': 'Settings',
};

const Topbar = ({ onMenuClick }) => {
  const { admin, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" onClick={onMenuClick} aria-label="Open menu"><Menu size={22} /></button>
      <h1 className="topbar__title">{TITLES[pathname] || 'Admin'}</h1>
      <div className="topbar__menu-wrap" ref={menuRef}>
        <button type="button" className="topbar__user" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-haspopup="menu">
          <Avatar name={admin?.name} size="sm" />
          <span className="topbar__user-name">{admin?.name}</span>
          <ChevronDown size={16} />
        </button>
        {menuOpen && (
          <div className="topbar__dropdown" role="menu">
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/settings'); }}><KeyRound size={16} /> Settings</button>
            <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={16} /> Log out</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
