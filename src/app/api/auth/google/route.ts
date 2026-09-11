import { NextResponse } from "next/server";

export function GET(request: Request) {
  // OAuth is browser-facing. Do not redirect the browser to the private
  // backend address used by server-side Axios calls.
  const base = process.env.AUTH_PUBLIC_API_URL || process.env.APP_ORIGIN;
  if (!base)
    return NextResponse.redirect(new URL("/login?oauth_error=1", request.url));
  return NextResponse.redirect(`${base.replace(/\/$/, "")}/auth/google`);
}
