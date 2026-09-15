import { NextResponse } from "next/server";
import { api, errorMessage } from "@/lib/api";
import { registerSchema } from "@/lib/contracts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the details and password requirements." },
      { status: 400 },
    );

  try {
    await api("/register", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
