import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = ({ light = false, to = '/' }) => (
  <Link to={to} className={`logo ${light ? 'logo--light' : ''}`} aria-label="ServiceHub home">
    <svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#3f2a9e" />
      <path d="M42 22C40 18 36 17 32 17C27 17 23 19 23 24C23 32 41 28 41 38C41 43 37 46 32 46C27 46 23 44 22 40" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="47" cy="17" r="5" fill="#ff6f59" />
    </svg>
    <span>ServiceHub</span>
  </Link>
);

export default Logo;
