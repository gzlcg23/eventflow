// app/api/registro/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server"; // 🌟 Importamos NextRequest para rastrear la IP
import { registroRateLimiter } from "@/lib/ratelimit";   // 🌟 Importamos tu escudo de Upstash
// @ts-ignore
import QRCode from 'qrcode';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== ESQUEMA DE VALIDACIÓN ULTRA-BLINDADO ====================
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

// 🌟 Cambiamos 'Request' por 'NextRequest' para el soporte de headers de Upstash
export async function POST(request: NextRequest) {
  try {
    // 🛡️ ==================== ESCUDO DE RATE LIMITING ====================
    // Extraemos la IP real del cliente suministrada por la infraestructura de Vercel
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Evaluamos los límites en Upstash Redis
    const { success, limit, reset, remaining } = await registroRateLimiter.limit(ip);
    
    // Si superó los 5 intentos por minuto, cortamos la petición aquí mismo
    if (!success) {
      return NextResponse.json(
        { 
          error: "Demasiados intentos de registro. Por seguridad, tu dirección IP ha sido bloqueada temporalmente. Por favor, intenta de nuevo en un minuto." 
        }, 
        { 
          status: 429, // HTTP 429: Too Many Requests
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }
    // ====================================================================

    const body = await request.json();

    // Validar con Zod de forma estricta
    const result = registroSchema.safeParse(body);

    // Si la validación falla, retornamos el error de forma segura
    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    // Datos limpios y totalmente validados por Zod
    const { name, email, company, phone, eventId } = result.data;

    // Verificar que el evento exista en la base de datos
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: "El evento especificado no existe." }, { status: 404 });
    }

    // Crear el asistente en Prisma
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
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background: white; border-radius: 16px; padding: 40px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">¡Registro Confirmado!</h1>
                <p style="color: #6b7280; margin-top: 8px;">Ya formas parte de este evento</p>
              </div>
              <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: #166534; margin: 0 0 8px 0;">${event.name}</h2>
                <p style="color: #15803d; font-weight: bold; margin: 0;">
                  ${new Date(event.date).toLocaleDateString('es-MX', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #374151; font-size: 17px; margin-bottom: 15px;">Tu código QR para el acceso:</p>
                <img src="cid:qrcode" style="max-width: 280px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" alt="Tu QR Code"/>
              </div>
              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                <p style="margin: 0; color: #64748b; font-size: 15px;">
                  <strong>Código único de acceso:</strong> <span style="font-family: monospace; background: white; padding: 4px 10px; border-radius: 6px;">${attendee.qrCode}</span>
                </p>
              </div>
              <p style="text-align: center; color: #64748b; margin-top: 30px; font-size: 14px;">
                Guarda este correo. Deberás presentar el código QR en la entrada el día del evento.
              </p>
            </div>
          </div>
        `,
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
    
    return NextResponse.json({ 
      error: "Ocurrió un error interno al procesar tu registro.",
      details: error.message || error
    }, { status: 500 });
  }
}