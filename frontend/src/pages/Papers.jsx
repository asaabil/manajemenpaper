
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePapers, useDeletePaper } from '../hooks/usePapers';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/Spinner';

const Papers = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error, isPreviousData } = usePapers(page, 10, searchTerm);
  const { user } = useAuth();
  const deletePaperMutation = useDeletePaper();

  const handleSearch = (e) => {
    e.preventDefault();
    // The hook will automatically refetch when searchTerm changes
  };

  const handleDelete = (paperId) => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      deletePaperMutation.mutate(paperId);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Papers</h1>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search papers..."
            className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring focus:ring-indigo-200"
          />
          <button type="submit" className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-r-md hover:bg-indigo-700">
            Search
          </button>
        </div>
      </form>

      {isLoading && <Spinner />}
      {isError && <div className="text-red-500">Error: {error.message}</div>}

      <div className="grid grid-cols-1 gap-4">
        {data?.papers && data.papers.map((paper) => (
          <div key={paper._id} className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <Link to={`/papers/${paper._id}`} className="text-xl font-semibold text-indigo-700 dark:text-indigo-400 hover:underline">
                {paper.title}
              </Link>
              {(paper.owner?._id.toString() === user?.id || user?.role === 'admin') && (
                <div className="flex space-x-2">
                  <Link to={`/papers/${paper._id}/edit`} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Edit</Link>
                  <button onClick={() => handleDelete(paper._id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                </div>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300">{paper.authors.join(', ')}</p>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Views: {paper.viewCount}</span> | <span>Downloads: {paper.downloadCount}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 font-bold text-white bg-gray-500 rounded-md disabled:bg-gray-300"
        >
          Previous
        </button>
        <span>Page {page} of {data?.totalPages || 1}</span>
        <button
          onClick={() => {
            if (!isPreviousData && data?.hasNextPage) {
              setPage((old) => old + 1);
            }
          }}
          disabled={isPreviousData || !data?.hasNextPage}
          className="px-4 py-2 font-bold text-white bg-gray-500 rounded-md disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Papers;
