import { NextResponse } from "next/server";

export function GET(request: Request) {
  const base = process.env.AUTH_API_URL;
  if (!base)
    return NextResponse.redirect(new URL("/login?oauth_error=1", request.url));
  return NextResponse.redirect(`${base.replace(/\/$/, "")}/auth/google`);
}
