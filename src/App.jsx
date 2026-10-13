import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import Home from './pages/Home/Home.jsx';
import Services from './pages/Services/Services.jsx';
import ServiceDetails from './pages/ServiceDetails/ServiceDetails.jsx';
import ProviderDetails from './pages/ProviderDetails/ProviderDetails.jsx';
import Booking from './pages/Booking/Booking.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import MyBookings from './pages/MyBookings/MyBookings.jsx';
import MyServices from './pages/MyServices/MyServices.jsx';
import Profile from './pages/Profile/Profile.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/:id" element={<ServiceDetails />} />
      <Route path="/providers/:id" element={<ProviderDetails />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/book/:serviceId" element={<Booking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route element={<ProtectedRoute roles={['provider']} />}>
        <Route path="/my-services" element={<MyServices />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>

    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
  </Routes>
);

export default App;
