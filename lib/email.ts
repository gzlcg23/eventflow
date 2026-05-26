// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEventCreatedEmail(to: string, event: any) {
  try {
    await resend.emails.send({
      from: 'EventFlow <no-reply@eventflow.com.mx>',
      to,
      subject: `✅ Evento creado: ${event.name}`,
      html: `
        <h2>¡Evento creado exitosamente!</h2>
        <p><strong>Nombre del evento:</strong> ${event.name}</p>
        <p><strong>Número de referencia:</strong> <b>${event.eventNumber}</b></p>
        
        <hr>
        <p><strong>Importante:</strong> Para activar tu evento, envía tu comprobante de pago incluyendo este número de referencia.</p>
        
        <p>Gracias por usar EventFlow</p>
      `,
    });
    console.log(`✅ Email de creación enviado a: ${to}`);
  } catch (error) {
    console.error("Error enviando email de creación:", error);
  }
}

export async function sendAttendeeConfirmation(attendee: any, event: any) {
  try {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/evento/${event.slug}`;

    await resend.emails.send({
      from: 'EventFlow <no-reply@eventflow.com.mx>',
      to: attendee.email,
      subject: `✅ Confirmación de registro - ${event.name}`,
      html: `
        <h2>¡Registro confirmado!</h2>
        <p>Hola <strong>${attendee.name}</strong>,</p>
        <p>Te has registrado exitosamente al evento:</p>
        <h3>${event.name}</h3>
        <p><strong>Fecha:</strong> ${new Date(event.date).toLocaleDateString('es-MX')}</p>
        
        <p>Tu código QR es:</p>
        <p style="font-size: 18px; font-family: monospace; background: #f3f4f6; padding: 15px; border-radius: 8px;">
          ${attendee.qrCode}
        </p>

        <p><a href="${link}" style="color: #10b981; font-weight: bold;">Ver página del evento</a></p>
        
        <p>¡Te esperamos en el evento!</p>
      `,
    });
    console.log(`✅ Email de confirmación enviado a: ${attendee.email}`);
  } catch (error) {
    console.error("Error enviando email de confirmación:", error);
  }
}