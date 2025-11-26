import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePaper, useDeletePaper } from '../hooks/usePapers';
import useAuth from '../hooks/useAuth';
import AddToReadingListModal from '../components/AddToReadingListModal';
import Spinner from '../components/Spinner';

const PaperDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: paper, isLoading, isError, error } = usePaper(id);
  const deletePaperMutation = useDeletePaper();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      deletePaperMutation.mutate(id, {
        onSuccess: () => {
          console.log('Paper deleted successfully');
          // navigate('/papers');
        }
      });
    }
  };

  if (isLoading) return <Spinner />;
  if (isError) return <div className="text-red-500">Error: {error.message}</div>;
  if (!paper) return <div>Paper not found.</div>;

  const isOwner = (typeof paper.owner === 'string' ? paper.owner : paper.owner?._id) === user?.id;
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-2">{paper.title}</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{paper.authors.join(', ')}</p>

        <div className="space-x-2 mb-4">
          {paper.categories.map(cat => <span key={cat} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{cat}</span>)}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Abstract</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{paper.abstract}</p>

          <h3 className="font-semibold dark:text-white">Keywords:</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{paper.keywords.join(', ')}</p>

          <h3 className="font-semibold dark:text-white">Publication Date:</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{new Date(paper.publicationDate).toLocaleDateString()}</p>

          {/* Supporting Artifacts Section */}
          {paper.artifacts && paper.artifacts.length > 0 && (
            <div className="mt-6 pt-4 border-t dark:border-gray-700">
              <h3 className="font-semibold dark:text-white mb-3">Supporting Artifacts:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paper.artifacts.map(artifact => (
                  <div key={artifact._id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-medium dark:text-gray-200 capitalize">
                      {artifact.type === 'other' ? artifact.name : artifact.type.replace('_', ' ')}
                    </span>
                    {artifact.sourceType === 'link' ? (
                      <a 
                        href={artifact.url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Open Link
                      </a>
                    ) : (
                      <button 
                        onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/papers/${paper._id}/artifacts/${artifact._id}/download`, '_blank')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
                      >
                        Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button 
              onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/papers/${paper._id}/download`, '_blank')}
              className="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Download Paper
            </button>

            {paper.dataset && paper.dataset.path && (
              <button 
                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/papers/${paper._id}/download-dataset`, '_blank')}
                className="px-4 py-2 font-bold text-white bg-teal-600 rounded-md hover:bg-teal-700"
              >
                Download Dataset
              </button>
            )}

            {paper.sourceCode && paper.sourceCode.url && (
              <a href={paper.sourceCode.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
                Source Code
              </a>
            )}

            {paper.sourceCode && paper.sourceCode.file && (
              <button 
                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/papers/${paper._id}/download-source-code`, '_blank')}
                className="px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Download Source Code
              </button>
            )}

            {paper.diagrams && paper.diagrams.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Diagrams:</h3>
                <ul className="list-disc list-inside">
                  {paper.diagrams.map((diagram, index) => (
                    <li key={index}>
                      <a href={`${import.meta.env.VITE_API_BASE_URL}/papers/${paper._id}/download-diagram/${diagram.filename}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {diagram.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {user && (user.role === 'mahasiswa' || user.role === 'dosen') && (
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">
                Add to Reading List
              </button>
            )}

            {(isOwner || isAdmin) && (
              <>
                <Link to={`/papers/${id}/edit`} className="px-4 py-2 font-bold text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                  Edit
                </Link>
                <button 
                  onClick={handleDelete}
                  disabled={deletePaperMutation.isPending}
                  className="px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300"
                >
                  {deletePaperMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <AddToReadingListModal paperId={id} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default PaperDetail;