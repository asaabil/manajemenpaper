
import { Link, NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Redirect to login page is handled by ProtectedRoute and App.jsx logic
  };

  const getLinkClassName = ({ isActive }) =>
    [
      'hover:underline',
      isActive ? 'font-bold text-blue-500 dark:text-blue-400' : 'text-gray-800 dark:text-white',
    ].join(' ');

  return (
    <nav className="bg-white dark:bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
          PaperManager
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <NavLink to="/papers" className={getLinkClassName}>
                Papers
              </NavLink>
              {(user.role === 'dosen' || user.role === 'admin') && (
                <NavLink to="/upload" className={getLinkClassName}>
                  Upload
                </NavLink>
              )}
              <NavLink to="/reading-lists" className={getLinkClassName}>
                Reading Lists
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className={getLinkClassName}>
                  Admin
                </NavLink>
              )}
              <NavLink to="/stats" className={getLinkClassName}>
                Stats
              </NavLink>
              <span className="font-medium text-gray-800 dark:text-white">
                Welcome, {user.email} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={getLinkClassName}>
                Login
              </NavLink>
              <NavLink to="/register" className={getLinkClassName}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
