
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch all papers (paginated and searchable)
const fetchPapers = async ({ queryKey }) => {
  const [_key, { page, limit, searchTerm }] = queryKey;
  const { data } = await api.get('/papers', {
    params: { page, limit, q: searchTerm },
  });
  return data.data; // Assuming API response is { success, data: { papers, total, ... } }
};

export const usePapers = (page = 1, limit = 10, searchTerm = '') => {
  return useQuery({ 
    queryKey: ['papers', { page, limit, searchTerm }], 
    queryFn: fetchPapers, 
    keepPreviousData: true 
  });
};

// Fetch a single paper by ID
const fetchPaper = async ({ queryKey }) => {
  const [_key, paperId] = queryKey;
  if (!paperId) return null;
  const { data } = await api.get(`/papers/${paperId}`);
  return data.data; // Assuming API response is { success, data: { ...paper details... } }
};

export const usePaper = (paperId) => {
  return useQuery({ queryKey: ['paper', paperId], queryFn: fetchPaper });
};

// Mutation to delete a paper
const deletePaper = (paperId) => {
    return api.delete(`/papers/${paperId}`);
}

export const useDeletePaper = () => {
    const queryClient = useQueryClient();
    return useMutation({ 
        mutationFn: deletePaper,
        onSuccess: () => {
            queryClient.invalidateQueries(['papers']);
        }
    });
}

// Mutation to upload a new paper
const uploadPaper = (formData) => {
  return api.post('/papers', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const useUploadPaper = () => {
  const queryClient = useQueryClient();
  return useMutation({ 
    mutationFn: uploadPaper, 
    onSuccess: (data) => {
      // The actual paper object is nested in data.data
      const newPaper = data?.data;

      // Invalidate the list of papers to refetch it
      queryClient.invalidateQueries({ queryKey: ['papers'] });

      // Also, directly update the cache for the new paper to avoid a refetch on the detail page
      if (newPaper && newPaper._id) {
        queryClient.setQueryData(['paper', newPaper._id], newPaper);
      }
    }
  });
};
