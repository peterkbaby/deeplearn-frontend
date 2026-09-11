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
  if (
    !access ||
    !tokenSchema.safeParse(access).success ||
    !refresh ||
    /[\s;,\r\n]/.test(refresh)
  ) {
    return NextResponse.redirect(new URL("/login?oauth_error=1", request.url));
  }
  const options = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax" as const,
    path: "/",
  };
  const completeUrl = new URL(request.url);
  completeUrl.pathname = "/auth/complete";
  completeUrl.search = "";
  completeUrl.searchParams.set("access_token", access);
  const response = NextResponse.redirect(completeUrl);
  response.cookies.set(REFRESH_COOKIE, refresh, {
    ...options,
    maxAge: 7 * 86400,
  });
  return response;
}
