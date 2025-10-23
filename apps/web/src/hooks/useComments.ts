import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useUsersByIds } from './useUsers';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  taskId: string;
}

interface CommentsResponse {
  comments: Comment[];
}

export const useComments = (taskId: string) => {
  const { api } = useApi();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async (): Promise<CommentsResponse> => {
      if (!api) throw new Error('API not initialized');
      const response = await api.get(`/api/tasks/${taskId}/comments`);
      return response.data;
    },
    enabled: !!api && !!taskId,
  });

  const userIds = Array.from(
    new Set(commentsQuery.data?.comments.map(comment => comment.authorId) || [])
  );

  console.log('userIds', userIds);

  const { users, isLoading: isUsersLoading } = useUsersByIds(userIds);

  const comments = commentsQuery.data?.comments.map(comment => ({
    ...comment,
    user: users.find(user => user.id === comment.authorId) || {
      id: comment.authorId,
      name: 'Usuário Desconhecido',
      email: '',
    },
  })) || [];

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      if (!api) throw new Error('API not initialized');
      const response = await api.post(`/api/tasks/${taskId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  return {
    comments,
    isLoading: commentsQuery.isLoading || isUsersLoading,
    isError: commentsQuery.isError,
    error: commentsQuery.error,
    createComment,
  };
};