import { NextResponse } from "next/server";
import { api } from "@/lib/api";
import { clearSession, REFRESH_COOKIE, upstreamCookie } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST() {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  try {
    if (refresh)
      await api("/logout", {
        method: "POST",
        headers: { Cookie: upstreamCookie(refresh) },
      });
  } finally {
    await clearSession();
  }
  return NextResponse.json({ ok: true });
}
