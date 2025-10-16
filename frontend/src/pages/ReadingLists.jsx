
import { useState } from 'react';
import { useReadingLists, useCreateReadingList, useRemovePaperFromReadingList, useDeleteReadingList } from '../hooks/useReadingLists';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';

const ReadingLists = () => {
  const { data: readingLists, isLoading, isError, error } = useReadingLists();
  const createMutation = useCreateReadingList();
  const removePaperMutation = useRemovePaperFromReadingList();
  const deleteListMutation = useDeleteReadingList();

  const [newListName, setNewListName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName) return;
    createMutation.mutate({ name: newListName, isPublic });
    setNewListName('');
  };

  const handleRemovePaper = (readingListId, paperId) => {
    if (window.confirm('Are you sure you want to remove this paper from the list?')) {
      removePaperMutation.mutate({ readingListId, paperId });
    }
  }

  const handleDeleteList = (readingListId) => {
    if (window.confirm('Are you sure you want to delete this entire reading list?')) {
      deleteListMutation.mutate(readingListId);
    }
  }

  if (isLoading) return <Spinner />;
  if (isError) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Reading Lists</h1>

      <form onSubmit={handleCreateList} className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Create New List</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
          />
          <div className="flex items-center">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} id="isPublic" className="mr-2" />
            <label htmlFor="isPublic">Public</label>
          </div>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {readingLists && readingLists.map(list => (
          <div key={list._id} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{list.name} <span className="text-sm font-normal text-gray-500">({list.isPublic ? 'Public' : 'Private'})</span></h3>
              <button 
                onClick={() => handleDeleteList(list._id)}
                disabled={deleteListMutation.isPending}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
              >
                Delete List
              </button>
            </div>
            <ul className="mt-2 list-disc list-inside">
              {list.papers.map(paper => (
                <li key={paper._id} className="flex justify-between items-center">
                  <Link to={`/papers/${paper._id}`} className="text-indigo-600 hover:underline">{paper.title}</Link>
                  <button onClick={() => handleRemovePaper(list._id, paper._id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </li>
              ))}
              {list.papers.length === 0 && <p className="text-gray-500">This list is empty.</p>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingLists;
