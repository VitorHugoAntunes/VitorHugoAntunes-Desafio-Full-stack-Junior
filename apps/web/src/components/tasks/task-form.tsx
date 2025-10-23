import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type FormData, taskSchema } from "@/schemas/task-schema";
import { getAvatarColor } from "@/utils/avatarColor";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (taskData: Omit<Task, "id">) => void;
}

export default function TaskForm({ open, onOpenChange, task, onSave }: TaskFormProps) {
  const { users, isLoading: loadingUsers } = useUsers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM" as TaskPriority,
      status: "TODO" as TaskStatus,
      assigneeIds: [],
    },
  });

  const assigneeIds = watch("assigneeIds");

  useEffect(() => {
    if (open) {
      if (task) {
        reset({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          priority: task.priority,
          status: task.status,
          assigneeIds: task.assigneeIds || [],
        });
      } else {
        reset({
          title: "",
          description: "",
          dueDate: "",
          priority: "MEDIUM",
          status: "TODO",
          assigneeIds: [],
        });
      }
    }
  }, [open, task, reset]);

  const onSubmit = (data: FormData) => {
    const dataToSave: Omit<Task, "id"> = {
      ...data,
      dueDate: data.dueDate?.trim() ? new Date(data.dueDate).toISOString() : "",
      assigneeIds: data.assigneeIds || [],
    };

    onSave(dataToSave);
  };

  const toggleUserAssignment = (userId: string): void => {
    setValue(
      "assigneeIds",
      assigneeIds.includes(userId)
        ? assigneeIds.filter((id) => id !== userId)
        : [...assigneeIds, userId],
      { shouldValidate: true }
    );
  };

  const handlePriorityChange = (value: string): void => {
    setValue("priority", value as TaskPriority, { shouldValidate: true });
  };

  const handleStatusChange = (value: string): void => {
    setValue("status", value as TaskStatus, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {task ? "Editar Tarefa" : "Criar Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Insira o título da tarefa"
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Insira a descrição da tarefa"
              className="h-24"
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Prazo</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} disabled={isSubmitting} className="mb-2" />
              {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={watch("priority")} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={watch("status")} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">A Fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="REVIEW">Revisão</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Atribuir Usuários</Label>
            {loadingUsers ? (
              <div className="border rounded-lg p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Carregando usuários...</span>
              </div>
            ) : (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum usuário disponível
                  </p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleUserAssignment(user.id)}
                      className="flex items-center justify-between rounded hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getAvatarColor(user.id)} text-white font-semibold`}>
                          <span className="text-sm font-medium">
                            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-none">{user.email}</p>
                        </div>
                      </div>
                      {assigneeIds.includes(user.id) && (
                        <Badge className="bg-blue-100 text-blue-800">Atribuído</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            {errors.assigneeIds && (
              <p className="text-xs text-red-600">{errors.assigneeIds.message}</p>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {task ? "Atualizar Tarefa" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
