
import useAuth from '../hooks/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="p-10 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-bold">Welcome!</h1>
        {user && (
          <div className="mt-4 text-lg">
            <p>Email: <span className="font-mono p-1 bg-gray-200 rounded">{user.email}</span></p>
            <p>Role: <span className="font-mono p-1 bg-green-200 text-green-800 rounded">{user.role}</span></p>
          </div>
        )}
        <button 
          onClick={logout} 
          className="px-6 py-2 mt-8 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
