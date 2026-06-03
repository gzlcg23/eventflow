// app/privacidad/page.tsx
// Cambia esto en los tres archivos:
import Footer from "../../components/Footer";
export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-8">
        <header className="space-y-2 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Aviso de Privacidad
          </h1>
          <p className="text-sm text-zinc-500">Última actualización: Junio 2026</p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed">
          <p>
            En <strong>EventFlow</strong>, accesible desde registros.redspace.mx, nos tomamos muy en serio la seguridad y confidencialidad de tus datos. Con fundamento en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) en México, te informamos cómo recolectamos y tratamos tu información.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Datos Personales que Recolectamos</h2>
            <p>Para operar la plataforma y permitir el registro a los eventos, el sistema solicita y almacena:</p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-zinc-400">
              <li>Datos del Organizador: Nombre, correo electrónico y datos de autenticación provistos por Clerk.</li>
              <li>Datos de los Asistentes: Nombre completo, correo electrónico, teléfono y empresa (opcional).</li>
              <li>Datos Técnicos: Dirección IP y registros de actividad (Audit Logs) para garantizar la seguridad del sitio.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Finalidad del Tratamiento de Datos</h2>
            <p>Los datos recabados serán utilizados estrictamente para las siguientes funciones:</p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-zinc-400">
              <li>Generación y envío automatizado de boletos digitales y códigos QR.</li>
              <li>Validación de accesos físicos en la entrada de los eventos (Check-In).</li>
              <li>Monitoreo de auditoría interna para prevenir fraudes o registros duplicados.</li>
              <li>Comunicación directa relacionada exclusivamente con el estatus del evento.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Transferencia y Resguardo de la Información</h2>
            <p>
              EventFlow <strong>no vende, renta ni distribuye</strong> bases de datos personales a terceros bajo ninguna circunstancia. Tu información se encuentra almacenada de forma segura en servidores de base de datos distribuidos (Neon/PostgreSQL) y procesada a través de la infraestructura cloud de Vercel.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Derechos ARCO</h2>
            <p>
              Como titular de los datos, tienes derecho a conocer qué datos tenemos (Acceso), corregirlos (Rectificación), solicitar su eliminación de nuestras bases de datos (Cancelación) u oponerte al uso de los mismos (Oposición). Para ejercer tus derechos ARCO, puedes ponerte en contacto enviando una solicitud formal al correo de administración de la plataforma.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}