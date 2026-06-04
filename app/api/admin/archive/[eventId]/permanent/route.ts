// app/api/admin/archive/[eventId]/permanent/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  context: { params: any } // 🌟 Usamos context completo para máxima compatibilidad
) {
  try {
    // 1. Candado de seguridad: Validar que sea un SUPER_ADMIN
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    // 🌟 SOLUCIÓN AL UNDEFINED: Forzamos la resolución de los params de Next.js
    // Soportamos tanto lectura directa como promesas (Next.js 14/15)
    const params = await context.params;
    const eventId = params?.eventId;

    // Control de pánico: Si por algún motivo sigue vacío, detenemos la query antes de que Prisma falle
    if (!eventId || eventId === "undefined") {
      return NextResponse.json({ error: "El ID del evento es requerido y no fue detectado en la URL." }, { status: 400 });
    }

    console.log(`🗑️ Iniciando borrado permanente en cascada para el evento ID: ${eventId}`);

    // 2. Transacción relacional segura
    await prisma.$transaction([
      // Paso A: Borrar los asistentes vinculados a este ID de evento confirmado
      prisma.attendee.deleteMany({
        where: { eventId: eventId }
      }),

      // Paso B: Borrar el evento principal
      prisma.event.delete({
        where: { id: eventId }
      })
    ]);

    return NextResponse.json({ success: true, message: "Evento y sus datos eliminados con éxito." });

  } catch (error: any) {
    console.error("🚨 Error real en el backend de borrado permanente:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor al procesar el borrado permanente." },
      { status: 500 }
    );
  }
}