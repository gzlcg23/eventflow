// app/api/events/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// ==================== ACTUALIZAR EVENTO (BLINDADO) ====================
// app/api/events/[id]/route.ts

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

    // 1. Validar propiedad del evento (IDOR)
    const event = await prisma.event.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (!user || user.id !== event.userId) {
      return NextResponse.json({ error: "No tienes permiso para editar este evento" }, { status: 403 });
    }

    const formData = await request.formData();
    
    // Tu log de confianza
    console.log("DEBUG FRONTEND -> ¿Qué está llegando al servidor?:", Object.fromEntries(formData.entries()));

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const locationUrl = formData.get("locationUrl") as string;
    const accessCode = formData.get("accessCode") as string;
    const capacityRaw = formData.get("capacity") as string;

    // 🌟 CONTROL DE DAÑOS TOTAL: Extracción directa y ruda
    const rawValue = formData.get("isPublic");
    let isPublic = false;

    if (rawValue !== null && rawValue !== undefined) {
      // Si es un string que dice "true", o si milagrosamente viene como booleano true
      if (rawValue === true || String(rawValue).trim() === "true") {
        isPublic = true;
      }
    }

    if (!name || !date) {
      return NextResponse.json({ error: "Nombre y fecha son obligatorios" }, { status: 400 });
    }

    const capacity = capacityRaw && capacityRaw.trim() !== "" ? parseInt(capacityRaw, 10) : null;

    // 1. Forzar que la variable sea un booleano primitivo puro
    const isPublicBoolean = Boolean(isPublic);

    // 2. Determinar el código de acceso antes de meterlo a la query
    // Si es público, forzamos de forma implícita un null independiente
    const finalAccessCode = !isPublicBoolean && accessCode ? accessCode.trim().toUpperCase() : null;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        location: location?.trim() || null,
        locationUrl: locationUrl?.trim() || null,
        
        // 🌟 Forzamos el valor primitivo exacto
        isPublic: isPublicBoolean, 
        accessCode: finalAccessCode,
        
        capacity: capacity !== null && !isNaN(capacity) ? capacity : null,
      },
    });

    // Logs de confirmación absoluta post-mutación
    console.log(`👁️ REVISIÓN BDD POST-UPDATE -> ID: ${id}`);
    console.log(`IsPublic enviado: ${isPublicBoolean} | Guardado en BDD: ${updatedEvent.isPublic}`);
    console.log(`AccessCode guardado: ${updatedEvent.accessCode}`);

    revalidatePath("/eventos");
    revalidatePath(`/eventos/editar/${id}`);

    return NextResponse.json({ success: true, event: updatedEvent });

  } catch (error: any) {
    console.error("❌ Error crítico al actualizar evento:", error);
    return NextResponse.json({ error: "Error interno al actualizar el evento" }, { status: 500 });
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

    const event = await prisma.event.findUnique({
      where: { id },
      select: { userId: true, name: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (!user || user.id !== event.userId) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este evento" }, { status: 403 });
    }

    await prisma.event.delete({
      where: { id }
    });

    // 🪵 Log de auditoría básico en consola del servidor
    console.log(`🗑️ Evento ELIMINADO por el usuario [${user.email}]: ${event.name}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error crítico al eliminar evento:", error);
    return NextResponse.json({ error: "Error interno al eliminar el evento" }, { status: 500 });
  }
}