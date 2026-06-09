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
    .or(z.literal("")),

  // Tolerante a formatos datetime-local y protegido contra desfases horarios del servidor
  date: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.length === 16) {
        return `${val}:00`;
      }
      return val;
    },
    z.coerce.date({ message: "La fecha y hora de inicio ingresadas no son válidas" })
  ).refine(
    (val) => {
      const limiteTolerante = new Date();
      limiteTolerante.setHours(limiteTolerante.getHours() - 2);
      return val.getTime() > limiteTolerante.getTime();
    },
    { message: "La fecha del evento no es válida o ya ha pasado." }
  ),

  // 🌟 NUEVO: Validación de Fecha de Finalización para eventos Multidía
  endDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date({ message: "La fecha de finalización ingresada no es válida" }).optional().nullable()
  ),

  location: z.string()
    .min(3, "La ubicación debe tener al menos 3 caracteres")
    .max(150, "La ubicación es demasiado larga")
    .transform(val => val.trim()),

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

  // 🌟 Forzado de capacidad desde el Tier seleccionado en UI
  capacity: z.coerce.number()
    .int("La capacidad debe ser un número entero")
    .positive("La capacidad debe ser mayor a cero"),

  // 🌟 NUEVO: Validación del paquete contratado
  tierId: z.enum(["MICRO", "MEDIUM", "LARGE"], {
    errorMap: () => ({ message: "El paquete seleccionado no es válido" })
  }),

  // 🌟 NUEVO: Monto calculado dinámicamente desde el cliente
  paymentAmount: z.coerce.number()
    .nonnegative("El monto de pago no puede ser negativo")
});

// Función auxiliar para limpiar texto y prevenir XSS
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
    // 1. Protección de Autenticación
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Sesión expirada. Por favor inicia sesión de nuevo." }, { status: 401 });
    }

    // 2. Extraer el body de la petición
    const body = await req.json();

    // 3. Validar la estructura de datos con Zod
    const result = crearEventoSchema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json({ success: false, error: errorMessages }, { status: 400 });
    }

    // 4. Extraer datos limpios (¡Con los campos modulares agregados! 🌟)
    const { 
      name, 
      description, 
      date, 
      endDate, 
      location, 
      locationUrl, 
      isPublic, 
      capacity, 
      tierId, 
      paymentAmount 
    } = result.data;
    
    let accessCode = result.data.accessCode;

    if (!isPublic && !accessCode) {
      return NextResponse.json({ success: false, error: "Los eventos privados requieren obligatoriamente un código de acceso." }, { status: 400 });
    }

    // Validación cruzada para fechas multidía
    if (endDate && endDate <= date) {
      return NextResponse.json({ success: false, error: "La fecha de finalización debe ser estrictamente posterior a la fecha de inicio." }, { status: 400 });
    }

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

    /// 6. Generación segura de número de evento (Correlativo Basado en Conteo)
    const year = new Date().getFullYear();
    
    // Obtenemos el total de eventos históricos en el sistema para generar el siguiente folio
    const totalEventsInSystem = await prisma.event.count();
    const nextSequence = 1000 + totalEventsInSystem + 1;
    
    // Construimos el folio usando una variable con nombre único e inequívoco
    const finalEventNumber = `EV-${year}-${String(nextSequence).padStart(4, '0')}`;

    // 7. Generación segura de Slug único
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

    // 8. Inserción Segura en Neon (Inyectando la configuración modular 🌟)
    const event = await prisma.event.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        date: date,
        endDate: endDate || null, // Guardamos la fecha de fin si es multidía
        location: sanitizedLocation,
        locationUrl: sanitizedLocationUrl,
        isPublic,
        accessCode: sanitizedAccessCode,
        capacity: capacity, 
        tierId: tierId, // Registramos qué plan compró ("MICRO", "MEDIUM", "LARGE")
        isActive: false, // Espera que el administrador valide su depósito
        paymentStatus: "PENDING",
        paymentAmount: paymentAmount, // El precio exacto calculado con multiplicador
        slug: finalSlug,
        userId: user.id,
        eventNumber: finalEventNumber, // 🌟 Pasamos la variable limpia y mapeada correctamente
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