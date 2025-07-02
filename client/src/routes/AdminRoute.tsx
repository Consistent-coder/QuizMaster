import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user } = useAuth();
  return user && user?.role==="ADMIN" ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminRoute;