
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch all users
const fetchUsers = async () => {
  const { data } = await api.get('/users');
  return data.data; // Assuming API response is { success, data: [...] }
};

export const useUsers = () => {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers });
};

// Mutation to delete a user
const deleteUser = (userId) => {
  return api.delete(`/users/${userId}`);
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onMutate: async (userId) => {
      await queryClient.cancelQueries(['users']);
      const previousUsers = queryClient.getQueryData(['users']);
      queryClient.setQueryData(['users'], (old) => old?.filter((user) => user._id !== userId));
      return { previousUsers };
    },
    onError: (err, userId, context) => {
      queryClient.setQueryData(['users'], context.previousUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};
