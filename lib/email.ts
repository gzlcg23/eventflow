 libemail.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendQRCodeEmail(
  to string, 
  name string, 
  eventName string, 
  qrCodeDataUrl string
) {
  try {
    await resend.emails.send({
      from 'EventFlow no-reply@tu-dominio.com',  Cambia esto después
      to,
      subject `Tu QR para ${eventName}`,
      html `
        h2Hola ${name},h2
        p¡Gracias por registrarte en strong${eventName}strong!p
        pEste es tu código QR para el check-inp
        img src=${qrCodeDataUrl} style=margin 20px 0; 
        pGuárdalo o imprímelo. Lo necesitarás el día del evento.p
        p¡Te esperamos!p
      `,
    });
    console.log(✅ Email enviado a, to);
  } catch (error) {
    console.error(Error enviando email, error);
  }
}