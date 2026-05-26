import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: Request) {
  const body = await request.json() as { password?: string };
  const { password } = body;

  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || password !== secret) {
    return Response.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
