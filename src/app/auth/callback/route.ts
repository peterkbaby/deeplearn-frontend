import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE, REFRESH_COOKIE, secureCookies } from "@/lib/session";

const tokenSchema = z
  .string()
  .min(20)
  .max(4096)
  .regex(/^[A-Za-z0-9._-]+$/);

export async function GET(request: NextRequest) {
  const access = request.nextUrl.searchParams.get("access_token");
  const upstreamName = process.env.AUTH_REFRESH_COOKIE_NAME || "refresh_token";
  const refresh = request.cookies.get(upstreamName)?.value;
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const publicOrigin = forwardedHost
    ? `${forwardedProto.split(",")[0].trim()}://${forwardedHost}`
    : process.env.APP_ORIGIN || "https://localhost";
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
  const completeUrl = new URL("/auth/complete", publicOrigin);
  completeUrl.searchParams.set("access_token", access);
  const response = NextResponse.redirect(completeUrl);
  response.cookies.set(ACCESS_COOKIE, access, {
    ...options,
    maxAge: 7 * 86400,
  });
  response.cookies.set(REFRESH_COOKIE, refresh, {
    ...options,
    maxAge: 7 * 86400,
  });
  return response;
}
