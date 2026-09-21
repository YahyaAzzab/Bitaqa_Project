import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  locale: z.enum(['fr', 'ar']),
  next: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginErrorCode = 'invalid' | 'forbidden' | 'generic';

export type LoginState = {
  error: LoginErrorCode;
} | null;
