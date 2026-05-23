// app/api/events/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json([]);
  }

  const events = await prisma.event.findMany({
    where: { 
      user: { clerkId: clerkUser.id }   // Relación correcta
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(events);
}