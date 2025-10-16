
import { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useAdmin';
import { usePapers, useDeletePaper } from '../hooks/usePapers';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Manage Users
          </button>
          <button onClick={() => setActiveTab('papers')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'papers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Manage Papers
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'papers' && <PapersTab />}
      </div>
    </div>
  );
};

const UsersTab = () => {
  const { data: users, isLoading, isError } = useUsers();
  const deleteUserMutation = useDeleteUser();

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  }

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-red-500">Error loading users.</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <ul>
        {users?.map(user => (
          <li key={user._id} className="flex justify-between items-center p-2 border-b">
            <div>
              <p className="font-semibold">{user.name} ({user.email})</p>
              <p className="text-sm text-gray-600">Role: {user.role}</p>
            </div>
            <button onClick={() => handleDelete(user._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PapersTab = () => {
  const { data, isLoading, isError } = usePapers(); // Fetch all papers
  const deletePaperMutation = useDeletePaper();

  const handleDelete = (paperId) => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      deletePaperMutation.mutate(paperId);
    }
  }

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-red-500">Error loading papers.</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <ul>
        {data?.papers?.map(paper => (
          <li key={paper._id} className="flex justify-between items-center p-2 border-b">
            <div>
              <Link to={`/papers/${paper._id}`} className="font-semibold text-indigo-600 hover:underline">{paper.title}</Link>
              <p className="text-sm text-gray-600">{paper.authors.join(', ')}</p>
            </div>
            <button onClick={() => handleDelete(paper._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPanel;
