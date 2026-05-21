import { useState } from 'react';
import { usePapers } from '../hooks/usePapers';
import { useAddPaperToReadingList, useReadingLists } from '../hooks/useReadingLists';
import Spinner from './Spinner';

const AddPaperModal = ({ readingListId, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  
  const { data: readingLists } = useReadingLists();
  const { data: papersData, isLoading, isError, error } = usePapers(page, 10, searchTerm);
  const addPaperMutation = useAddPaperToReadingList();

  if (!isOpen) return null;

  // Find the current reading list to see which papers are already in it
  const currentList = readingLists?.find(list => list._id === readingListId);
  const existingPaperIds = new Set(currentList?.papers?.map(p => p._id) || []);

  const handleAdd = (paperId) => {
    addPaperMutation.mutate({ readingListId, paperId });
  };

  // Filter out papers that are already in the list
  const filteredPapers = papersData?.papers?.filter(paper => !existingPaperIds.has(paper._id)) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Add Papers to "{currentList?.name}"</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            &times;
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search papers to add..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : (
          <div className="space-y-2">
            {filteredPapers.map((paper) => (
              <div key={paper._id} className="flex justify-between items-center p-2 border rounded-md dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-medium dark:text-white truncate">{paper.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{paper.authors.join(', ')}</p>
                </div>
                <button
                  onClick={() => handleAdd(paper._id)}
                  disabled={addPaperMutation.isPending}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 whitespace-nowrap"
                >
                  {addPaperMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            ))}
            {filteredPapers.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                {searchTerm ? 'No new papers found for this search.' : 'All papers in this results page are already in your list.'}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-md disabled:opacity-50"
            >
              Prev
            </button>
            <span className="dark:text-white">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!papersData?.hasNextPage}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 dark:text-white rounded-md">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPaperModal;
