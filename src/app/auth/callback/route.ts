import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { REFRESH_COOKIE, secureCookies } from "@/lib/session";

const tokenSchema = z
  .string()
  .min(20)
  .max(4096)
  .regex(/^[A-Za-z0-9._-]+$/);

export async function GET(request: NextRequest) {
  const access = request.nextUrl.searchParams.get("access_token");
  const upstreamName = process.env.AUTH_REFRESH_COOKIE_NAME || "refresh_token";
  const refresh = request.cookies.get(upstreamName)?.value;
  let publicOrigin = request.nextUrl.origin;
  const configuredOrigin = process.env.APP_ORIGIN;
  if (configuredOrigin) {
    try {
      const candidate = new URL(configuredOrigin);
      if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(candidate.hostname))
        publicOrigin = candidate.origin;
    } catch {
      // Keep the incoming origin when the deployment value is malformed.
    }
  }
  if (
    !access ||
    !tokenSchema.safeParse(access).success ||
    !refresh ||
    /[\s;,\r\n]/.test(refresh)
  ) {
    return NextResponse.redirect(new URL("/login?oauth_error=1", publicOrigin));
  }
  const options = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax" as const,
    path: "/",
  };
  const response = NextResponse.redirect(
    new URL(
      `/auth/complete?access_token=${encodeURIComponent(access)}`,
      publicOrigin,
    ),
  );
  response.cookies.set(REFRESH_COOKIE, refresh, {
    ...options,
    maxAge: 7 * 86400,
  });
  return response;
}
