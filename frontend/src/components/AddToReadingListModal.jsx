
import { useState } from 'react';
import { useReadingLists, useAddPaperToReadingList, useCreateReadingList } from '../hooks/useReadingLists';

const AddToReadingListModal = ({ paperId, isOpen, onClose }) => {
  const { data: readingLists, isLoading } = useReadingLists();
  const addPaperMutation = useAddPaperToReadingList();
  const createListMutation = useCreateReadingList();

  const [selectedList, setSelectedList] = useState('');
  const [newListName, setNewListName] = useState('');
  const [mode, setMode] = useState('select'); // 'select' or 'create'

  if (!isOpen) return null;

  const handleAddToExistingList = (e) => {
    e.preventDefault();
    if (!selectedList) return;
    addPaperMutation.mutate({ readingListId: selectedList, paperId }, {
      onSuccess: () => {
        onClose();
        setMode('select');
        setSelectedList('');
      }
    });
  };

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    if (!newListName) return;
    createListMutation.mutate({ name: newListName }, {
      onSuccess: (data) => {
        const newListId = data.data.data._id;
        addPaperMutation.mutate({ readingListId: newListId, paperId }, {
          onSuccess: () => {
            onClose();
            setMode('select');
            setNewListName('');
          }
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add to Reading List</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            {mode === 'select' ? (
              <form onSubmit={handleAddToExistingList}>
                <div className="mb-4">
                  <label htmlFor="reading-list-select" className="block text-sm font-medium mb-2">Choose an existing list:</label>
                  <select 
                    id="reading-list-select"
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="" disabled>Select a list</option>
                    {readingLists?.map(list => (
                      <option key={list._id} value={list._id}>{list.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <button type="button" onClick={() => setMode('create')} className="text-sm text-indigo-600 hover:underline">Or create a new list</button>
                  <div className="flex space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                    <button type="submit" disabled={addPaperMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">
                      {addPaperMutation.isPending ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
                {addPaperMutation.isError && <p className="text-red-500 text-sm mt-2">{addPaperMutation.error.message}</p>}
              </form>
            ) : (
              <form onSubmit={handleCreateAndAdd}>
                <div className="mb-4">
                  <label htmlFor="new-list-name" className="block text-sm font-medium mb-2">New list name:</label>
                  <input 
                    id="new-list-name"
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., 'Machine Learning Papers'"
                    required
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button type="button" onClick={() => setMode('select')} className="text-sm text-indigo-600 hover:underline">Or select an existing list</button>
                  <div className="flex space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                    <button type="submit" disabled={createListMutation.isPending || addPaperMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300">
                      {createListMutation.isPending || addPaperMutation.isPending ? 'Saving...' : 'Create & Add'}
                    </button>
                  </div>
                </div>
                {createListMutation.isError && <p className="text-red-500 text-sm mt-2">{createListMutation.error.message}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToReadingListModal;
