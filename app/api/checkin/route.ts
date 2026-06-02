// app/api/checkin/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // 🌟 Cambiamos a auth() que es más rápido y seguro en APIs
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Obtener solo el id de la sesión de Clerk de forma segura
    const { userId } = await auth();
    if (!userId) {
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

    // 2. Verificación de propietario comparando directamente contra el userId de la sesión
    if (attendee.event.user?.clerkId !== userId) {
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