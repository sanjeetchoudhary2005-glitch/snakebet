import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasSeenOnboarding: true });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSeenOnboarding: true },
  });

  return NextResponse.json({ hasSeenOnboarding: user?.hasSeenOnboarding ?? true });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenOnboarding: true },
  });

  return NextResponse.json({ success: true });
}
