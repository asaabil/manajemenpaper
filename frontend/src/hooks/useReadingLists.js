
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch all reading lists for the current user
const fetchReadingLists = async () => {
  const { data } = await api.get('/reading-lists/me');
  return data.data; // Assuming API response is { success, data: [...] }
};

export const useReadingLists = () => {
  return useQuery({ queryKey: ['readingLists'], queryFn: fetchReadingLists });
};

// Mutation to create a new reading list
const createReadingList = (newListData) => {
  return api.post('/reading-lists', newListData);
};

export const useCreateReadingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReadingList,
    onMutate: async (newListData) => {
      await queryClient.cancelQueries(['readingLists']);
      const previousReadingLists = queryClient.getQueryData(['readingLists']);
      queryClient.setQueryData(['readingLists'], (old) => [
        ...(old || []),
        { _id: 'optimistic-id', ...newListData, papers: [] }, // Add optimistic ID
      ]);
      return { previousReadingLists };
    },
    onError: (err, newListData, context) => {
      queryClient.setQueryData(['readingLists'], context.previousReadingLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['readingLists']);
    },
  });
};

// Mutation to add a paper to a reading list
const addPaperToReadingList = ({ readingListId, paperId }) => {
  return api.post(`/reading-lists/${readingListId}/items`, { paperId });
};

export const useAddPaperToReadingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPaperToReadingList,
    onMutate: async ({ readingListId, paperId }) => {
      await queryClient.cancelQueries(['readingLists']);
      const previousReadingLists = queryClient.getQueryData(['readingLists']);
      queryClient.setQueryData(['readingLists'], (old) =>
        old?.map((list) =>
          list._id === readingListId
            ? { ...list, papers: [...list.papers, { _id: paperId, title: 'Optimistic Paper' }] } // Add optimistic paper
            : list
        )
      );
      return { previousReadingLists };
    },
    onError: (err, { readingListId, paperId }, context) => {
      queryClient.setQueryData(['readingLists'], context.previousReadingLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['readingLists']);
    },
  });
};

// Mutation to remove a paper from a reading list
const removePaperFromReadingList = ({ readingListId, paperId }) => {
  return api.delete(`/reading-lists/${readingListId}/papers/${paperId}`);
};

export const useRemovePaperFromReadingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removePaperFromReadingList,
    onMutate: async ({ readingListId, paperId }) => {
      await queryClient.cancelQueries(['readingLists']);
      const previousReadingLists = queryClient.getQueryData(['readingLists']);
      queryClient.setQueryData(['readingLists'], (old) =>
        old?.map((list) =>
          list._id === readingListId
            ? { ...list, papers: list.papers.filter((p) => p._id !== paperId) }
            : list
        )
      );
      return { previousReadingLists };
    },
    onError: (err, { readingListId, paperId }, context) => {
      queryClient.setQueryData(['readingLists'], context.previousReadingLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['readingLists']);
    },
  });
};

// Mutation to delete a reading list
const deleteReadingList = (readingListId) => {
  return api.delete(`/reading-lists/${readingListId}`);
};

export const useDeleteReadingList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReadingList,
    onSuccess: () => {
      queryClient.invalidateQueries(['readingLists']);
    },
  });
};
