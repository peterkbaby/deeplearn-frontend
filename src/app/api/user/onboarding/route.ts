import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { api, errorMessage } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/session";

const username = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_]+$/);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = username.safeParse(body?.username);
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access)
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  if (!parsed.success)
    return NextResponse.json(
      { error: "Use 3–24 letters, numbers, or underscores." },
      { status: 400 },
    );
  try {
    await api("/onboarding", {
      method: "POST",
      body: JSON.stringify({ username: parsed.data }),
      headers: { Authorization: `Bearer ${access}` },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
