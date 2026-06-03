// app/api/events/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache"; // 🌟 CORREGIDO AQUÍ
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

    // 1. Validar propiedad del evento e incluir al usuario de nuestra BDD de un solo golpe
    const event = await prisma.event.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // Validar que el usuario logueado en Clerk sea el dueño usando la relación
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

    // Validación inmune a errores del input de privacidad que arreglamos antes
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

    // 4. 🌟 ESCRIBIR EL LOG DE AUDITORÍA CON LOS DATOS DE LA RELACIÓN SEGURA
    await createAuditLog({
      action: "EVENT_UPDATE",
      entity: "EVENT",
      entityId: id,
      userId: event.user.id,          // ID interno de tu tabla User obtenido del include
      userEmail: event.user.email,    // Email guardado en tu base de datos
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

// ==================== ELIMINAR EVENTO (BLINDADO) ====================

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

    // 1. Buscar el evento PRIMERO para validar y guardar sus datos en memoria
    const event = await prisma.event.findUnique({
      where: { id },
      include: { user: true } // Traemos la relación del usuario
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    // 2. Validar que el usuario que borra sea el dueño
    if (event.user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este evento" }, { status: 403 });
    }

    // 3. 🌟 ESCRIBIR EL LOG DE AUDITORÍA ANTES DE BORRAR 🌟
    await createAuditLog({
      action: "EVENT_DELETE",
      entity: "EVENT",
      entityId: id,
      userId: event.userId,          // ID interno del usuario dueño
      userEmail: event.user.email,   // Email del dueño
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Eliminó de forma permanente el evento: "${event.name}" (Número de evento: ${event.eventNumber || 'N/A'})`
    });

    // 4. Ahora sí, procedemos a borrar de forma segura en Neon
    await prisma.event.delete({
      where: { id }
    });

    // 5. Revalidar las rutas afectadas
    revalidatePath("/eventos");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error crítico en método DELETE de eventos:", error);
    
    return NextResponse.json({ 
      error: "No se pudo eliminar el evento de forma correcta debido a un conflicto interno." 
    }, { status: 500 });
  }
}