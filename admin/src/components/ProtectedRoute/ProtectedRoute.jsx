import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../Loader/Loader.jsx';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullPage label="Checking your login..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
