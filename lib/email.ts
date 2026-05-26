// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEventCreatedEmail(to: string, event: any) {
  try {
    const eventLink = `${process.env.NEXT_PUBLIC_APP_URL}/evento/${event.slug}`;
    const isPrivate = !event.isPublic;

    await resend.emails.send({
      from: 'EventFlow <no-reply@redspace.mx>',
      to,
      subject: `✅ Evento creado: ${event.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #10b981; margin: 0;">EventFlow</h1>
            <p style="color: #6b7280; margin-top: 8px;">Tu evento ha sido creado exitosamente</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <h2 style="color: #111827; margin-top: 0;">${event.name}</h2>
            
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Número de Referencia:</strong> <span style="font-size: 1.3em; color: #10b981;">${event.eventNumber}</span></p>
            </div>

            <p><strong>Fecha:</strong> ${new Date(event.date).toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            
            ${event.location ? `<p><strong>Ubicación:</strong> ${event.location}</p>` : ''}
            ${event.locationUrl ? `<p><strong>Google Maps:</strong> <a href="${event.locationUrl}" target="_blank">${event.locationUrl}</a></p>` : ''}
            
            <p><strong>Tipo:</strong> ${isPrivate ? '🔒 Privado' : '🌍 Público'}</p>
            
            ${isPrivate && event.accessCode ? `
              <p style="background: #fef3c7; padding: 12px; border-radius: 8px; color: #92400e;">
                <strong>Código de Acceso:</strong> <span style="font-size: 1.2em;">${event.accessCode}</span>
              </p>
            ` : ''}

            <p style="margin-top: 20px;">
              <strong>Link de Registro:</strong><br>
              <a href="${eventLink}" style="color: #10b981; word-break: break-all;">${eventLink}</a>
            </p>

            <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 0.95em;">
              Recuerda enviar tu comprobante de pago con el <strong>Número de Referencia</strong> para activar tu evento.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 0.9em;">
            <p>Gracias por usar <strong>EventFlow</strong></p>
            <p>Plataforma de Gestión de Eventos</p>
          </div>
        </div>
      `,
    });

    console.log(`✅ Email profesional enviado a: ${to}`);
  } catch (error) {
    console.error("Error enviando email de creación:", error);
  }
}