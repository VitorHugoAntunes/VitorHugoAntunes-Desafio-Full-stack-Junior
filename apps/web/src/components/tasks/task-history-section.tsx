import { format } from "date-fns";
import { History, ArrowRight } from "lucide-react";
import { useTaskHistory } from "@/hooks/useTaskHistory";
import { useUsers } from "@/hooks/useUsers";
import { TaskHistorySkeleton } from "../skeletons/task-history-skeleton";

interface TaskHistorySectionProps {
  taskId: string;
}

export default function TaskHistorySection({ taskId }: TaskHistorySectionProps) {
  const { history, isLoading, isError } = useTaskHistory(taskId);
  const { users } = useUsers();

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || 'Usuário Desconhecido';
  };

  const formatChange = (key: string, change: any): { description: string; oldValue?: string; newValue?: string } => {
    const translations: Record<string, string> = {
      title: "Título",
      description: "Descrição",
      status: "Status",
      priority: "Prioridade",
      dueDate: "Data de Vencimento",
      assigneeIds: "Usuários Atribuídos",
    };

    const statusTranslations: Record<string, string> = {
      TODO: "A Fazer",
      IN_PROGRESS: "Em Progresso",
      REVIEW: "Revisão",
      DONE: "Concluído",
    };

    const priorityTranslations: Record<string, string> = {
      LOW: "Baixa",
      MEDIUM: "Média",
      HIGH: "Alta",
      URGENT: "Urgente",
    };

    const fieldName = translations[key] || key;

    if (typeof change === 'object' && change.from !== undefined && change.to !== undefined) {
      let oldValue = change.from;
      let newValue = change.to;

      if (key === 'status') {
        oldValue = statusTranslations[oldValue] || oldValue;
        newValue = statusTranslations[newValue] || newValue;
      }

      if (key === 'priority') {
        oldValue = priorityTranslations[oldValue] || oldValue;
        newValue = priorityTranslations[newValue] || newValue;
      }

      if (key === 'dueDate') {
        oldValue = oldValue ? format(new Date(oldValue), "dd/MM/yyyy") : "Sem data";
        newValue = newValue ? format(new Date(newValue), "dd/MM/yyyy") : "Sem data";
      }

      if (key === 'assigneeIds') {
        const formatUserList = (ids: string[]): string => {
          if (!Array.isArray(ids) || ids.length === 0) return "Ninguém";
          
          const names = ids.map(id => getUserName(id));
          
          if (names.length === 1) {
            return names[0];
          } else if (names.length === 2) {
            return names.join(' e ');
          } else if (names.length <= 3) {
            return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1];
          } else {
            return names.slice(0, 2).join(', ') + ` e mais ${names.length - 2}`;
          }
        };
        
        oldValue = formatUserList(Array.isArray(oldValue) ? oldValue : []);
        newValue = formatUserList(Array.isArray(newValue) ? newValue : []);
      }

      return {
        description: fieldName,
        oldValue: String(oldValue),
        newValue: String(newValue),
      };
    }

    return { description: fieldName };
  };

  if (isLoading) {
   return <TaskHistorySkeleton />;
 }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        <History className="h-12 w-12 mx-auto mb-2 text-red-300" />
        <p>Erro ao carregar histórico.</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Nenhuma alteração registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {history.map((entry) => {
        const changes = Object.entries(entry.changes).map(([key, value]) =>
          formatChange(key, value)
        );

        return (
          <div key={entry.id} className="border-l-2 border-blue-500 px-4 py-3 bg-gray-50 rounded-r">
            <div className="space-y-2">
              {changes.map((change, idx) => (
                <div key={idx}>
                  <p className="text-sm font-semibold text-gray-900">
                    {change.description}
                  </p>
                  {change.oldValue && change.newValue && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded text-xs font-medium border border-red-200">
                        {change.oldValue}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded text-xs font-medium border border-green-200">
                        {change.newValue}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}