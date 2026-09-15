import { NextResponse } from "next/server";
import { api, errorMessage } from "@/lib/api";
import { loginSchema } from "@/lib/contracts";
import { saveSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check your email address and password." },
      { status: 400 },
    );

  try {
    const accessToken = await saveSession(
      await api("/login", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      }),
    );
    return NextResponse.json({ access_token: accessToken });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 401 });
  }
}
