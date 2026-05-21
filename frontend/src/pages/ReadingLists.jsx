
import { useState } from 'react';
import { useReadingLists, usePublicReadingLists, useCreateReadingList, useRemovePaperFromReadingList, useDeleteReadingList } from '../hooks/useReadingLists';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import AddPaperModal from '../components/AddPaperModal';
import useAuth from '../hooks/useAuth';

const ReadingLists = () => {
  const { user } = useAuth();
  const { data: myReadingLists, isLoading: loadingMy, isError: isErrorMy, error: errorMy } = useReadingLists();
  const { data: publicReadingLists, isLoading: loadingPublic, isError: isErrorPublic, error: errorPublic } = usePublicReadingLists();
  
  const createMutation = useCreateReadingList();
  const removePaperMutation = useRemovePaperFromReadingList();
  const deleteListMutation = useDeleteReadingList();

  const [newListName, setNewListName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // State for AddPaperModal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);

  const canCreatePublic = user?.role === 'dosen' || user?.role === 'admin';

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName) return;
    // Force false for mahasiswa even if they try to send true
    const finalIsPublic = canCreatePublic ? isPublic : false;
    createMutation.mutate({ name: newListName, isPublic: finalIsPublic });
    setNewListName('');
    setIsPublic(false);
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

  const openAddModal = (listId) => {
    setSelectedListId(listId);
    setIsAddModalOpen(true);
  }

  if (loadingMy || loadingPublic) return <Spinner />;
  if (isErrorMy) return <div className="text-red-500">Error: {errorMy.message}</div>;

  // Filter public lists to exclude those already in myReadingLists to avoid duplication
  const otherPublicLists = publicReadingLists?.filter(pubList => 
    !myReadingLists?.some(myList => myList._id === pubList._id)
  ) || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reading Lists</h1>

      {/* Section: Create New List */}
      <form onSubmit={handleCreateList} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Create New List</h2>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">List Name</label>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Deep Learning Basics"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {canCreatePublic && (
            <div className="flex items-center mb-2">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
                id="isPublic" 
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm dark:text-gray-300">Public List</label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={createMutation.isPending} 
            className="w-full md:w-auto px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
        {!canCreatePublic && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">Note: Only Dosen can create public reading lists.</p>
        )}
      </form>

      {/* Section: My Lists */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 dark:text-white border-b pb-2 dark:border-gray-700">My Reading Lists</h2>
        <div className="grid grid-cols-1 gap-6">
          {myReadingLists && myReadingLists.length > 0 ? myReadingLists.map(list => (
            <div key={list._id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">{list.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${list.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {list.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openAddModal(list._id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    + Add Paper
                  </button>
                  <button 
                    onClick={() => handleDeleteList(list._id)}
                    disabled={deleteListMutation.isPending}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                  >
                    Delete List
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {list.papers.map(paper => (
                  <li key={paper._id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    <Link to={`/papers/${paper._id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">{paper.title}</Link>
                    <button onClick={() => handleRemovePaper(list._id, paper._id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </li>
                ))}
                {list.papers.length === 0 && <p className="text-gray-500 dark:text-gray-400 italic">This list is empty.</p>}
              </ul>
            </div>
          )) : (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">You haven't created any reading lists yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section: Public Lists from Others */}
      <div>
        <h2 className="text-xl font-bold mb-4 dark:text-white border-b pb-2 dark:border-gray-700">Explore Public Reading Lists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherPublicLists.length > 0 ? otherPublicLists.map(list => (
            <div key={list._id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-lg font-bold dark:text-white">{list.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created by: {list.owner?.name} ({list.owner?.role})</p>
              </div>
              <ul className="space-y-1">
                {list.papers.slice(0, 3).map(paper => (
                  <li key={paper._id} className="text-sm truncate dark:text-gray-300">
                    • <Link to={`/papers/${paper._id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{paper.title}</Link>
                  </li>
                ))}
                {list.papers.length > 3 && (
                  <li className="text-xs text-gray-500 dark:text-gray-400 pl-4 mt-1">...and {list.papers.length - 3} more papers</li>
                )}
                {list.papers.length === 0 && <p className="text-xs text-gray-500 italic">Empty list</p>}
              </ul>
              <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end">
                 <Link to={`/reading-lists/${list._id}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">View Full List →</Link>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No public reading lists found from other users.</p>
            </div>
          )}
        </div>
      </div>

      <AddPaperModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        readingListId={selectedListId} 
      />
    </div>
  );
};

export default ReadingLists;
