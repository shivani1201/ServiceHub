import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import Login from './pages/Login/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Users from './pages/Users/Users.jsx';
import Providers from './pages/Providers/Providers.jsx';
import Services from './pages/Services/Services.jsx';
import Categories from './pages/Categories/Categories.jsx';
import Bookings from './pages/Bookings/Bookings.jsx';
import Reviews from './pages/Reviews/Reviews.jsx';
import Settings from './pages/Settings/Settings.jsx';

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/services" element={<Services />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
  </Routes>
);

export default App;
