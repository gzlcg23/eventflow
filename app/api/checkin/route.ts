// app/api/checkin/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { attendeeId } = await request.json();

    if (!attendeeId) {
      return NextResponse.json({ error: "Falta ID del asistente" }, { status: 400 });
    }

    const attendee = await prisma.attendee.findUnique({
      where: { id: attendeeId },
      include: { 
        event: {
          include: { user: true }
        } 
      }
    });

    if (!attendee) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 });
    }

    // Verificación de propietario usando clerkId
    if (attendee.event.user?.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: "No tienes permiso para este evento" }, { status: 403 });
    }

    // Realizar check-in
    const updatedAttendee = await prisma.attendee.update({
      where: { id: attendeeId },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      attendee: updatedAttendee,
      message: `✅ Check-in realizado: ${updatedAttendee.name}`
    });

  } catch (error) {
    console.error("Error en check-in:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}