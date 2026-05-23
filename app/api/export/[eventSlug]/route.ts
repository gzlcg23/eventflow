// app/api/export/[eventSlug]/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      attendees: true,
      user: true
    }
  });

  if (!event || event.user?.clerkId !== clerkUser.id) {
    return NextResponse.json({ error: "Evento no encontrado o sin acceso" }, { status: 403 });
  }

  // Devolvemos los datos en JSON (el Excel se genera en el frontend)
  return NextResponse.json({
    success: true,
    event: {
      name: event.name,
      attendees: event.attendees
    }
  });
}