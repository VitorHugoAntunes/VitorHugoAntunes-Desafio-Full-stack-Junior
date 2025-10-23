import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  RABBITMQ_URL: z.string().url(),
  JWT_PRIVATE_KEY: z.string().optional().default('default_private_key'),
  JWT_PUBLIC_KEY: z.string(),
  PORT: z.coerce.number().optional().default(3334),
});

export type Env = z.infer<typeof envSchema>;