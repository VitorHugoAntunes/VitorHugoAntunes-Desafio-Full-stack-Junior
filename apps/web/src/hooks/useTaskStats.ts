import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export const useTaskStats = () => {
  const { api } = useApi();

  const query = useQuery({
    queryKey: ['taskStats'],
    queryFn: async (): Promise<TaskStats> => {
      if (!api) throw new Error('API not initialized');
      
      const response = await api.get('/api/stats/tasks');
      
      return response.data;
    },
    enabled: !!api,
    staleTime: 1000 * 60,
  });

  return {
    stats: query.data || {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};