// app/api/events/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const locationUrl = formData.get("locationUrl") as string;
    const isPublic = formData.get("isPublic") === "true";
    const accessCode = formData.get("accessCode") as string;

    if (!name || !date) {
      return NextResponse.json({ error: "Nombre y fecha son obligatorios" }, { status: 400 });
    }

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
      },
    });

    console.log(`✅ Evento actualizado: ${updatedEvent.name} | Público: ${isPublic}`);

    return NextResponse.json({ success: true, event: updatedEvent });

  } catch (error: any) {
    console.error("Error al actualizar evento:", error);
    return NextResponse.json({ error: "Error al actualizar el evento" }, { status: 500 });
  }
}