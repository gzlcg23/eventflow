// app/api/registro/checkin/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    // 1. Validar que el usuario que escanea esté logueado en la plataforma (Staff / Organizador)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión para escanear." }, { status: 401 });
    }

    // Traer el usuario desde nuestra base de datos para los logs
    const staffUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    // 2. Extraer los datos de la petición
    const body = await request.json();
    const { qrCode, eventId } = body;

    if (!qrCode || !eventId) {
      return NextResponse.json({ error: "Código QR y ID de evento son requeridos." }, { status: 400 });
    }

    // 3. Buscar al asistente y verificar que pertenezca a ESTE evento específico
    const attendee = await prisma.attendee.findUnique({
      where: { qrCode },
      include: { event: true }
    });

    if (!attendee || attendee.eventId !== eventId) {
      return NextResponse.json({ 
        error: "Acceso denegado. Este código QR no corresponde a ningún asistente registrado para este evento." 
      }, { status: 404 });
    }

    // 4. 🛡️ VALIDADOR ANTI-FRAUDE: Verificar si ya ingresó antes
    if (attendee.status === "CHECKED_IN") {
      // Escribimos un log de advertencia en la auditoría por posible duplicación de QR
      await createAuditLog({
        action: "CHECKIN_REJECTED",
        entity: "ATTENDEE",
        entityId: attendee.id,
        userId: staffUser?.id,
        userEmail: staffUser?.email || clerkUser.emailAddresses[0].emailAddress,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `⚠️ INTENTO DE DUPLICACIÓN: Se escaneó un QR que ya estaba adentro. Asistente: ${attendee.name}.`
      });

      return NextResponse.json({ 
        error: `Acceso Denegado. Este pase ya fue utilizado el ${attendee.checkedInAt?.toLocaleTimeString('es-MX')} por ${attendee.name}.` 
      }, { status: 409 }); // HTTP 409: Conflicto
    }

    // 5. Marcar la entrada con éxito en la Base de Datos
    const updatedAttendee = await prisma.attendee.update({
      where: { id: attendee.id },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date()
      }
    });

    // 6. 🌟 LOG DE AUDITORÍA: Guardamos quién dejó pasar a quién
    await createAuditLog({
      action: "CHECKIN_SUCCESS",
      entity: "ATTENDEE",
      entityId: attendee.id,
      userId: staffUser?.id,
      userEmail: staffUser?.email || clerkUser.emailAddresses[0].emailAddress,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Check-in exitoso para "${attendee.name}" en el evento "${attendee.event.name}".`
    });

    return NextResponse.json({
      success: true,
      message: "¡Acceso concedido con éxito!",
      attendee: {
        name: updatedAttendee.name,
        email: updatedAttendee.email,
        company: updatedAttendee.company,
        checkedInAt: updatedAttendee.checkedInAt
      }
    });

  } catch (error: any) {
    console.error("❌ Error crítico en API de Check-In:", error);
    return NextResponse.json({ 
      error: "Ocurrió un error interno en el servidor al procesar el check-in." 
    }, { status: 500 });
  }
}