// app/api/events/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// ==================== ACTUALIZAR EVENTO (BLINDADO) ====================
// app/api/events/[id]/route.ts

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

    // 2. Extraer datos de FormData de forma ultra-segura
    const formData = await request.formData();
    const rawEntries = Object.fromEntries(formData.entries());

    const name = rawEntries.name as string;
    const description = rawEntries.description as string;
    const date = rawEntries.date as string;
    const location = rawEntries.location as string;
    const locationUrl = rawEntries.locationUrl as string;
    const accessCode = rawEntries.accessCode as string;
    const capacityRaw = rawEntries.capacity as string;

    // 🌟 EXTRACCIÓN INMUNE A ERRORES PROTOCOLARES
    // Validamos el texto directamente desde el objeto plano indexado que vimos en el log
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

    // Logs de confirmación absoluta para cerrar el caso
    console.log(`👁️ REVISIÓooN FINAL BDD -> ID: ${id}`);
    console.log(`IsPublic enviado al modelo: ${isPublic} | Guardado real: ${updatedEvent.isPublic}`);

    revalidatePath("/eventos");
    revalidatePath(`/eventos/editar/${id}`);
    revalidatePath("/api/events");

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