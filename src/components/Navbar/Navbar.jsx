import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../Logo/Logo.jsx';
import Avatar from '../Avatar/Avatar.jsx';
import Button from '../Button/Button.jsx';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = [{ to: '/services', label: 'Services' }];
  if (user) {
    links.push({ to: '/dashboard', label: 'Dashboard' }, { to: '/my-bookings', label: 'My bookings' });
    if (user.role === 'provider') links.push({ to: '/my-services', label: 'My services' });
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Logo />
        <nav className="nav__links" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav__link">{link.label}</NavLink>
          ))}
        </nav>
        <div className="nav__actions">
          {user ? (
            <div className="nav__menu" ref={menuRef}>
              <button type="button" className="nav__user" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-haspopup="menu">
                <Avatar name={user.name} src={user.profileImage} size="sm" />
                <span className="nav__user-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={16} />
              </button>
              {menuOpen && (
                <div className="nav__dropdown" role="menu">
                  <div className="nav__dropdown-head">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                  <NavLink to="/profile" role="menuitem"><User size={17} /> Profile</NavLink>
                  <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={17} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">Log in</Button>
              <Button to="/register" size="sm">Sign up</Button>
            </>
          )}
        </div>
        <button type="button" className="nav__toggle" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="nav__mobile">
          <div className="container nav__mobile-inner">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className="nav__mobile-link">{link.label}</NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/profile" className="nav__mobile-link">Profile</NavLink>
                <button type="button" className="nav__mobile-link nav__mobile-logout" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <div className="nav__mobile-auth">
                <Button to="/login" variant="outline" block>Log in</Button>
                <Button to="/register" block>Sign up</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
