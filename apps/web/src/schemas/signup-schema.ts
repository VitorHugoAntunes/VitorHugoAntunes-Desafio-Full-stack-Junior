import z from "zod";

export const signUpSchema = z
  .object({
    fullName: z.string().min(1, "O nome completo é obrigatório"),
    email: z.email("Digite um email válido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
    agreedToTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "Você deve concordar com os Termos de Serviço e Política de Privacidade",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não correspondem",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;