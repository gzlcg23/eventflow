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

    if (event.user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: "No tienes permiso para editar este evento" }, { status: 403 });
    }

    // 2. Extraer datos de FormData para validación
    const formData = await request.formData();
    const rawEntries = Object.fromEntries(formData.entries());

    const name = rawEntries.name as string;
    const description = rawEntries.description as string;
    const location = rawEntries.location as string;
    const locationUrl = rawEntries.locationUrl as string;
    
    // Extraemos las variables de tiempo y paquete para el validador del candado
    const dateInput = rawEntries.date as string;
    const endDateForm = rawEntries.endDate as string | null;
    const tierId = rawEntries.tierId as string;
    const capacity = rawEntries.capacity ? parseInt(rawEntries.capacity as string, 10) : undefined;

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "El nombre del evento es obligatorio y debe tener al menos 3 caracteres" }, { status: 400 });
    }

    // 🛡️ REGLA DE NEGOCIO: CANDADO INTELIGENTE POST-PAGO / ACTIVACIÓN
    // Si está activo o pagado, permitimos cambiar aspectos estéticos (nombre, descripción, mapa) 
    // pero bloqueamos en seco si intentan alterar fechas, tiers o capacidad contratada.
    if (event.isActive || event.paymentStatus === "PAID") {
      const modificoFechaInicio = dateInput ? event.date.getTime() !== new Date(dateInput).getTime() : false;
      const modificoFechaFin = event.endDate?.getTime() !== (endDateForm ? new Date(endDateForm).getTime() : undefined);
      const modificoPaquete = (tierId && event.tierId !== tierId) || (capacity !== undefined && event.capacity !== capacity);

      if (modificoFechaInicio || modificoFechaFin || modificoPaquete) {
        return NextResponse.json({ 
          success: false, 
          error: "Este evento ya se encuentra activo o pagado. No es posible alterar las fechas contratadas, la capacidad ni el paquete comercial." 
        }, { status: 400 });
      }
    }

    // Validación cruzada preventiva de fechas
    if (dateInput && endDateForm && new Date(endDateForm) <= new Date(dateInput)) {
      return NextResponse.json({ 
        success: false, 
        error: "La fecha de finalización debe ser estrictamente posterior a la fecha de inicio." 
      }, { status: 400 });
    }

    // 3. Actualizar ÚNICAMENTE campos permitidos en Base de Datos
    // Ignoramos fechas, capacidad y tiers para congelar la cotización original
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: sanitizeText(name.trim()),
        description: description ? sanitizeText(description.trim()) : null,
        location: location ? sanitizeText(location.trim()) : null,
        locationUrl: locationUrl ? sanitizeText(locationUrl.trim()) : null,
      },
    });

    // 4. Log de Auditoría
    await createAuditLog({
      action: "EVENT_UPDATE",
      entity: "EVENT",
      entityId: id,
      userId: event.user.id,
      userEmail: event.user.email,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Editó aspectos logísticos del evento "${updatedEvent.name}" (Folio: ${event.eventNumber}).`
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