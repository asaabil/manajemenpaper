
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn, loginError, user } = useAuth();
  const navigate = useNavigate();

  console.log('5. Login page re-rendered. User object is:', user);

  useEffect(() => {
    console.log('6. Login page useEffect running. Checking user object:', user);
    if (user) {
      console.log('7. User object exists! Redirecting to /dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
              required
            />
          </div>
          {loginError && <p className="text-sm text-red-600">{loginError.response?.data?.message || 'Login failed'}</p>}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-sm text-center">
          Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
