"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, errorMessage } from "./api";
import {
  loginSchema,
  registerSchema,
  safeDestination,
  type FormState,
} from "./contracts";
import {
  saveSession,
  clearSession,
  REFRESH_COOKIE,
  upstreamCookie,
  authorizedApi,
  requireUser,
} from "./session";

export async function loginAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = loginSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { fields: z.flattenError(result.error).fieldErrors };
  try {
    await saveSession(
      await api("/login", {
        method: "POST",
        body: JSON.stringify(result.data),
      }),
    );
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect(safeDestination(form.get("next")));
}
export async function registerAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const result = registerSchema.safeParse(Object.fromEntries(form));
  if (!result.success)
    return { fields: z.flattenError(result.error).fieldErrors };
  try {
    await api("/register", {
      method: "POST",
      body: JSON.stringify(result.data),
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect("/login?registered=1");
}
export async function logoutAction(): Promise<FormState> {
  const token = (await cookies()).get(REFRESH_COOKIE)?.value;
  try {
    if (token)
      await api("/logout", {
        method: "POST",
        headers: { Cookie: upstreamCookie(token) },
      });
  } catch {
    return {
      error:
        "We couldn’t end your server session. Please try signing out again.",
    };
  }
  await clearSession();
  redirect("/login?loggedOut=1");
}
export async function onboardingAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser("/onboarding");
  if (user.onboarding) redirect("/play");
  const result = z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, or underscores.")
    .safeParse(form.get("username"));
  if (!result.success)
    return { fields: { username: [result.error.issues[0].message] } };
  try {
    await authorizedApi("/onboarding", {
      method: "POST",
      body: JSON.stringify({ username: result.data }),
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  redirect("/play");
}
export async function uploadAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  await requireUser("/account");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size)
    return { error: "Choose a photo first." };
  if (file.size > 2 * 1024 * 1024)
    return { error: "Choose a photo smaller than 2 MB." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return { error: "Choose a JPEG, PNG, or WebP photo." };
  const body = new FormData();
  body.set("file", file);
  try {
    await authorizedApi("/profile/upload-pic", { method: "POST", body });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/account");
  return { success: "Your photo has been updated." };
}

export async function deletePhotoAction(): Promise<FormState> {
  await requireUser("/account");
  try {
    await authorizedApi("/profile/pic", { method: "DELETE" });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/account");
  return { success: "Your profile photo has been deleted." };
}
