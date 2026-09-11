import { z } from "zod";
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  created_at: z.string(),
  provider: z.string(),
  role: z.string(),
  onboarding: z.boolean(),
  username: z.string().nullable().optional(),
  profile_pic_url: z.string().nullable().optional(),
});
export const profilePicSchema = z.object({
  profile_pic_url: z.string().url(),
});
export type User = z.infer<typeof userSchema>;
export type FormState = {
  error?: string;
  success?: string;
  accessToken?: string;
  fields?: Record<string, string[]>;
};
export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Enter your password.").max(256),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  password: z
    .string()
    .min(6, "Use at least 6 characters.")
    .max(256)
    .regex(/[A-Z]/, "Add an uppercase letter.")
    .regex(/[a-z]/, "Add a lowercase letter.")
    .regex(/[0-9]/, "Add a number."),
});
export function safeDestination(value: unknown): string {
  return typeof value === "string" &&
    ["/play", "/account", "/onboarding"].includes(value)
    ? value
    : "/play";
}
