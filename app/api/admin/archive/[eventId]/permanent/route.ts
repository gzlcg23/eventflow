// app/api/admin/archive/[eventId]/permanent/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // 1. Candado de seguridad: Validar que el usuario sea un SUPER_ADMIN
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

    // Extraemos el eventId que viene de la URL de Next.js de forma dinámica
    const { eventId } = params;

    // 2. 🌟 TRANSACCIÓN EN CASCADA: Limpiamos dependencias para evitar errores de llave foránea
    await prisma.$transaction([
      // Paso A: Borrar todos los asistentes asociados a este evento
      prisma.attendee.deleteMany({
        where: { eventId: eventId }
      }),

      // Nota: Si en tu schema.prisma tienes otras tablas que apunten a eventId 
      // (como 'invitations' o 'payments'), agrega sus deleteMany aquí arriba.

      // Paso B: Ahora que la base de datos está libre de registros hijos, borramos el evento raíz
      prisma.event.delete({
        where: { id: eventId }
      })
    ]);

    // 3. Respuesta exitosa para que el frontend (res.ok) se ejecute e indique el éxito
    return NextResponse.json({ success: true, message: "Evento y sus registros eliminados con éxito." });

  } catch (error: any) {
    console.error("🚨 Error crítico en el backend de borrado permanente:", error);
    return NextResponse.json(
      { error: "Error interno al intentar eliminar el evento de forma permanente." },
      { status: 500 }
    );
  }
}