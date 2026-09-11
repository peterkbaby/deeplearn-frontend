import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { api, ApiError, errorMessage } from "@/lib/api";
import {
  clearSession,
  REFRESH_COOKIE,
  saveSession,
  upstreamCookie,
} from "@/lib/session";
export async function POST(request: NextRequest) {
  // This endpoint changes cookies, so only same-origin browser requests may call it.
  const expectedOrigin = (
    process.env.APP_ORIGIN ||
    `${request.nextUrl.protocol}//${request.headers.get("host")}`
  ).replace(/\/$/, "");
  if (request.headers.get("origin") !== expectedOrigin)
    return NextResponse.json(
      { error: "Request not allowed." },
      { status: 403 },
    );
  try {
    const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!refresh) throw new ApiError(401, "Session expired.");
    const accessToken = await saveSession(
      await api("/refresh", {
        method: "POST",
        headers: { Cookie: upstreamCookie(refresh) },
      }),
    );
    return NextResponse.json(
      { ok: true, access_token: accessToken },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ApiError && [400, 401, 403].includes(error.status)) {
      await clearSession();
      return NextResponse.json({ expired: true }, { status: 401 });
    }
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: error instanceof ApiError ? error.status : 503 },
    );
  }
}
