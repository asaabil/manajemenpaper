
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePaper } from '../hooks/usePapers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import Spinner from '../components/Spinner';

const updatePaper = ({ id, paperData }) => {
  return api.patch(`/papers/${id}`, paperData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const EditPaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: paper, isLoading, isError, error } = usePaper(id);

  const [paperDetails, setPaperDetails] = useState({
    title: '',
    abstract: '',
    authors: '',
    keywords: '',
    categories: '',
    publicationDate: '',
  });
  const [paperFile, setPaperFile] = useState(null);
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    if (paper) {
      setPaperDetails({
        title: paper.title || '',
        abstract: paper.abstract || '',
        authors: paper.authors?.join(', ') || '',
        keywords: paper.keywords?.join(', ') || '',
        categories: paper.categories?.join(', ') || '',
        publicationDate: paper.publicationDate ? new Date(paper.publicationDate).toISOString().split('T')[0] : '',
      });

      // Initialize artifacts state from paper data, adding a client-side ID
      const initialArtifacts = paper.artifacts?.map(artifact => ({
        ...artifact,
        id: artifact._id, // Use existing DB id as key
        clientManaged: false, // Flag to distinguish existing from new
        value: artifact.sourceType === 'link' ? artifact.url : null, // Populate link value
      })) || [];
      setArtifacts(initialArtifacts);
    }
  }, [paper]);

  const updatePaperMutation = useMutation({
    mutationFn: updatePaper,
    onSuccess: (data) => {
      const updatedPaper = data?.data;
      queryClient.setQueryData(['paper', id], updatedPaper); // Update the cache with the response
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      navigate('/papers');
      window.location.reload();
    },
  });

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setPaperDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleAddArtifact = () => {
    setArtifacts(prev => [...prev, {
      id: uuidv4(),
      clientManaged: true,
      type: 'dataset',
      name: '',
      sourceType: 'file',
      value: null,
    }]);
  };

  const handleRemoveArtifact = (id) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== id));
  };

  const handleArtifactChange = (id, field, value) => {
    setArtifacts(prev => prev.map(artifact => {
      if (artifact.id === id) {
        const updatedArtifact = { ...artifact, [field]: value };
        if (field === 'type' && value !== 'other') updatedArtifact.name = '';
        if (field === 'sourceType') updatedArtifact.value = null;
        return updatedArtifact;
      }
      return artifact;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    // Append main paper details
    Object.keys(paperDetails).forEach(key => {
      formData.append(key, paperDetails[key]);
    });

    if (paperFile) {
      formData.append('paperFile', paperFile);
    }

    // Append artifacts data
    artifacts.forEach((artifact, index) => {
      formData.append(`artifacts[${index}][type]`, artifact.type);
      formData.append(`artifacts[${index}][name]`, artifact.name || '');
      formData.append(`artifacts[${index}][sourceType]`, artifact.sourceType);
      if (artifact.value) {
        formData.append(`artifacts[${index}][value]`, artifact.value);
      }
    });

    updatePaperMutation.mutate({ id, paperData: formData });
  };

  if (isLoading) return <Spinner />;
  if (isError) return <div className="text-red-500">Error: {error.message}</div>;
  if (!paper) return <div>Paper not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Edit Paper</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Main Paper */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:text-gray-200 dark:border-gray-700">Paper Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">Title</label>
              <input type="text" name="title" value={paperDetails.title} onChange={handleDetailChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">Abstract</label>
              <textarea name="abstract" value={paperDetails.abstract} onChange={handleDetailChange} required rows="4" className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Authors (comma-separated)</label>
              <input type="text" name="authors" value={paperDetails.authors} onChange={handleDetailChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Publication Date</label>
              <input type="date" name="publicationDate" value={paperDetails.publicationDate} onChange={handleDetailChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:[color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Keywords (comma-separated)</label>
              <input type="text" name="keywords" value={paperDetails.keywords} onChange={handleDetailChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Categories (comma-separated)</label>
              <input type="text" name="categories" value={paperDetails.categories} onChange={handleDetailChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">Replace Paper File (PDF) - Optional</label>
              <input type="file" onChange={(e) => setPaperFile(e.target.files[0])} accept=".pdf" className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300 dark:hover:file:bg-indigo-800" />
            </div>
          </div>
        </div>

        {/* Section 2: Supporting Artifacts */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
            <h2 className="text-xl font-semibold dark:text-gray-200">Supporting Artifacts</h2>
            <button type="button" onClick={handleAddArtifact} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Add Artifact
            </button>
          </div>
          <div className="space-y-4">
            {artifacts.map((artifact) => (
              <div key={artifact.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 relative">
                <button type="button" onClick={() => handleRemoveArtifact(artifact.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">
                  &times;
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium dark:text-gray-300">Artifact Type</label>
                    <select value={artifact.type} onChange={(e) => handleArtifactChange(artifact.id, 'type', e.target.value)} className="w-full mt-1 p-2 border rounded-md text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white">
                      <option value="dataset">Dataset</option>
                      <option value="source_code">Source Code</option>
                      <option value="diagram">Diagram</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {artifact.type === 'other' && (
                    <div>
                      <label className="block text-xs font-medium dark:text-gray-300">Custom Name</label>
                      <input type="text" value={artifact.name} onChange={(e) => handleArtifactChange(artifact.id, 'name', e.target.value)} placeholder="e.g., Presentation Slides" className="w-full mt-1 p-2 border rounded-md text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                    </div>
                  )}

                  <div className={artifact.type === 'other' ? '' : 'md:col-span-2'}>
                    <label className="block text-xs font-medium dark:text-gray-300">Source</label>
                    <div className="flex items-center mt-1">
                      <input type="radio" id={`source-file-${artifact.id}`} checked={artifact.sourceType === 'file'} onChange={() => handleArtifactChange(artifact.id, 'sourceType', 'file')} className="mr-1" />
                      <label htmlFor={`source-file-${artifact.id}`} className="mr-3 text-sm dark:text-gray-300">File</label>
                      <input type="radio" id={`source-link-${artifact.id}`} checked={artifact.sourceType === 'link'} onChange={() => handleArtifactChange(artifact.id, 'sourceType', 'link')} className="mr-1" />
                      <label htmlFor={`source-link-${artifact.id}`} className="text-sm dark:text-gray-300">Link</label>
                    </div>
                    {artifact.sourceType === 'file' ? (
                      <input type="file" onChange={(e) => handleArtifactChange(artifact.id, 'value', e.target.files[0])} className="w-full mt-2 p-1 border rounded-md text-sm dark:bg-gray-600 dark:border-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 dark:file:bg-gray-500 dark:file:text-gray-200 dark:hover:file:bg-gray-400" />
                    ) : (
                      <input type="url" value={artifact.value || ''} onChange={(e) => handleArtifactChange(artifact.id, 'value', e.target.value)} placeholder="https://example.com/data" className="w-full mt-2 p-2 border rounded-md text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                    )}
                    {!artifact.clientManaged && artifact.sourceType === 'file' && artifact.file && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">File already uploaded: {artifact.file.filename}. Leave blank to keep it, or upload a new file to replace it.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updatePaperMutation.isPending} className="px-6 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300">
            {updatePaperMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditPaper;
