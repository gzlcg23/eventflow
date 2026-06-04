// app/api/events/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache"; 
import { createAuditLog } from "@/lib/audit"; 

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

    // 1. Validar propiedad del evento e incluir al usuario
    const event = await prisma.event.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Validar pertenencia
    if (event.user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: "No tienes permiso para editar este evento" }, { status: 403 });
    }

    // 2. Extraer datos de FormData
    const formData = await request.formData();
    const rawEntries = Object.fromEntries(formData.entries());

    const name = rawEntries.name as string;
    const description = rawEntries.description as string;
    const date = rawEntries.date as string;
    const location = rawEntries.location as string;
    const locationUrl = rawEntries.locationUrl as string;
    const accessCode = rawEntries.accessCode as string;
    const capacityRaw = rawEntries.capacity as string;

    const isPublic = rawEntries.isPublic === "true" || rawEntries.isPublic === true;

    if (!name || !date) {
      return NextResponse.json({ error: "Nombre y fecha son obligatorios" }, { status: 400 });
    }

    const capacity = capacityRaw && capacityRaw.trim() !== "" ? parseInt(capacityRaw, 10) : null;
    const finalAccessCode = !isPublic && accessCode ? accessCode.trim().toUpperCase() : null;

    // 3. Actualizar en Base de Datos
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        location: location?.trim() || null,
        locationUrl: locationUrl?.trim() || null,
        isPublic: isPublic, 
        accessCode: finalAccessCode,
        capacity: capacity !== null && !isNaN(capacity) ? capacity : null,
      },
    });

    // 4. Escribir el Log de Auditoría
    await createAuditLog({
      action: "EVENT_UPDATE",
      entity: "EVENT",
      entityId: id,
      userId: event.user.id,
      userEmail: event.user.email,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Editó el evento "${updatedEvent.name}". Estado actual -> Público: ${updatedEvent.isPublic}, Capacidad: ${updatedEvent.capacity || "Ilimitada"}`
    });

    revalidatePath("/eventos");
    revalidatePath(`/eventos/editar/${id}`);

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
      // A. Borrar todos los asistentes vinculados al evento primero para remover la restricción de FK
      await tx.attendee.deleteMany({
        where: { eventId: id }
      });

      // B. Ahora sí, eliminamos el evento de forma segura
      await tx.event.delete({
        where: { id }
      });
    });

    // 5. Revalidar rutas
    revalidatePath("/eventos");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error crítico en método DELETE de eventos:", error);
    
    return NextResponse.json({ 
      error: "No se pudo eliminar el evento debido a un fallo en el procesamiento de los datos internos." 
    }, { status: 500 });
  }
}