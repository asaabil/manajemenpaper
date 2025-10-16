
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth(); // Use user object which contains role

  // 1. Check for user object (which implies token exists and is valid)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check for role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to a safe page if role is not authorized
    return <Navigate to="/dashboard" replace />;
  }

  // 3. If all checks pass, render the requested component
  return <Outlet />;
};

export default ProtectedRoute;
