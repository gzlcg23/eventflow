// app/api/registro/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// @ts-ignore
import QRCode from 'qrcode';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function sanitizeInput(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = sanitizeInput(body.name || "").trim();
    const email = sanitizeInput(body.email || "").toLowerCase().trim();
    const company = sanitizeInput(body.company || "").trim();
    const phone = sanitizeInput(body.phone || "").trim();
    const eventId = sanitizeInput(body.eventId || "").trim();

    if (!name || !email || !eventId) {
      return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "El formato de correo electrónico no es válido." }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: "El evento especificado no existe." }, { status: 404 });
    }

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

    // 6. Generar la URL base dinámica usando variables de entorno o producción
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://registros.redspace.mx';
    const qrUrl = `${baseUrl}/checkin/${attendee.qrCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 300 });

    // === SOLUCIÓN CRÍTICA ADJUNTOS EN EMAILS ===
    // Convertimos la cadena Base64 generada por QRCode a un Buffer binario para Resend
    const base64Data = qrCodeDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(base64Data, 'base64');

    // ==================== ENVÍO DE EMAIL CON RESEND ====================
    try {
      await resend.emails.send({
        from: 'EventFlow <no-reply@redspace.mx>',
        to: email,
        subject: `Registro Confirmado - ${event.name}`,
        // 🌟 Usamos 'cid:qrcode' en el src para enlazar la imagen embebida de forma segura
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
        // 🌟 Adjuntamos el código QR como un archivo binario en el correo
        attachments: [
          {
            filename: 'codigo-qr.png',
            content: qrBuffer,
            content_type: 'image/png',
            cid: 'qrcode' // Este ID coincide exactamente con el 'cid:qrcode' de la etiqueta img arriba
          }
        ]
      });

      console.log(`📧 Email con QR enviado con éxito a ${email}`);
    } catch (emailError) {
      console.error("⚠️ Error al despachar el email mediante Resend:", emailError);
    }

    return NextResponse.json({
      success: true,
      attendee,
      qrCodeDataUrl,
      event,
      message: "Registro completado con éxito."
    });

  } catch (error: any) {
    console.error("❌ Error crítico en API de registro de asistentes:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este correo electrónico ya se encuentra registrado para este evento." }, { status: 409 });
    }
    return NextResponse.json({ error: "Ocurrió un error interno al procesar tu registro." }, { status: 500 });
  }
}