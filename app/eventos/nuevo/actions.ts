// app/eventos/nuevo/actions.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEventCreatedEmail } from "@/lib/email";
import { cookies } from "next/headers";

export async function createEvent(formData: FormData) {
  try {
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

        // ==================== VALIDACIÓN CSRF (temporalmente desactivada) ====================
    // const csrfTokenFromForm = formData.get('csrfToken') as string;
    // const csrfTokenFromCookie = cookies().get('__Host-csrf-token')?.value;

    // if (!csrfTokenFromForm || !csrfTokenFromCookie || csrfTokenFromForm !== csrfTokenFromCookie) {
    //   return { success: false, error: "Solicitud inválida. Por favor recarga la página." };
    // }
    // ========================================================

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
    // =======================================

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

    // ==================== GENERACIÓN SEGURA DE eventNumber ====================
    const year = new Date().getFullYear();
    let eventNumber: string;
    let counter = 1000;
    let exists = true;

    while (exists) {
      eventNumber = `EV-${year}-${String(counter).padStart(4, '0')}`;
      exists = await prisma.event.findUnique({
        where: { eventNumber }
      }) !== null;
      counter++;
    }
    // =====================================================================

    let slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slugCounter = 1;
    let finalSlug = slug;
    while (await prisma.event.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
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

    // === ENVIAR CORREO AL ORGANIZADOR ===
    const organizer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    });

    if (organizer?.email) {
      console.log(`🔍 Intentando enviar correo a: ${organizer.email}`);
      try {
        await sendEventCreatedEmail(organizer.email, event);
        console.log("✅ Correo enviado correctamente");
      } catch (emailError) {
        console.error("❌ Error al enviar correo:", emailError);
      }
    } else {
      console.log("⚠️ No se encontró email del organizador");
    }
    // =======================================

    revalidatePath("/eventos");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      event,
      eventNumber,
      message: "Evento creado correctamente"
    };

  } catch (error: any) {
    console.error("Error al crear evento:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}