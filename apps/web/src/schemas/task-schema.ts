import z from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().min(1, "A descrição é obrigatória"),
  dueDate: z
    .string()
    .refine(
      (val) => !val || (val.trim() !== "" && !isNaN(new Date(val).getTime())),
      {
        message: "Data inválida",
      }
    ).min(1, "O prazo é obrigatório"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
    error: () => ({ message: "Selecione uma prioridade válida" }),
  }),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"], {
    error: () => ({ message: "Selecione um status válido" }),
  }),
  assigneeIds: z.array(z.string()),
});

export type FormData = z.infer<typeof taskSchema>;