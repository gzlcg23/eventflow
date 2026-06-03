// app/api/registro/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { registroRateLimiter } from "@/lib/ratelimit";   
// @ts-ignore
import QRCode from 'qrcode';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const registroSchema = z.object({
  eventId: z.string().min(1, "El ID del evento es requerido"),
  
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(70, "El nombre es demasiado largo")
    .transform(val => val.trim())
    .refine(val => val.split(/\s+/).filter(Boolean).length >= 2, {
      message: "Por favor, ingresa al menos un nombre y un apellido"
    }),

  email: z.string()
    .email("El formato de correo electrónico no es válido")
    .max(100, "El correo es demasiado largo")
    .transform(val => val.toLowerCase().trim())
    .refine(val => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}(\.[a-zA-Z]{2,6})?$/.test(val), {
      message: "El correo debe incluir una terminación de dominio válida (ejemplo: .com, .mx)"
    }),

  company: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val).trim()),
    z.string().max(100, "El nombre de la empresa es demasiado largo")
  ).optional().nullable(),

  phone: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val).trim()),
    z.string()
      .max(15, "El teléfono no puede exceder los 15 dígitos")
      .refine(val => val === "" || /^[\d\s+\-]+$/.test(val), {
        message: "El teléfono solo debe contener números"
      })
  ).optional().nullable()
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success, limit, reset, remaining } = await registroRateLimiter.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos de registro. Por seguridad, tu dirección IP ha sido bloqueada temporalmente. Por favor, intenta de nuevo en un minuto." }, 
        { 
          status: 429, 
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const result = registroSchema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) => issue.message).join(", ");
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    const { name, email, company, phone, eventId } = result.data;

    // 1. Obtener evento incluyendo la capacidad
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true, capacity: true }
    });

    if (!event) {
      return NextResponse.json({ error: "El evento especificado no existe." }, { status: 404 });
    }

    // 2. 🌟 VALIDACIÓN DE CAPACIDAD (LÍMITE DE ASISTENTES)
    if (event.capacity !== null) {
      const currentAttendeesCount = await prisma.attendee.count({
        where: { 
          eventId: eventId,
          status: { in: ["REGISTERED", "CHECKED_IN"] } // No contamos los cancelados
        }
      });

      if (currentAttendeesCount >= event.capacity) {
        return NextResponse.json({ 
          error: "Lo sentimos, el registro para este evento se ha cerrado porque se alcanzó el cupo máximo de asistentes." 
        }, { status: 422 }); // HTTP 422: Unprocessable Entity (Lógica de negocio rota)
      }
    }

    // 3. Crear el asistente
    const attendee = await prisma.attendee.create({
      data: {
        name,
        email,
        company: company || null,
        phone: phone || null,
        eventId,
        qrCode: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      },
    });

    // Generación del código QR
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://registros.redspace.mx';
    const qrUrl = `${baseUrl}/checkin/${attendee.qrCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 300 });
    const base64Data = qrCodeDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(base64Data, 'base64');

    // Envío del correo con Resend
    try {
      await resend.emails.send({
        from: 'EventFlow <no-reply@redspace.mx>',
        to: email,
        subject: `Registro Confirmado - ${event.name}`,
        html: `... tu html completo sin cambios ...`, // Mantén tu HTML intacto aquí
        attachments: [
          {
            filename: 'codigo-qr.png',
            content: qrBuffer,
            content_type: 'image/png',
            cid: 'qrcode'
          }
        ]
      });
    } catch (emailError) {
      console.error("⚠️ Error Resend:", emailError);
    }

    // 🪵 Log de auditoría básico en consola
    console.log(`✅ Nuevo asistente registrado: [${email}] en el evento [${event.name}]`);

    return NextResponse.json({
      success: true,
      attendee,
      qrCodeDataUrl,
      event
    });

  } catch (error: any) {
    console.error("❌ Error en API de registro:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este correo electrónico ya se encuentra registrado para este evento." }, { status: 409 });
    }
    
    // 🌟 Ocultamos los detalles técnicos crudos del error para producción
    return NextResponse.json({ 
      error: "Ocurrió un error interno al procesar tu registro por parte del servidor."
    }, { status: 500 });
  }
}