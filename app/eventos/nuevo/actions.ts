// app/eventos/nuevo/actions.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  try {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    // === LIMITAR A 5 EVENTOS POR USUARIO ===
    const existingEventsCount = await prisma.event.count({
      where: { userId: user.id }
    });

    if (existingEventsCount >= 5) {
      return { 
        success: false, 
        error: "Has alcanzado el límite de 5 eventos. Elimina uno para crear otro." 
      };
    }
  try {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string || "").trim();
    const dateStr = formData.get("date") as string;
    const location = (formData.get("location") as string || "").trim();
    const locationUrl = (formData.get("locationUrl") as string || "").trim();
    
    const isPublic = formData.get("isPublic") === "true" || formData.get("isPublic") === "on";

    let accessCode: string | null = null;
    if (!isPublic) {
      accessCode = (formData.get("accessCode") as string || "").trim().toUpperCase();
      if (!accessCode || accessCode.length < 4) {
        return { success: false, error: "Los eventos privados necesitan un código de acceso de al menos 4 caracteres" };
      }
    }

    if (!name || !dateStr) {
      return { success: false, error: "Nombre y fecha son obligatorios" };
    }

    // Generar número único de evento
    const year = new Date().getFullYear();
    const count = await prisma.event.count();
    const eventNumber = `EV-${year}-${String(count + 1000).padStart(4, '0')}`;

    let slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let counter = 1;
    let finalSlug = slug;
    while (await prisma.event.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        date: new Date(dateStr),
        location: location || null,
        locationUrl: locationUrl || null,
        isPublic,
        accessCode,
        eventNumber,
        isActive: false,
        paymentStatus: "PENDING",
        slug: finalSlug,
        userId: user.id,
      },
    });

    console.log(`✅ Evento creado: ${event.name} | Número: ${eventNumber}`);

    revalidatePath("/eventos");
    revalidatePath("/dashboard");

    // ← Respuesta mejorada para la nueva pantalla de éxito
    return { 
      success: true, 
      event,
      eventNumber,
      message: "Evento creado correctamente",
      showActivationNotice: true
    };

  } catch (error: any) {
    console.error("Error al crear evento:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}