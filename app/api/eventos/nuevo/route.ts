// app/api/eventos/nuevo/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEventCreatedEmail } from "@/lib/email";
import { z } from 'zod';

// ==================== ESQUEMA DE VALIDACIÓN CON ZOD ====================
const crearEventoSchema = z.object({
  name: z.string()
    .min(3, "El nombre del evento debe tener al menos 3 caracteres")
    .max(100, "El nombre del evento es demasiado largo")
    .transform(val => val.trim()),

  description: z.string()
    .max(500, "La descripción no puede exceder los 500 caracteres")
    .transform(val => val.trim())
    .optional()
    .nullable()
    .or(z.literal("")), // Permite string vacío si no ponen descripción

  // Quitamos .datetime() para soportar formatos simplificados de inputs HTML (como datetime-local)
  date: z.preprocess(
    (val) => val,
    z.coerce.date({ message: "La fecha y hora ingresadas no son válidas" })
  ).refine((val) => val > new Date(), {
    message: "La fecha del evento debe ser en el futuro",
  }),

  location: z.string()
    .min(3, "La ubicación debe tener al menos 3 caracteres")
    .max(150, "La ubicación es demasiado larga")
    .transform(val => val.trim()),

  // Validamos URL de Google Maps de manera segura por si viene vacía o nula
  locationUrl: z.string()
    .transform(val => val?.trim() || "")
    .optional()
    .nullable()
    .refine(val => !val || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(val), {
      message: "El enlace de Google Maps no es una URL válida"
    })
    .or(z.literal("")),

  isPublic: z.boolean().default(true),
  
  accessCode: z.string()
    .transform(val => val?.trim().toUpperCase() || "")
    .optional()
    .nullable()
    .refine((val) => !val || (val.length >= 4 && val.length <= 12), {
      message: "El código de acceso debe tener entre 4 y 12 caracteres",
    })
    .or(z.literal("")),

  // Usamos z.coerce.number() para transformar strings de inputs numéricos ("50" -> 50)
  capacity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number()
      .int("La capacidad debe ser un número entero")
      .positive("La capacidad debe ser mayor a cero")
      .optional()
      .nullable()
  ),
});

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

    // 2. Extraer el body de la petición
    const body = await req.json();

    // 3. Validar la estructura de datos con Zod de forma estricta
    const result = crearEventoSchema.safeParse(body);

    if (!result.success) {
      // Mapeamos los errores de Zod en una sola cadena amigable para el frontend
      const errorMessages = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json({ success: false, error: errorMessages }, { status: 400 });
    }

    // 4. Datos limpios, parseados y validados por Zod (Añadido 'capacity' aquí 🌟)
    const { name, description, date, location, locationUrl, isPublic, capacity } = result.data;
    let accessCode = result.data.accessCode;

    // Validación de lógica de negocio adicional (Código requerido si es privado)
    if (!isPublic && !accessCode) {
      return NextResponse.json({ success: false, error: "Los eventos privados requieren obligatoriamente un código de acceso." }, { status: 400 });
    }

    // Sanitizar textos antes de persistir en base de datos para prevenir XSS vectorizados
    const sanitizedName = sanitizeText(name);
    const sanitizedDescription = description ? sanitizeText(description) : null;
    const sanitizedLocation = sanitizeText(location);
    const sanitizedLocationUrl = locationUrl ? sanitizeText(locationUrl) : null;
    const sanitizedAccessCode = !isPublic && accessCode ? sanitizeText(accessCode) : null;

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

    // 7. Generación segura de Slug único basado en el nombre limpio
    let slug = sanitizedName
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

    // 8. Inserción Segura en la Base de Datos con Prisma
    const event = await prisma.event.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        date: date, // Ya es un objeto Date gracias a Zod
        location: sanitizedLocation,
        locationUrl: sanitizedLocationUrl,
        isPublic,
        accessCode: sanitizedAccessCode,
        capacity: capacity || null, // Guardamos la capacidad parseada 🌟
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