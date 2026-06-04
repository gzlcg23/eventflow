// app/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

// 🌟 ELIMINAMOS LA IMPORTACIÓN MANUAL DEL FOOTER

export default async function HomePage() {
  const user = await currentUser();

  // Si ya está logueado → redirigir directamente a Mis Eventos
  if (user) {
    redirect("/eventos");
  }

  return (
    // 🌟 LIMPIEZA: Quitamos min-h-screen y flex-col justify-between para evitar duplicidad de altura con el layout global
    <div className="w-full bg-gradient-to-br from-gray-50 to-white">
      
      {/* Hero Section Mejorado */}
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" />
            Gestión de eventos simplificada
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Organiza tus eventos<br />
            con <span className="text-emerald-600">facilidad</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Registros con QR, check-in rápido, reportes automáticos y control total.<br />
            Ideal para conferencias, talleres y eventos corporativos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="bg-black text-white px-10 py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-3 group"
            >
              Iniciar Sesión
              <ArrowRight className="group-hover:translate-x-1 transition" size={22} />
            </Link>
            
            <Link
              href="/sign-up"
              className="border border-gray-300 px-10 py-4 rounded-2xl text-lg font-medium hover:bg-gray-50 transition"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </div>

      {/* Tutorial Gráfico - Cómo usar EventFlow */}
      <div className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">¿Cómo funciona EventFlow?</h2>
            <p className="text-xl text-gray-600">Es muy sencillo. Solo sigue estos 4 pasos</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
            {/* Paso 1 */}
            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition duration-300">
                1️⃣
              </div>
              <h3 className="font-semibold text-2xl mb-3">Crea tu evento</h3>
              <p className="text-gray-600 leading-relaxed">
                Registra nombre, fecha, ubicación y decide si es público o privado. 
                Obtén tu número de referencia automáticamente.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition duration-300">
                2️⃣
              </div>
              <h3 className="font-semibold text-2xl mb-3">Comparte el enlace</h3>
              <p className="text-gray-600 leading-relaxed">
                Los asistentes se registran fácilmente a través del enlace y reciben 
                su código QR por correo automáticamente.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition duration-300">
                3️⃣
              </div>
              <h3 className="font-semibold text-2xl mb-3">Realiza el evento</h3>
              <p className="text-gray-600 leading-relaxed">
                Escanea los códigos QR en la entrada con tu celular. 
                El check-in es rápido y en tiempo real.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition duration-300">
                4️⃣
              </div>
              <h3 className="font-semibold text-2xl mb-3">Descarga reportes</h3>
              <p className="text-gray-600 leading-relaxed">
                Obtén listas completas, estadísticas de asistencia y exporta a Excel o PDF 
                cuando lo necesites.
              </p>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="text-center mt-16">
            <Link 
              href="/sign-up" 
              className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 transition"
            >
              Crear mi primer evento
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}