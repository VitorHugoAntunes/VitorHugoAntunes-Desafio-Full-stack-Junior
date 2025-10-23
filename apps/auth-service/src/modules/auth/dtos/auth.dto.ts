import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .refine((val) => val.trim().length > 0, {
      message: 'Password cannot be empty or whitespace only',
    }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshSchema = z.object({
  refresh_token: z.string(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;