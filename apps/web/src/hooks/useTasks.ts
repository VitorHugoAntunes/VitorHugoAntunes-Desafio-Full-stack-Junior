import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { Task } from '@/types/task';

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  size: number;
}

interface CreateTaskPayload {
  title: string;
  description: string;
  dueDate?: string;
  priority: string;
  status: string;
  assigneeIds: string[];
}

interface UpdateTaskPayload {
  taskId: string;
  payload: CreateTaskPayload;
}

interface TasksFilters {
  search?: string;
  status?: string;
  priority?: string;
}

export const useTasks = (
  page: number = 1,
  size: number = 20,
  filters?: TasksFilters
) => {
  const { api } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', page, size, filters],
    queryFn: async (): Promise<TasksResponse> => {
      if (!api) throw new Error('API not initialized');
     
      const params: any = { page, size };
     
      if (filters?.search) {
        params.search = filters.search;
      }
     
      if (filters?.status && filters.status !== 'all') {
        params.status = filters.status;
      }
     
      if (filters?.priority && filters.priority !== 'all') {
        params.priority = filters.priority;
      }
     
      const response = await api.get('/api/tasks', { params });
     
      return response.data;
    },
    enabled: !!api,
    staleTime: 1000 * 30,
  });

  const createTask = useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      if (!api) throw new Error('API not initialized');
     
      const normalizedPayload = {
        ...payload,
        dueDate: payload.dueDate || "",
        assigneeIds: payload.assigneeIds || [],
      };
     
      const response = await api.post('/api/tasks', normalizedPayload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, payload }: UpdateTaskPayload) => {
      if (!api) throw new Error('API not initialized');
      const response = await api.put(`/api/tasks/${taskId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task']});
      queryClient.invalidateQueries({ queryKey: ['taskHistory']});
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!api) throw new Error('API not initialized');
      const response = await api.delete(`/api/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    tasks: query.data?.tasks || [],
    total: query.data?.total || 0,
    currentPage: query.data?.page || page,
    pageSize: query.data?.size || size,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createTask,
    updateTask,
    deleteTask,
  };
};

export const useTask = (taskId: string | undefined) => {
  const { api } = useApi();

  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async (): Promise<Task> => {
      if (!api) throw new Error('API not initialized');
      if (!taskId) throw new Error('Task ID is required');
      
      const response = await api.get(`/api/tasks/${taskId}`);
      
      return response.data;
    },
    enabled: !!api && !!taskId,
    staleTime: 1000 * 60,
  });
};