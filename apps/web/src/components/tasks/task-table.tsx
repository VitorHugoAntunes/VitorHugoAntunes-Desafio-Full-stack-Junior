import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Edit, Trash2, Info, Clock } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@/types/task';
import { translatePriority, translateStatus } from '@/utils/taskUtils';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { TaskTableSkeleton } from '../skeletons/task-table-skeleton';
import { formatDate } from '@/utils/formatDate';
import { getAvatarColor } from '@/utils/avatarColor';

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isLoading: boolean;
  itemsPerPage?: number;
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const priorityConfig: Record<
  TaskPriority,
  { bg: string; text: string; border: string }
> = {
  LOW: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  MEDIUM: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  HIGH: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  URGENT: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const statusConfig: Record<
  TaskStatus,
  { bg: string; text: string; border: string }
> = {
  TODO: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  IN_PROGRESS: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  REVIEW: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  DONE: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
};

export default function TaskTable({
  tasks,
  onEdit,
  onDelete,
  isLoading,
  itemsPerPage = 20,
  currentPage,
  totalItems,
  onPageChange,
}: TaskTableProps) {
  const { users } = useUsers();
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalPages = useMemo(
    () => Math.ceil(totalItems / itemsPerPage),
    [totalItems, itemsPerPage]
  );

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleViewTask = (taskId: string) => {
    navigate({to: `/tasks/${taskId}`});
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => onPageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (isLoading) {
   return <TaskTableSkeleton rows={itemsPerPage} />;
 }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Nenhuma tarefa ainda
          </h3>
          <p className="text-gray-500">Crie sua primeira tarefa para começar</p>
        </div>
      </div>
    );
  }

  const getUserInitial = (userId: string) => {
    const user = getUserById(userId);
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getUserName = (userId: string) => {
    const user = getUserById(userId);
    return user?.name || user?.email || 'Usuário Desconhecido';
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold px-4 py-4">Tarefa</TableHead>
              <TableHead className="font-semibold px-4 py-4">
                Prioridade
              </TableHead>
              <TableHead className="font-semibold px-4 py-4">Status</TableHead>
              <TableHead className="font-semibold px-4 py-4">Prazo</TableHead>
              <TableHead className="font-semibold px-4 py-4">
                Atribuído A
              </TableHead>
              <TableHead className="font-semibold text-right px-4 py-4">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className="border-b transition-colors hover:bg-gray-50"
              >
               <TableCell className="font-medium px-4 py-4 overflow-hidden">
                  <div
                    className="font-semibold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={task.title}
                  >
                    {task.title}
                  </div>

                  {task.description && (
                    <div
                      className="mt-1 text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-md"
                      title={task.description}
                    >
                      {task.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge
                    className={`${priorityConfig[task.priority].bg} ${
                      priorityConfig[task.priority].text
                    } border ${priorityConfig[task.priority].border}`}
                  >
                    {translatePriority(task.priority)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge
                    className={`${statusConfig[task.status].bg} ${
                      statusConfig[task.status].text
                    } border ${statusConfig[task.status].border}`}
                  >
                    {translateStatus(task.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4">
                  {task.dueDate ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Sem prazo</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  {task.assigneeIds && task.assigneeIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {task.assigneeIds.slice(0, 3).map((userId) => (
                        <div
                          key={userId}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium ${getAvatarColor(
                            userId
                          )}`}
                          title={getUserName(userId)}
                        >
                          {getUserInitial(userId)}
                        </div>
                      ))}
                      {task.assigneeIds.length > 3 && (
                        <span className="text-xs text-gray-500">
                          e {task.assigneeIds.length - 3} mais
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewTask(task.id)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    {user && (user.id === task.authorId) && (
                     <>
                       <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(task)}
                      className="hover:bg-yellow-50 hover:text-yellow-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(task)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                     </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 md:flex-row items-center justify-between border-t bg-white px-4 py-4">
        <div className="text-sm text-gray-500">
          Exibindo {(currentPage - 1) * itemsPerPage + 1} a{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}{' '}
          tarefas
        </div>
        <Pagination className="w-fit mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

            {renderPaginationItems()}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}