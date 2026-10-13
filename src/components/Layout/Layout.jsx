import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.jsx';
import Footer from '../Footer/Footer.jsx';

const Layout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
