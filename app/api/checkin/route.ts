// app/api/checkin/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    // 1. Obtener sesión de Clerk de forma rápida y segura
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Extraer datos mapeados al cliente (qrCode y eventId)
    const { qrCode, eventId } = await request.json();

    if (!qrCode || !eventId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (Código QR o Evento)" }, 
        { status: 400 }
      );
    }

    // 3. Buscar al asistente por su código único Y que pertenezca al evento actual
    const attendee = await prisma.attendee.findFirst({
      where: { 
        qrCode: qrCode.trim(),
        eventId: eventId
      },
      include: { 
        event: {
          include: { user: true }
        } 
      }
    });

    if (!attendee) {
      return NextResponse.json(
        { error: "Acceso denegado: El código QR no pertenece a este evento o es inválido." }, 
        { status: 404 }
      );
    }

    // 4. Verificación de propiedad (Dueño del evento o cuenta maestra de soporte)
    const isOwner = attendee.event.user?.clerkId === userId;
    const isMasterAdmin = userId === "user_3DgiuotoUJ1zzD3qL196YqpHtID";

    if (!isOwner && !isMasterAdmin) {
      return NextResponse.json({ error: "No tienes autorización para gestionar los accesos de este evento" }, { status: 403 });
    }

    // 5. 🛑 CONTROL ANTI-FRAUDE: Validar si el boleto ya fue escaneado antes
    if (attendee.status === "CHECKED_IN") {
      const horaUso = attendee.checkedInAt 
        ? new Date(attendee.checkedInAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        : "hace unos momentos";
        
      return NextResponse.json({ 
        error: `⚠️ ¡ALERTA DE PLAGIO! Este pase ya ingresó a las ${horaUso}. Entrada denegada.` 
      }, { status: 409 }); // Estatus 409: Conflicto de estado
    }

    // 6. Procesar el ingreso legítimo en la base de datos de Neon
    const updatedAttendee = await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      }
    });

    // 7. Registro en el Historial de Auditoría
    await createAuditLog({
      action: "ATTENDEE_CHECKIN",
      entity: "ATTENDEE",
      entityId: updatedAttendee.id,
      userId: attendee.event.userId, // ID del usuario organizador local de la DB
      userEmail: attendee.event.user?.email || "sistema@eventflow.mx",
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Check-in exitoso vía QR para el asistente "${updatedAttendee.name}" (${updatedAttendee.email}) en el evento "${attendee.event.name}".`
    });

    return NextResponse.json({
      success: true,
      attendee: updatedAttendee,
      message: `✅ Check-in realizado con éxito: ${updatedAttendee.name}`
    });

  } catch (error) {
    console.error("❌ Error crítico en el controlador de Check-In:", error);
    return NextResponse.json({ error: "Error interno del servidor al procesar el acceso" }, { status: 500 });
  }
}