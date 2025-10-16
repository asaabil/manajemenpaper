import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Papers from './pages/Papers';
import PaperDetail from './pages/PaperDetail';
import ReadingLists from './pages/ReadingLists';
import EditPaper from './pages/EditPaper';
import Stats from './pages/Stats';
import AdminPanel from './pages/Admin';
import UploadPaper from './pages/UploadPaper';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import useAuth from './hooks/useAuth';

function App() {
  const { user } = useAuth(); // Use user for role checking

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main>
        <Routes>
          {/* Redirect root path based on auth status */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* General Protected routes (all logged-in users) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/papers/:id" element={<PaperDetail />} />
            <Route path="/reading-lists" element={<ReadingLists />} />
            <Route path="/stats" element={<Stats />} />
          </Route>

          {/* Role-specific routes */}
          <Route element={<ProtectedRoute allowedRoles={['dosen', 'admin']} />}>
            <Route path="/upload" element={<UploadPaper />} />
            <Route path="/papers/:id/edit" element={<EditPaper />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

        </Routes>
      </main>
    </div>
  );
}

export default App;