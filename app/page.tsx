// app/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Users, QrCode, BarChart3, ShieldCheck, Calendar } from "lucide-react";

export default async function HomePage() {
  const user = await currentUser();

  // Si ya está logueado → redirigir directamente a Mis Eventos
  if (user) {
    redirect("/eventos");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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

      {/* Features Mejorados */}
      <div className="py-20 bg-white border-t">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Todo lo que necesitas</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <QrCode className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Registro con QR</h3>
              <p className="text-gray-600">Los asistentes se registran fácilmente y reciben su QR por correo.</p>
            </div>

            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Users className="w-9 h-9 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Check-in Rápido</h3>
              <p className="text-gray-600">Escanea el QR o busca por nombre en segundos.</p>
            </div>

            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <BarChart3 className="w-9 h-9 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reportes Instantáneos</h3>
              <p className="text-gray-600">Estadísticas en tiempo real y exportación Excel/PDF.</p>
            </div>

            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <ShieldCheck className="w-9 h-9 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Eventos Privados</h3>
              <p className="text-gray-600">Código de acceso y activación manual después del pago.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-2xl font-bold text-white mb-2">EventFlow</p>
          <p className="text-sm">Gestión inteligente de eventos • Hecho con ❤️ en México</p>
          <p className="text-xs text-gray-500 mt-8">© 2026 EventFlow. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}