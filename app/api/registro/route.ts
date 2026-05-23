// app/api/registro/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
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

    // ==================== ENVÍO DE EMAIL CON ADJUNTO ====================
    try {
      await resend.emails.send({
        from: 'EventFlow <onboarding@resend.dev>',
        to: email,
        subject: `✅ Registro confirmado - ${event.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
            <h1 style="color: #10b981; text-align: center;">¡Registro Exitoso!</h1>
            <p>Hola <strong>${name}</strong>,</p>
            <h2>${event.name}</h2>
            
            <p><strong>Fecha:</strong> ${new Date(event.date).toLocaleDateString('es-MX', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
            })}</p>

            ${event.location ? `<p><strong>Lugar:</strong> ${event.location}</p>` : ''}
            
            <p>Adjunto encontrarás tu código QR para el check-in.</p>
            <p><strong>Código único:</strong> ${attendee.qrCode}</p>
            
            <p>Guarda este correo. ¡Nos vemos pronto!</p>
          </div>
        `,
        attachments: [
          {
            filename: `QR-${attendee.qrCode}.png`,
            content: qrCodeBuffer,
          }
        ]
      });
      console.log(`📧 Email con QR adjunto enviado a ${email}`);
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