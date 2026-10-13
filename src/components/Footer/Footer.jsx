import { Link } from 'react-router-dom';
import { Mail, Clock } from 'lucide-react';
import Logo from '../Logo/Logo.jsx';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer__grid">
      <div className="footer__brand">
        <Logo />
        <p>Find trusted local providers, compare prices and reviews, and book a time that suits you.</p>
      </div>
      <nav aria-label="Explore">
        <h4>Explore</h4>
        <ul>
          <li><Link to="/services">All services</Link></li>
          <li><Link to="/my-bookings">My bookings</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
      </nav>
      <nav aria-label="For providers">
        <h4>For providers</h4>
        <ul>
          <li><Link to="/register?type=provider">Become a provider</Link></li>
          <li><Link to="/login">Provider log in</Link></li>
        </ul>
      </nav>
      <div>
        <h4>Get in touch</h4>
        <ul className="footer__contact">
          <li><Mail size={16} /> hello@servicehub.example</li>
          <li><Clock size={16} /> Monday to Friday, 9am to 6pm</li>
        </ul>
      </div>
    </div>
    <div className="container footer__base">
      <p>&copy; {new Date().getFullYear()} ServiceHub. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
