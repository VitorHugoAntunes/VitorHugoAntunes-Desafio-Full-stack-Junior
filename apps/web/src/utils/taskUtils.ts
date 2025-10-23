export const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    TODO: "A Fazer",
    IN_PROGRESS: "Em Progresso",
    REVIEW: "Revisão",
    DONE: "Concluído",
  };
  return translations[status] || status;
};

export const translatePriority = (priority: string): string => {
  const translations: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
  return translations[priority] || priority;
};