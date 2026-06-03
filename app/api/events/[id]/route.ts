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
    
    // 🌟 METE ESTA LÍNEA DE LOG TEMPORAL:
    console.log("DEBUG FRONTEND -> ¿Qué está llegando al servidor?:", Object.fromEntries(formData.entries()));

    const name = formData.get("name") as string;
    // ... el resto de tu código
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const locationUrl = formData.get("locationUrl") as string;
    const accessCode = formData.get("accessCode") as string;
    const capacityRaw = formData.get("capacity") as string;

    // 🌟 NORMALIZACIÓN DEL BOOLEANO ISPUBLIC
    // Esto evalúa de forma segura si viene como string "true", booleano true, o el número 1.
    const isPublicRaw = formData.get("isPublic");
    const isPublic = isPublicRaw === "true" || isPublicRaw === "1" || isPublicRaw === true;

    if (!name || !date) {
      return NextResponse.json({ error: "Nombre y fecha son obligatorios" }, { status: 400 });
    }

    // Procesar la capacidad por si también la editan desde aquí
    const capacity = capacityRaw && capacityRaw.trim() !== "" ? parseInt(capacityRaw, 10) : null;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        location: location?.trim() || null,
        locationUrl: locationUrl?.trim() || null,
        isPublic,
        accessCode: !isPublic && accessCode ? accessCode.trim().toUpperCase() : null,
        capacity: isNaN(capacity as number) ? null : capacity,
      },
    });

    console.log(`📝 Evento editado por [${user.email}]: ${updatedEvent.name} | Público: ${updatedEvent.isPublic}`);

    // 🌟 LA SOLUCIÓN AL BUG DE LA CACHÉ:
    // Le decimos a Next.js que destruya la caché vieja de estas páginas y rutas
    revalidatePath("/eventos");
    revalidatePath("/eventos/editar/[id]", "page");
    revalidatePath("/api/events"); // Limpia la caché si tu frontend consume este GET

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