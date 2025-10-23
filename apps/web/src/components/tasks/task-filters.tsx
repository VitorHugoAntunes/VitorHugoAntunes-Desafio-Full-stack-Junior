import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { TaskFilters as TaskFiltersType } from "../../types/task";

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFilterChange: (filters: TaskFiltersType) => void;
}

export default function TaskFilters({
  filters,
  onFilterChange,
}: TaskFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (value: string): void => {
    onFilterChange({
      ...filters,
      status: value as TaskFiltersType["status"],
    });
  };

  const handlePriorityChange = (value: string): void => {
    onFilterChange({
      ...filters,
      priority: value as TaskFiltersType["priority"],
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar tarefas..."
              value={filters.search}
              onChange={handleSearchChange}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        <div>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger aria-label="Status" className="w-full bg-white">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="TODO">A Fazer</SelectItem>
              <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
              <SelectItem value="REVIEW">Revisão</SelectItem>
              <SelectItem value="DONE">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger aria-label="Prioridade" className="w-full bg-white">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="LOW">Baixa</SelectItem>
              <SelectItem value="MEDIUM">Média</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}