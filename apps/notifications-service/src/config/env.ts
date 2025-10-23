import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  RABBITMQ_URL: z.string().url(),
  JWT_PUBLIC_KEY: z.string(),
  PORT: z.coerce.number().optional().default(3336),
  WEBSOCKET_PORT: z.coerce.number().optional().default(3336),
});

export type Env = z.infer<typeof envSchema>;