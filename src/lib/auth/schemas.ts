import { z } from "zod";

// bcrypt only uses first 72 bytes; keep password <= 72 chars.
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const SignupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
