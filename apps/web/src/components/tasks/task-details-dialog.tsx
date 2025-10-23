import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Flag, Users, FileText } from "lucide-react";
import CommentSection from "./comment-section";
import TaskHistorySection from "./task-history-section";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { translatePriority, translateStatus } from "@/utils/taskUtils";
import { useUsers } from "@/hooks/useUsers";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

const priorityConfig: Record<
  TaskPriority,
  { bg: string; text: string; border: string }
> = {
  LOW: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  MEDIUM: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  HIGH: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  URGENT: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
};

const statusConfig: Record<
  TaskStatus,
  { bg: string; text: string; border: string }
> = {
  TODO: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
  IN_PROGRESS: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  REVIEW: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  DONE: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
};

export default function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
}: TaskDetailsDialogProps) {
  const { users } = useUsers();

  if (!task) return null;

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getUserName = (userId: string) => {
    const user = getUserById(userId);
    return user?.name || user?.email || 'Usuário Desconhecido';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-5 pb-5">
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

            {task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-500 w-28">
                  Prazo:
                </span>
                <span className="text-sm">
                  {format(new Date(task.dueDate), "dd/MM/yyyy")}
                </span>
              </div>
            )}

            {task.assigneeIds && task.assigneeIds.length > 0 && (
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
      </DialogContent>
    </Dialog>
  );
}