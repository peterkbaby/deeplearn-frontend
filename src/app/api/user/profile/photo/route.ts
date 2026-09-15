import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { api, errorMessage } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/session";

async function authorization() {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  return access ? { Authorization: `Bearer ${access}` } : null;
}

export async function POST(request: Request) {
  const headers = await authorization();
  if (!headers)
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size)
    return NextResponse.json(
      { error: "Choose a photo first." },
      { status: 400 },
    );
  try {
    await api("/profile/upload-pic", { method: "POST", body: form, headers });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}

export async function DELETE() {
  const headers = await authorization();
  if (!headers)
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  try {
    await api("/profile/pic", { method: "DELETE", headers });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
