import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, auth, invalidateUserSessions } from "@/auth";

export async function POST() {
  const session = await auth();
  if (session?.user?.id) {
    await invalidateUserSessions(session.user.id);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
