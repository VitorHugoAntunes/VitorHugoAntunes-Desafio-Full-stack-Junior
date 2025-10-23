import { useState } from "react";
import { useParams, useNavigate } from '@tanstack/react-router';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar, Flag, Users, FileText, ArrowLeft, Edit, Trash2 } from "lucide-react";
import CommentSection from "@/components/tasks/comment-section";
import TaskHistorySection from "@/components/tasks/task-history-section";
import TaskForm from "@/components/tasks/task-form";
import ActionModal from "@/components/tasks/action-modal";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { translatePriority, translateStatus } from "@/utils/taskUtils";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import { useTask, useTasks } from "@/hooks/useTasks";
import { useToastHandler } from "@/hooks/useToastHandler";
import { TaskDetailsSkeleton } from "@/components/skeletons/task-details-skeleton";

const priorityConfig: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  MEDIUM: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  URGENT: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
};

const statusConfig: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  TODO: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  REVIEW: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  DONE: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
};

export default function TaskDetailsPage() {
  const taskId = useParams({
    from: '/tasks/$taskId',
    select: (params) => params.taskId,
  });
  const navigate = useNavigate();
  const { users } = useUsers();
  const { user } = useAuth();
  const { showSuccess, showError } = useToastHandler();
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const { data: task, isLoading, error } = useTask(taskId);
  const { updateTask, deleteTask } = useTasks();

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const getUserName = (userId: string) => {
    const user = getUserById(userId);
    return user?.name || user?.email || "Usuário Desconhecido";
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSave = async (taskData: Omit<Task, 'id'>) => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        payload: {
          title: taskData.title,
          description: taskData.description,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
          status: taskData.status,
          assigneeIds: taskData.assigneeIds ?? [],
        },
      });
      showSuccess('Tarefa atualizada com sucesso!');
      setShowEditForm(false);
    } catch (error) {
      showError(error);
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!task) return;

    try {
      await deleteTask.mutateAsync(task.id);
      showSuccess('Tarefa deletada com sucesso!');
      setDeleteModalOpen(false);
      navigate({ to: '/home' });
    } catch (error) {
      showError(error);
    }
  };

  if (isLoading) {
    return <TaskDetailsSkeleton />;
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tarefa não encontrada
          </h2>
          <p className="text-gray-500 mb-4">
            A tarefa que você procura não existe ou foi removida.
          </p>
          <Button onClick={() => navigate({ to: '/home' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para home
          </Button>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.id === task.authorId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/home' })}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 space-y-6">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {task.title}
          </h1>
          {isAuthor && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleEdit}
                className="hover:bg-yellow-50 hover:text-yellow-600 flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden md:block">Editar</span>
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={handleDelete}
                className="hover:bg-red-50 hover:text-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:block">Deletar</span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 pb-5 border-b">
          <div className="flex items-center gap-3">
            <Flag className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500 w-28">
              Prioridade:
            </span>
            <Badge
              className={`${priorityConfig[task.priority].bg} ${
                priorityConfig[task.priority].text
              } border ${priorityConfig[task.priority].border}`}
            >
              {translatePriority(task.priority)}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500 w-28">
              Status:
            </span>
            <Badge
              className={`${statusConfig[task.status].bg} ${
                statusConfig[task.status].text
              } border ${statusConfig[task.status].border}`}
            >
              {translateStatus(task.status)}
            </Badge>
          </div>

          {task.dueDate ? (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500 w-28">
                Prazo:
              </span>
              <span className="text-sm">
                {format(new Date(task.dueDate), "dd/MM/yyyy")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500 w-28">
                Prazo:
              </span>
              <span className="text-sm text-gray-500">Sem prazo definido</span>
            </div>
          )}

          {task.assigneeIds && task.assigneeIds.length > 0 ? (
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-gray-400 mt-[2px]" />
              <span className="text-sm font-medium text-gray-500 w-28 shrink-0">
                Atribuído a:
              </span>
              <div className="flex flex-col gap-1">
                {task.assigneeIds.map((userId) => (
                  <span
                    key={userId}
                    className="text-sm text-gray-700 wrap-break-words"
                  >
                    {getUserName(userId)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-gray-400 mt-[2px]" />
              <span className="text-sm font-medium text-gray-500 w-28 shrink-0">
                Atribuído a:
              </span>
              <span className="text-sm text-gray-500">Nenhum usuário atribuído</span>
            </div>
          )}
        </div>

        {task.description && (
          <div className="p-4 bg-muted rounded-md">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Descrição
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="mt-4">
            <CommentSection taskId={task.id} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <TaskHistorySection taskId={task.id} />
          </TabsContent>
        </Tabs>
      </div>

      <TaskForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        task={task}
        onSave={handleSave}
      />

      <ActionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        type="danger"
        title="Deletar Tarefa"
        description={`Você tem certeza que deseja deletar "${task.title}"? Esta ação não pode ser desfeita.`}
        actionLabel="Deletar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        isLoading={deleteTask.isPending}
      />
    </div>
  );
}