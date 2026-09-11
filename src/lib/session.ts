import "server-only";
import type { AxiosResponse } from "axios";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "./api";
import { userSchema, safeDestination } from "./contracts";
export const ACCESS_COOKIE = "still_access";
export const REFRESH_COOKIE = "still_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export function upstreamCookie(token: string) {
  const name = process.env.AUTH_REFRESH_COOKIE_NAME || "refresh_token";
  if (!/^[\w-]+$/.test(name) || /[\s;,\r\n]/.test(token))
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  return `${name}=${token}`;
}
export async function saveSession(response: AxiosResponse): Promise<string> {
  const { access_token } = z
    .object({ access_token: z.string().min(1) })
    .parse(response.data);
  const name = process.env.AUTH_REFRESH_COOKIE_NAME || "refresh_token";
  const setCookies = response.headers["set-cookie"] as string[] | undefined;
  const header = setCookies?.find((value) => value.startsWith(`${name}=`));
  const refresh = header?.split(";")[0].slice(name.length + 1);
  if (!refresh)
    throw new ApiError(
      502,
      "The sign-in service returned an incomplete session. Please try again.",
    );
  const jar = await cookies();
  // Server-rendered protected routes need a server-readable access token.
  // The client also stores this token in localStorage after login; the refresh
  // token remains the long-lived HttpOnly cookie.
  jar.set(ACCESS_COOKIE, access_token, { ...cookieOptions, maxAge: 7 * 86400 });
  jar.set(REFRESH_COOKIE, refresh, { ...cookieOptions, maxAge: 7 * 86400 });
  return access_token;
}
export async function clearSession() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
export const currentUser = cache(async () => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return userSchema.parse(
      (
        await api("/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).data,
    );
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status))
      return null;
    throw error;
  }
});
export async function requireUser(destination = "/play") {
  const user = await currentUser();
  if (user) return user;
  if ((await cookies()).has(REFRESH_COOKIE))
    redirect(
      `/session?next=${encodeURIComponent(safeDestination(destination))}`,
    );
  redirect(`/login?next=${encodeURIComponent(safeDestination(destination))}`);
}
export async function authorizedApi(path: string, init: RequestInit = {}) {
  await requireUser("/account");
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return api(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
}
