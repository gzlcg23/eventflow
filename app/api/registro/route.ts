// app/api/registro/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// @ts-ignore
import QRCode from 'qrcode';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const company = formData.get("company") as string;
    const phone = formData.get("phone") as string;
    const eventId = formData.get("eventId") as string;

    if (!name || !email || !eventId) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const attendee = await prisma.attendee.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        eventId,
        qrCode: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      },
    });

    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${attendee.qrCode}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrUrl, { width: 400 });

        // ==================== ENVÍO DE EMAIL CON ADJUNTO (DISEÑO PROFESIONAL) ====================
    try {
      await resend.emails.send({
        from: 'EventFlow <no-reply@redspace.mx>',
        to: email,
        subject: `✅ Registro Confirmado - ${event.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            
            <div style="background: white; border-radius: 16px; padding: 40px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #10b981; margin: 0; font-size: 28px;">¡Registro Confirmado!</h1>
                <p style="color: #6b7280; margin-top: 8px;">Ya formas parte de este evento</p>
              </div>

              <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: #166534; margin: 0 0 8px 0;">${event.name}</h2>
                <p style="color: #4ade80; font-weight: bold; margin: 0;">
                  ${new Date(event.date).toLocaleDateString('es-MX', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #374151; font-size: 17px; margin-bottom: 15px;">Tu código QR para el evento:</p>
                <img src="cid:qr-code" style="max-width: 280px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" alt="QR Code"/>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                <p style="margin: 0; color: #64748b; font-size: 15px;">
                  <strong>Código único:</strong> <span style="font-family: monospace; background: white; padding: 4px 10px; border-radius: 6px;">${attendee.qrCode}</span>
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/evento/${event.slug}" 
                   style="background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">
                  Ver página del evento
                </a>
              </div>

              <p style="text-align: center; color: #64748b; margin-top: 30px; font-size: 14px;">
                Guarda este correo. Lo necesitarás el día del evento.
              </p>
            </div>

            <div style="text-align: center; margin-top: 25px; color: #94a3b8; font-size: 13px;">
              <p>Gracias por usar <strong>EventFlow</strong></p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `QR-${attendee.qrCode}.png`,
            content: qrCodeBuffer,
            cid: 'qr-code'   // ← Esto permite mostrar la imagen dentro del email
          }
        ]
      });

      console.log(`📧 Email profesional enviado a ${email}`);
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
    }

    // Para la pantalla de éxito seguimos usando data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 300 });

    return NextResponse.json({
      success: true,
      attendee,
      qrCodeDataUrl,
      event: event,
      message: "Registro exitoso"
    });

  } catch (error: any) {
    console.error("Error en registro:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este correo ya está registrado en este evento" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al procesar el registro" }, { status: 500 });
  }
}