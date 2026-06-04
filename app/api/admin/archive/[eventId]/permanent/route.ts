// app/api/admin/archive/[eventId]/permanent/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
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

    const { eventId } = params;

    // 2. 🌟 BORRADO EN CASCADA COMPLETO
    // Ejecutamos deleteMany en orden en todas las tablas que puedan estar amarradas a tu eventId
    await prisma.$transaction([
      
      // A) Borrar asistentes (La principal dependencia)
      prisma.attendee.deleteMany({
        where: { eventId: eventId }
      }),

      // B) 🔍 DESCOMENTA las líneas de abajo si existen en tu archivo 'schema.prisma'
      // (Si no existen o se llaman diferente, déjalas comentadas o bórralas)
      
      /*
      prisma.formField?.deleteMany({ where: { eventId: eventId } }),
      prisma.ticket?.deleteMany({ where: { eventId: eventId } }),
      prisma.invitation?.deleteMany({ where: { eventId: eventId } }),
      prisma.payment?.deleteMany({ where: { eventId: eventId } }),
      */

      // C) AL FINAL: Una vez limpias las tablas hijas, destruimos el evento principal
      prisma.event.delete({
        where: { id: eventId }
      })
    ]);

    return NextResponse.json({ success: true, message: "Evento eliminado por completo en cascada." });

  } catch (error: any) {
    console.error("🚨 Error en el backend de borrado permanente:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor al procesar el borrado." },
      { status: 500 }
    );
  }
}