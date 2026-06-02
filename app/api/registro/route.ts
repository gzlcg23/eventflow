// app/api/registro/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// @ts-ignore
import QRCode from 'qrcode';
import { Resend } from 'resend';
import { z } from 'zod'; // 🌟 Importamos Zod

const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== ESQUEMA DE VALIDACIÓN CORREGIDO (ZOD) ====================
const registroSchema = z.object({
  eventId: z.string().min(1, "El ID del evento es requerido"),
  
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(70, "El nombre es demasiado largo")
    .transform(val => val.trim())
    // 🌟 Mensaje personalizado si no ponen nombre y apellido
    .refine(val => val.split(/\s+/).filter(Boolean).length >= 2, {
      message: "Por favor, ingresa al menos un nombre y un apellido"
    }),

  email: z.string()
    .email("El formato de correo electrónico no es válido")
    .max(100, "El correo es demasiado largo")
    .transform(val => val.toLowerCase().trim())
    // 🌟 Forzar terminación de dominio válida (ej: .com, .com.mx, .net)
    // Evita que escriban cosas incompletas como "usuario@dominio." o "usuario@dominio.c"
    .refine(val => /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}(\.[a-zA-Z]{2,6})?$/.test(val), {
      message: "El correo debe incluir una terminación de dominio válida (ejemplo: .com, .mx)"
    }),

  company: z.string()
    .max(100, "El nombre de la empresa es demasiado largo")
    .transform(val => val.trim())
    .optional()
    .nullable(),

  phone: z.string()
    .max(15, "El teléfono no puede exceder los 15 dígitos")
    .regex(/^[\d\s+\-]+$/, "El teléfono solo debe contener números")
    .transform(val => val.trim())
    .optional()
    .nullable()
    .or(z.literal(''))
});

export async function POST(request: Request) {
  try {
    // 1. Leer el JSON enviado por el cliente
    const body = await request.json();

    // 2. Validar con Zod de forma estricta
    const result = registroSchema.safeParse(body);

    // Si la validación falla, retornamos el error detallado al cliente
    if (!result.success) {
      const errorMessages = result.error.errors.map(err => err.message).join(", ");
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    // Datos completamente limpios, validados y tipados por Zod
    const { name, email, company, phone, eventId } = result.data;

    // 3. Verificar que el evento exista y esté activo en Neon
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: "El evento especificado no existe." }, { status: 404 });
    }

    // 4. Crear el registro del asistente
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

    // 5. Generar la URL base dinámica usando variables de entorno o producción
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://registros.redspace.mx';
    const qrUrl = `${baseUrl}/checkin/${attendee.qrCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 300 });

    const base64Data = qrCodeDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(base64Data, 'base64');

    // ==================== ENVÍO DE EMAIL CON RESEND ====================
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
      console.log(`📧 Email enviado a ${email}`);
    } catch (emailError) {
      console.error("⚠️ Error Resend:", emailError);
    }

    return NextResponse.json({
      success: true,
      attendee,
      qrCodeDataUrl,
      event,
      message: "Registro completado con éxito."
    });

  } catch (error: any) {
    console.error("❌ Error en API de registro:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este correo electrónico ya se encuentra registrado para este evento." }, { status: 409 });
    }
    return NextResponse.json({ error: "Ocurrió un error interno al procesar tu registro." }, { status: 500 });
  }
}