import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TaskTable from '../components/tasks/task-table';
import TaskForm from '../components/tasks/task-form';
import TaskDetailsDialog from '../components/tasks/task-details-dialog';
import TaskFilters from '../components/tasks/task-filters';
import ActionModal from '../components/tasks/action-modal';
import { useTasks } from '@/hooks/useTasks';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useToastHandler } from '@/hooks/useToastHandler';
import type { Task, TaskFilters as TaskFiltersType } from '../types/task';
import { StatsCardsSkeleton } from '@/components/skeletons/stats-cards-skeleton';

const ITEMS_PER_PAGE = 20;

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: '',
    status: 'all',
    priority: 'all',
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { showSuccess, showError } = useToastHandler();

  const { tasks, total, isLoading, createTask, updateTask, deleteTask } = useTasks(
    currentPage,
    ITEMS_PER_PAGE,
    {
      search: filters.search || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      priority: filters.priority !== 'all' ? filters.priority : undefined,
    }
  );

  const { stats: globalStats, isLoading: isLoadingStats } = useTaskStats();

  const handleSave = async (taskData: Omit<Task, 'id'>) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          taskId: editingTask.id,
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
      } else {
        await createTask.mutateAsync({
          title: taskData.title,
          description: taskData.description,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
          status: taskData.status,
          assigneeIds: taskData.assigneeIds ?? [],
        });
        showSuccess('Tarefa criada com sucesso!');
      }
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      showError(error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask.mutateAsync(taskToDelete.id);
      showSuccess('Tarefa deletada com sucesso!');
      setDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      showError(error);
    }
  };

  const handleFilterChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Minhas Tarefas
            </h2>
            <p className="text-gray-600 mt-2">
              Organize, acompanhe e colabore em suas tarefas
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        <div className="flex flex-col-reverse md:flex-col gap-6">
          <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

          {isLoadingStats ? (
            <StatsCardsSkeleton />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
                <p className="text-sm text-gray-500 font-medium">A Fazer</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{globalStats.todo}</p>
                <p className="text-xs text-gray-400 mt-1">Total geral</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
                <p className="text-sm text-gray-500 font-medium">Em Progresso</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{globalStats.inProgress}</p>
                <p className="text-xs text-gray-400 mt-1">Total geral</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-400">
                <p className="text-sm text-gray-500 font-medium">Revisão</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{globalStats.review}</p>
                <p className="text-xs text-gray-400 mt-1">Total geral</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-400">
                <p className="text-sm text-gray-500 font-medium">Concluído</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{globalStats.done}</p>
                <p className="text-xs text-gray-400 mt-1">Total geral</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskTable
        tasks={tasks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        totalItems={total}
        onPageChange={setCurrentPage}
      />

      <TaskForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleSave}
      />

      <TaskDetailsDialog
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        task={viewingTask}
      />

      <ActionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        type="danger"
        title="Deletar Tarefa"
        description={`Você tem certeza que deseja deletar "${taskToDelete?.title}"? Esta ação não pode ser desfeita.`}
        actionLabel="Deletar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        isLoading={deleteTask.isPending}
      />
    </div>
  );
}