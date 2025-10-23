import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UsersResponse {
  users: User[];
}

export const useUsers = () => {
  const { api } = useApi();

  const query = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UsersResponse> => {
      if (!api) throw new Error('API not initialized');
      const response = await api.get('/api/auth/users');
      return response.data;
    },
    enabled: !!api,
    staleTime: 1000 * 60 * 5,
  });

  return {
    users: query.data?.users || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

export const useUsersByIds = (userIds: string[]) => {
  const { api } = useApi();

  const query = useQuery({
    queryKey: ['usersByIds', userIds],
    queryFn: async (): Promise<UsersResponse> => {
      if (!api) throw new Error('API not initialized');
      if (!userIds || userIds.length === 0) return { users: [] };
      
      const response = await api.post('/api/auth/get-users-by-ids', { userIds });
      return response.data;
    },
    enabled: !!api && userIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  return {
    users: query.data?.users || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};