// app/terminos/page.tsx
// Cambia esto en los tres archivos:
import Footer from "./components/Footer"; // Si estás en privacidad/terminos sería "../../components/Footer"
export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col justify-between selection:bg-zinc-800 selection:text-white">
      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-8">
        <header className="space-y-2 border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-sm text-zinc-500">Última actualización: Junio 2026</p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed">
          <p>
            Bienvenido a <strong>EventFlow</strong>. Al acceder o utilizar nuestra plataforma de gestión de eventos y registro digital, aceptas cumplir con los presentes Términos y Condiciones de Servicio. Si no estás de acuerdo con alguna de estas cláusulas, te solicitamos abstenerte de usar el sistema.
          </p>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Naturaleza del Servicio</h2>
            <p>
              EventFlow proporciona una infraestructura SaaS (Software como Servicio) para la creación de páginas de registro, generación de códigos QR y control de accesos. EventFlow es un intermediario tecnológico y <strong>no es responsable</strong> de la organización, logística, calidad, seguridad ni de la cancelación de los eventos publicados por los usuarios organizadores.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Uso de Cuentas y Responsabilidad</h2>
            <p>
              El organizador es el único responsable de mantener la confidencialidad de sus accesos y de las acciones realizadas bajo su cuenta. Asimismo, el organizador se compromete a no utilizar la plataforma para recopilar información con fines ilícitos, engañosos, o que atenten contra la integridad de los asistentes.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Límites de Capacidad y Planes</h2>
            <p>
              El uso del servicio está sujeto a los límites de registros y capacidades estipuladas en la base de datos para cada evento según el esquema activo. El sistema bloqueará de forma automatizada cualquier registro entrante que intente superar el cupo máximo configurado en la plataforma.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Limitación de Responsabilidad</h2>
            <p>
              EventFlow se esfuerza por mantener una disponibilidad del servicio óptima. Sin embargo, no garantizamos que el servicio sea ininterrumpido o esté completamente libre de errores debido a fallas externas de servidores cloud, redes de internet de los usuarios o causas de fuerza mayor. EventFlow no se hace responsable por pérdidas económicas derivadas de incidencias técnicas el día del evento.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de EventFlow tras la publicación de cambios implicará la aceptación expresa de los nuevos términos.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}