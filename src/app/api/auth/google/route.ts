import { NextResponse } from "next/server";

export function GET(request: Request) {
  // OAuth is browser-facing. Do not redirect the browser to the private
  // backend address used by server-side Axios calls.
  const configured = process.env.AUTH_PUBLIC_API_URL || process.env.APP_ORIGIN;
  let base = new URL(request.url).origin;
  if (configured) {
    try {
      const candidate = new URL(configured);
      if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(candidate.hostname))
        base = candidate.origin;
    } catch {
      // Keep the incoming origin when the deployment value is malformed.
    }
  }
  return NextResponse.redirect(`${base}/auth/google`);
}
