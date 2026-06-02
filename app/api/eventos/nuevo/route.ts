// app/api/eventos/nuevo/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEventCreatedEmail } from "@/lib/email";

// Función auxiliar para limpiar texto y prevenir XSS (Inyección de Scripts)
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: Request) {
  try {
    // 1. Protección de Autenticación (Solo usuarios reales logueados en Clerk)
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Sesión expirada. Por favor inicia sesión de nuevo." }, { status: 401 });
    }

    // 2. Extraer y estructurar el body en JSON estándar
    const body = await req.json();
    
    // 3. Sanitización de Inputs (Evita que metan etiquetas <script> o código malicioso)
    const name = sanitizeText(body.name || "").trim();
    const description = sanitizeText(body.description || "").trim();
    const dateStr = body.date;
    const location = sanitizeText(body.location || "").trim();
    const locationUrl = sanitizeText(body.locationUrl || "").trim();
    const isPublic = body.isPublic === true;
    
    let accessCode = sanitizeText(body.accessCode || "").trim().toUpperCase();

    // 4. Validaciones estrictas del lado del Servidor
    if (!name || !dateStr) {
      return NextResponse.json({ success: false, error: "El nombre y la fecha son obligatorios." }, { status: 400 });
    }

    if (!isPublic) {
      if (!accessCode || accessCode.length < 4 || accessCode.length > 12) {
        return NextResponse.json({ success: false, error: "El código de acceso debe tener entre 4 y 12 caracteres." }, { status: 400 });
      }
    } else {
      accessCode = null; // Si es público, nos aseguramos de que no guarde basura
    }

    // 5. Límite de seguridad de negocio (Máximo 5 eventos)
    const existingEventsCount = await prisma.event.count({
      where: { userId: user.id }
    });

    if (existingEventsCount >= 5) {
      return NextResponse.json({ 
        success: false, 
        error: "Has alcanzado el límite de 5 eventos. Elimina uno existente para continuar." 
      }, { status: 400 });
    }

    // 6. Generación segura de número de evento (Previene colisiones)
    const year = new Date().getFullYear();
    let eventNumber = "";
    let counter = 1000;
    let exists = true;

    while (exists) {
      eventNumber = `EV-${year}-${String(counter).padStart(4, '0')}`;
      exists = await prisma.event.findUnique({
        where: { eventNumber }
      }) !== null;
      counter++;
    }

    // 7. Generación segura de Slug único
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

    // 8. Inserción Segura en la Base de Datos (Prisma automatiza la protección Anti-SQLi)
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

    // 9. Envío de Email Notificación
    try {
      const organizer = await prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true }
      });
      if (organizer?.email) {
        await sendEventCreatedEmail(organizer.email, event);
      }
    } catch (emailError) {
      console.error("⚠️ Error en envío de email post-registro:", emailError);
    }

    // 10. Revalidar rutas en la caché de Vercel
    revalidatePath("/eventos");
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, event });

  } catch (error: any) {
    console.error("❌ Error crítico en API nuevo evento:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor." }, { status: 500 });
  }
}