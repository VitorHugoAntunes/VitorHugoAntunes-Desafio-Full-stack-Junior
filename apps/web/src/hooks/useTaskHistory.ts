import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  userId: string;
  changes: Record<string, any>;
  createdAt: string;
}

interface TaskHistoryResponse {
  history: TaskHistoryEntry[];
  total: number;
}

export const useTaskHistory = (taskId: string, page = 1, size = 20) => {
  const { api } = useApi();

  const query = useQuery({
    queryKey: ['taskHistory', taskId, page, size],
    queryFn: async (): Promise<TaskHistoryResponse> => {
      if (!api) throw new Error('API not initialized');
      const response = await api.get(`/api/tasks/${taskId}/history`, {
        params: { page, size },
      });
      return response.data;
    },
    enabled: !!taskId && !!api,
    staleTime: 1000 * 60,
  });

  return {
    history: query.data?.history || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};