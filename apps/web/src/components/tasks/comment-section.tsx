import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { useToastHandler } from "@/hooks/useToastHandler";
import { CommentSectionSkeleton } from "../skeletons/comment-section-skeleton";

interface CommentSectionProps {
  taskId: string;
}

export default function CommentSection({ taskId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const { comments, isLoading, createComment } = useComments(taskId);
  const { showSuccess, showError } = useToastHandler();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync(newComment.trim());
      showSuccess('Comentário adicionado com sucesso!');
      setNewComment("");
    } catch (error) {
      showError(error);
    }
  };

  if (isLoading) {
    return <CommentSectionSkeleton />;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar um comentário..."
          className="min-h-[80px]"
          disabled={createComment.isPending}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createComment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publicar Comentário
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {comment.user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {comment.user.name || comment.user.email || "Usuário Desconhecido"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(
                        new Date(comment.createdAt || ""),
                        "dd/MM/yyyy 'às' HH:mm"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}