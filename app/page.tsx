// app/page.tsx
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, Users, QrCode, BarChart3, ShieldCheck } from "lucide-react";

export default async function HomePage() {
  const user = await currentUser();

  // Si ya está logueado → redirigir al Dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      {/* Hero */}
      <div className="pt-24 pb-16 px-6 flex-1">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Gestiona tus eventos<br />
            de forma <span className="text-emerald-600">inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Registros con QR, check-in rápido, reportes en tiempo real y control total.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="bg-black text-white px-8 py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-3"
            >
              Iniciar Sesión
              <ArrowRight size={22} />
            </Link>
            
            <Link
              href="/eventos/nuevo"
              className="border border-gray-300 px-8 py-4 rounded-2xl text-lg font-medium hover:bg-gray-50 transition"
            >
              Crear Evento Gratis
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-white border-t">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Todo lo que necesitas para tus eventos</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Registro con QR</h3>
              <p className="text-gray-600">Generación automática y envío por correo.</p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-9 h-9 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Check-in Rápido</h3>
              <p className="text-gray-600">Escanea QR o busca manualmente.</p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-9 h-9 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Reportes en Tiempo Real</h3>
              <p className="text-gray-600">Estadísticas y exportación Excel/PDF.</p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-9 h-9 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Eventos Privados</h3>
              <p className="text-gray-600">Control con código de acceso.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">EventFlow</h3>
            <p className="text-sm">Gestión inteligente de eventos con QR y check-in.</p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/eventos" className="hover:text-white">Mis Eventos</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-white">Tutoriales</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Términos de Uso</a></li>
              <li><a href="#" className="hover:text-white">Privacidad</a></li>
              <li><a href="#" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-12 border-t border-gray-800 pt-8">
          © 2026 EventFlow. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}