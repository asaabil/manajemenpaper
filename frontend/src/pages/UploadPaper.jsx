import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadPaper } from '../hooks/usePapers';
import { v4 as uuidv4 } from 'uuid';
import { parse } from '@retorquere/bibtex-parser';
import { Toast } from '../components/Toast';

// Helper to create a new, empty paper structure
const createEmptyPaper = () => ({
  id: uuidv4(),
  details: {
    title: '',
    abstract: '',
    authors: '',
    keywords: '',
    categories: '',
    publicationDate: '',
  },
  paperFile: null,
  fileHint: '', // Store file path hint from .bib file
  artifacts: [],
  errors: {}, // Add errors object for inline validation
});

// Sub-component for a single paper form
const PaperForm = ({ paper, onPaperChange, onRemove }) => {
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    const newDetails = { ...paper.details, [name]: value };
    // Clear the specific error when user starts typing
    const newErrors = { ...paper.errors };
    delete newErrors[name];
    onPaperChange(paper.id, { details: newDetails, errors: newErrors });
  };

  const handlePaperFileChange = (e) => {
    onPaperChange(paper.id, { paperFile: e.target.files[0] });
  };

  const handleArtifactChange = (artifactId, field, value) => {
    const newArtifacts = paper.artifacts.map(artifact => {
      if (artifact.id === artifactId) {
        const updatedArtifact = { ...artifact, [field]: value };
        if (field === 'type' && value !== 'other') updatedArtifact.name = '';
        if (field === 'sourceType') updatedArtifact.value = null;
        return updatedArtifact;
      }
      return artifact;
    });
    onPaperChange(paper.id, { artifacts: newArtifacts });
  };

  const handleAddArtifact = () => {
    const newArtifacts = [...paper.artifacts, {
      id: uuidv4(),
      type: 'dataset',
      name: '',
      sourceType: 'file',
      value: null,
    }];
    onPaperChange(paper.id, { artifacts: newArtifacts });
  };

  const handleRemoveArtifact = (artifactId) => {
    const newArtifacts = paper.artifacts.filter(a => a.id !== artifactId);
    onPaperChange(paper.id, { artifacts: newArtifacts });
  };

  return (
    <div className="border-2 border-dashed dark:border-gray-700 rounded-lg p-6 mb-8 relative bg-white dark:bg-gray-800 shadow-sm">
      <button onClick={() => onRemove(paper.id)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg hover:bg-red-600 transition-transform duration-150 ease-in-out transform hover:scale-110 z-10">&times;</button>
      
      <div className="space-y-8">
        {/* Section 1: Main Paper */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:text-gray-200 dark:border-gray-700">Paper Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">Title</label>
              <input type="text" name="title" value={paper.details.title} onChange={handleDetailChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">Abstract</label>
              <textarea name="abstract" value={paper.details.abstract} onChange={handleDetailChange} required rows="4" className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Authors (comma-separated)</label>
              <input type="text" name="authors" value={paper.details.authors} onChange={handleDetailChange} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Publication Date</label>
              <input type="text" name="publicationDate" value={paper.details.publicationDate} onChange={handleDetailChange} placeholder="YYYY-MM-DD or YYYY" className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              {paper.errors.publicationDate && <p className="text-red-500 text-sm mt-1">{paper.errors.publicationDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Keywords (comma-separated)</label>
              <input type="text" name="keywords" value={paper.details.keywords} onChange={handleDetailChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Categories (comma-separated)</label>
              <input type="text" name="categories" value={paper.details.categories} onChange={handleDetailChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">Paper File (PDF)</label>
              {paper.fileHint && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 mb-1">
                  <span className="font-semibold">Suggested file from .bib:</span> {paper.fileHint}
                </p>
              )}
              <input type="file" onChange={handlePaperFileChange} required accept=".pdf" className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300 dark:hover:file:bg-indigo-800" />
               {paper.errors.paperFile && <p className="text-red-500 text-sm mt-1">{paper.errors.paperFile}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Supporting Artifacts */}
        <div>
          <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
            <h2 className="text-xl font-semibold dark:text-gray-200">Supporting Artifacts (Optional)</h2>
            <button type="button" onClick={handleAddArtifact} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              Add Artifact
            </button>
          </div>
          <div className="space-y-4">
            {paper.artifacts.map((artifact) => (
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadPaper = () => {
  const [papers, setPapers] = useState([createEmptyPaper()]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [bibFileName, setBibFileName] = useState('');
  const uploadMutation = useUploadPaper();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleBibFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBibFileName(file.name);
    let text = await file.text();

    // Pre-process text to remove leading junk before parsing
    const firstAt = text.indexOf('@');
    if (firstAt > -1) {
      text = text.substring(firstAt);
    }

    try {
      // Step 1: Parse the text to get the result object
      const parsedResult = parse(text);
      console.log('Parsed result:', parsedResult);

      // Step 2: Manually map the .entries array to the desired format
      const bib = (parsedResult.entries || []).map((entry) => {
        console.log('Processing entry:', entry);

        // Handle authors - the library parses author as array of Creator objects
        let authors = '';
        if (entry.fields?.author && Array.isArray(entry.fields.author)) {
          authors = entry.fields.author.map(creator => {
            // Creator object has: name, lastName, firstName, prefix, suffix
            if (creator.name) {
              return creator.name;
            } else if (creator.firstName || creator.lastName) {
              const parts = [];
              if (creator.firstName) parts.push(creator.firstName);
              if (creator.prefix) parts.push(creator.prefix);
              if (creator.lastName) parts.push(creator.lastName);
              if (creator.suffix) parts.push(creator.suffix);
              return parts.join(' ');
            }
            return '';
          }).filter(Boolean).join(', ');
        }

        // Helper function to convert field value to string
        const fieldToString = (fieldValue) => {
          if (!fieldValue) return '';
          if (typeof fieldValue === 'string') return fieldValue;
          if (Array.isArray(fieldValue)) {
            return fieldValue.map(item => {
              if (typeof item === 'string') return item;
              return '';
            }).join(', ');
          }
          return String(fieldValue);
        };

        // Handle keywords - typically array of strings
        const keywords = fieldToString(entry.fields?.keywords);

        // Handle title - typically string
        const title = fieldToString(entry.fields?.title);

        // Handle abstract - typically string
        const abstract = fieldToString(entry.fields?.abstract);

        // Handle year/date - typically string
        let publicationDate = fieldToString(entry.fields?.year);
        if (!publicationDate) {
          publicationDate = fieldToString(entry.fields?.date);
        }

        // Extract file path hint from .bib (if available)
        let fileHint = '';
        if (entry.fields?.file) {
          let fileField = fieldToString(entry.fields.file);
          console.log('Raw file field:', fileField);

          // File field format in BibTeX is often: :path:type
          // The path may contain escaped colons (\:)
          // Replace escaped colons temporarily
          fileField = fileField.replace(/\\:/g, '###COLON###');

          // Now split by unescaped colons
          if (fileField.includes(':')) {
            const parts = fileField.split(':');
            // Usually format is :path:type, so path is at index 1
            fileHint = parts[1] || parts[0] || '';
            // Restore the escaped colons
            fileHint = fileHint.replace(/###COLON###/g, ':');
          } else {
            fileHint = fileField.replace(/###COLON###/g, ':');
          }

          console.log('Extracted path:', fileHint);

          // Clean up the path - extract just the filename
          if (fileHint) {
            // Handle both forward slash and backslash
            const pathParts = fileHint.split(/[/\\]/);
            fileHint = pathParts[pathParts.length - 1]; // Get last part (filename)
            console.log('Final filename:', fileHint);
          }
        }

        const details = {
          title: title,
          abstract: abstract,
          authors: authors,
          keywords: keywords,
          categories: '',
          publicationDate: publicationDate,
        };

        console.log('Extracted details:', details);
        console.log('File hint:', fileHint);
        return { ...createEmptyPaper(), details, fileHint };
      });

      if (bib.length > 0) {
        setPapers(prevPapers => {
          const isInitialEmpty = prevPapers.length === 1 &&
                               !prevPapers[0].details.title &&
                               !prevPapers[0].details.abstract &&
                               !prevPapers[0].paperFile &&
                               prevPapers[0].artifacts.length === 0;

          if (isInitialEmpty) {
            return bib; // Replace the initial empty form
          } else {
            return [...prevPapers, ...bib]; // Append to existing forms
          }
        });
        showToast(`Successfully added ${bib.length} paper(s) from .bib file. Please review and add PDF files.`, 'success');
      } else {
        showToast('Could not find any valid entries in the .bib file.', 'error');
      }
    } catch (err) {
      console.error("Failed to parse .bib file:", err);
      const errorMessage = err.message || 'An unknown error occurred.';
      showToast(`Failed to parse .bib file: ${errorMessage}`, 'error');
    } finally {
      e.target.value = null;
    }
  };

  const handlePaperChange = (paperId, newProps) => {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, ...newProps } : p));
  };

  const handleAddPaper = () => {
    setPapers(prev => [...prev, createEmptyPaper()]);
  };

  const handleRemovePaper = (paperId) => {
    if (papers.length > 1) {
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } else {
      showToast('You must have at least one paper form.', 'warning');
    }
  };

  const handleSubmitAll = async () => {
    setIsUploading(true);

    let validationFailed = false;
    const papersWithErrors = papers.map(paper => {
      const newErrors = {};
      const date = paper.details.publicationDate;
      const validDateRegex = /^(\d{4}|\d{4}-\d{2}-\d{2})$/;

      if (date && !validDateRegex.test(date)) {
        newErrors.publicationDate = 'Format must be YYYY or YYYY-MM-DD.';
        validationFailed = true;
      }
      
      if (!paper.paperFile) {
        newErrors.paperFile = 'Paper file is required.';
        validationFailed = true;
      }

      return { ...paper, errors: newErrors };
    });

    setPapers(papersWithErrors);

    if (validationFailed) {
      setIsUploading(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const paper of papers) {
      const formData = new FormData();
      Object.keys(paper.details).forEach(key => formData.append(key, paper.details[key]));
      formData.append('paperFile', paper.paperFile);

      // Only add artifacts that have a value (file or link)
      const validArtifacts = paper.artifacts.filter(artifact => {
        if (artifact.sourceType === 'file' && artifact.value instanceof File) return true;
        if (artifact.sourceType === 'link' && artifact.value && typeof artifact.value === 'string' && artifact.value.trim() !== '') return true;
        return false;
      });

      console.log('Valid artifacts to upload:', validArtifacts);

      validArtifacts.forEach((artifact, index) => {
        formData.append(`artifacts[${index}][type]`, artifact.type);
        formData.append(`artifacts[${index}][name]`, artifact.name || '');
        formData.append(`artifacts[${index}][sourceType]`, artifact.sourceType);
        formData.append(`artifacts[${index}][value]`, artifact.value);
      });

      try {
        await uploadMutation.mutateAsync(formData);
        successCount++;
      } catch (error) {
        console.error(`Failed to upload paper: ${paper.details.title}`, error);
        const errorMessage = error.response?.data?.message || 'An unknown error occurred.';
        showToast(`Error uploading "${paper.details.title}": ${errorMessage}`, 'error');
        errorCount++;
      }
    }
    
    setIsUploading(false);
    if (successCount > 0 && errorCount === 0) {
      showToast(`${successCount} paper(s) uploaded successfully.`);
      setPapers([createEmptyPaper()]);
      setBibFileName('');
      setTimeout(() => navigate('/papers'), 1000);
    } else if (successCount > 0 && errorCount > 0) {
      showToast(`Partially completed: ${successCount} uploaded, ${errorCount} failed.`);
    } else if (errorCount > 0) {
      showToast(`All uploads failed. Please check the errors.`, 'error');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Toast isVisible={toast.show} message={toast.message} type={toast.type} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Upload Papers</h1>
        <div>
          <label htmlFor="bib-upload" className={`px-4 py-2 mr-4 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isUploading ? 'Processing...' : bibFileName || 'Upload .bib File'}
          </label>
          <input id="bib-upload" type="file" accept=".bib" onChange={handleBibFile} className="hidden" disabled={isUploading} />
          <button onClick={handleAddPaper} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700" disabled={isUploading}>
            Add Another Paper
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Use the <strong>Upload .bib File</strong> button to automatically fill in the form(s) from a BibTeX file. You can also fill out the form(s) below manually.
      </p>

      {papers.map((paper) => (
        <PaperForm 
          key={paper.id} 
          paper={paper} 
          onPaperChange={handlePaperChange} 
          onRemove={handleRemovePaper}
        />
      ))}

      <div className="flex justify-end mt-8">
        <button onClick={handleSubmitAll} disabled={isUploading || papers.length === 0} className="px-8 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800">
          {isUploading ? `Uploading...` : `Submit All (${papers.length}) Papers`}
        </button>
      </div>
    </div>
  );
};

export default UploadPaper;