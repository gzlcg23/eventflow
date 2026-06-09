// app/api/events/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache"; 
import { createAuditLog } from "@/lib/audit"; 

// Función auxiliar para desinfectar strings contra XSS
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Validar propiedad del evento e incluir al usuario dueño
    const event = await prisma.event.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Validar pertenencia del recurso
    if (event.user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: "No tienes permiso para editar este evento" }, { status: 403 });
    }

    // 2. Extraer datos de FormData (Soportando los nuevos campos modulares 🌟)
    const formData = await request.formData();
    const rawEntries = Object.fromEntries(formData.entries());

    const name = rawEntries.name as string;
    const description = rawEntries.description as string;
    const date = rawEntries.date as string;
    const endDateRaw = rawEntries.endDate as string; // 🌟 Nuevo
    const tierId = rawEntries.tierId as string;     // 🌟 Nuevo
    const location = rawEntries.location as string;
    const locationUrl = rawEntries.locationUrl as string;
    const accessCode = rawEntries.accessCode as string;
    const capacityRaw = rawEntries.capacity as string;

    const isPublic = rawEntries.isPublic === "true" || rawEntries.isPublic === true;

    if (!name || !date) {
      return NextResponse.json({ error: "Nombre y fecha de inicio son obligatorios" }, { status: 400 });
    }

    const capacity = capacityRaw && capacityRaw.trim() !== "" ? parseInt(capacityRaw, 10) : null;
    const finalAccessCode = !isPublic && accessCode ? accessCode.trim().toUpperCase() : null;
    const endDate = endDateRaw && endDateRaw.trim() !== "" ? new Date(endDateRaw) : null;

    // 3. 🛡️ CANDADO DE SEGURIDAD POST-PAGO / ACTIVACIÓN
    // Si el evento ya está activo o pagado, bloqueamos cualquier cambio que altere la cotización
    if (event.isActive || event.paymentStatus === "PAID") {
      const modificoFechaInicio = event.date.getTime() !== new Date(date).getTime();
      const modificoFechaFin = (event.endDate?.getTime() !== (endDate ? endDate.getTime() : undefined));
      const modificoPaquete = event.tierId !== tierId || event.capacity !== capacity;

      if (modificoFechaInicio || modificoFechaFin || modificoPaquete) {
        return NextResponse.json({ 
          success: false, 
          error: "Este evento ya se encuentra activo o pagado. Por políticas de términos y condiciones, no es posible alterar las fechas contratadas ni la capacidad de asistentes." 
        }, { status: 400 });
      }
    }

    // Validación cruzada de fechas si mandan un término menor al inicio
    if (endDate && endDate <= new Date(date)) {
      return NextResponse.json({ success: false, error: "La fecha de finalización debe ser estrictamente posterior a la fecha de inicio." }, { status: 400 });
    }

    // 4. Actualizar en Base de Datos (Con protección XSS y guardado de nuevos campos)
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: sanitizeText(name.trim()),
        description: description ? sanitizeText(description.trim()) : null,
        date: new Date(date),
        endDate: endDate, // 🌟 Guardado modular
        tierId: tierId || event.tierId, // 🌟 Mantiene el actual si no viene en el formulario
        location: location ? sanitizeText(location.trim()) : null,
        locationUrl: locationUrl ? sanitizeText(locationUrl.trim()) : null,
        isPublic: isPublic, 
        accessCode: finalAccessCode,
        capacity: capacity !== null && !isNaN(capacity) ? capacity : event.capacity,
      },
    });

    // 5. Escribir el Log de Auditoría
    await createAuditLog({
      action: "EVENT_UPDATE",
      entity: "EVENT",
      entityId: id,
      userId: event.user.id,
      userEmail: event.user.email,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Editó el evento "${updatedEvent.name}". Plan: ${updatedEvent.tierId}, Capacidad: ${updatedEvent.capacity || "Ilimitada"}`
    });

    revalidatePath("/eventos");
    revalidatePath(`/eventos/editar/${id}`);
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, event: updatedEvent });

  } catch (error: any) {
    console.error("❌ Error crítico en método PUT de eventos:", error);
    return NextResponse.json({ 
      error: "Ocurrió un error interno al intentar guardar los cambios del evento." 
    }, { status: 500 });
  }
}

// ==================== ELIMINAR EVENTO (BLINDADO Y CON CASCADA) ====================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Buscar el evento e incluir la relación del dueño
    const event = await prisma.event.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 2. Validar que el usuario que borra sea el dueño legítimo
    if (event.user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este evento" }, { status: 403 });
    }

    // 3. Escribir el Log de Auditoría ANTES del borrado físico
    await createAuditLog({
      action: "EVENT_DELETE",
      entity: "EVENT",
      entityId: id,
      userId: event.userId,
      userEmail: event.user.email,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Eliminó de forma permanente el evento: "${event.name}" (Número de evento: ${event.eventNumber || 'N/A'}) junto con todos sus asistentes vinculados.`
    });

    // 4. 🌟 TRANSACCIÓN EN CASCADA: Limpiamos los hijos primero y luego el padre de forma atómica
    await prisma.$transaction(async (tx) => {
      await tx.attendee.deleteMany({
        where: { eventId: id }
      });

      await tx.event.delete({
        where: { id }
      });
    });

    // 5. Revalidar rutas
    revalidatePath("/eventos");
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error crítico en método DELETE de eventos:", error);
    
    return NextResponse.json({ 
      error: "No se pudo eliminar el evento debido a un fallo en el procesamiento de los datos internos." 
    }, { status: 500 });
  }
}