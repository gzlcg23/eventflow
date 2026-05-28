// app/ayuda/page.tsx
import { ArrowRight, Mail, Phone, MessageCircle, Users, QrCode, Calendar, Download, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function AyudaPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 pb-24">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Centro de Ayuda</h1>
        <p className="text-xl text-gray-600">Todo lo que necesitas saber para usar EventFlow</p>
      </div>

      {/* Guía Rápida */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-10 text-center">Cómo usar EventFlow en 4 pasos</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-5xl mb-6">1️⃣</div>
            <h3 className="font-semibold text-xl mb-3">Crea tu evento</h3>
            <p className="text-gray-600">Ve a "Mis Eventos" y haz clic en "+ Crear Nuevo Evento".</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-5xl mb-6">2️⃣</div>
            <h3 className="font-semibold text-xl mb-3">Comparte el enlace</h3>
            <p className="text-gray-600">Los asistentes se registran y reciben su QR automáticamente.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-5xl mb-6">3️⃣</div>
            <h3 className="font-semibold text-xl mb-3">Realiza el check-in</h3>
            <p className="text-gray-600">Escanea los QR o busca manualmente a los asistentes.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-5xl mb-6">4️⃣</div>
            <h3 className="font-semibold text-xl mb-3">Descarga reportes</h3>
            <p className="text-gray-600">Exporta listas y estadísticas en Excel o PDF.</p>
          </div>
        </div>
      </div>

      {/* Preguntas Frecuentes (FAQ) */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-10 text-center flex items-center justify-center gap-3">
          <HelpCircle className="w-8 h-8" /> Preguntas Frecuentes
        </h2>
        <div className="space-y-6">
          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold text-lg mb-3">¿Cómo activo un evento privado?</h3>
            <p className="text-gray-600">Envía tu comprobante de pago con el número de referencia del evento al soporte. Una vez verificado, lo activaremos en menos de 24 horas.</p>
          </div>
          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold text-lg mb-3">¿Cuántos eventos puedo crear?</h3>
            <p className="text-gray-600">Tienes un límite de 5 eventos activos. Puedes eliminar o archivar eventos para crear más.</p>
          </div>
          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold text-lg mb-3">¿Los asistentes reciben el QR automáticamente?</h3>
            <p className="text-gray-600">Sí. En cuanto se registran, reciben un correo con su código QR único.</p>
          </div>
          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold text-lg mb-3">¿Puedo ver los reportes en tiempo real?</h3>
            <p className="text-gray-600">Sí, las estadísticas se actualizan en tiempo real mientras haces check-in.</p>
          </div>
        </div>
      </div>

      {/* Videos Tutoriales */}
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-10 text-center">Videos Tutoriales</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border rounded-3xl p-8">
            <div className="bg-gray-200 aspect-video rounded-2xl mb-4 flex items-center justify-center">
              <span className="text-gray-500">📹 Video 1 - Crear tu primer evento</span>
            </div>
            <h3 className="font-semibold">Cómo crear tu primer evento</h3>
          </div>
          <div className="bg-white border rounded-3xl p-8">
            <div className="bg-gray-200 aspect-video rounded-2xl mb-4 flex items-center justify-center">
              <span className="text-gray-500">📹 Video 2 - Realizar Check-in</span>
            </div>
            <h3 className="font-semibold">Cómo hacer check-in con QR</h3>
          </div>
        </div>
        <p className="text-center text-gray-500 mt-8">Más videos próximamente...</p>
      </div>

      {/* Contacto Directo */}
      <div className="bg-white border rounded-3xl p-12 shadow-sm">
        <h2 className="text-3xl font-semibold text-center mb-10">¿Aún tienes dudas?</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto text-emerald-600 mb-4" />
            <h3 className="font-semibold mb-2">Correo Electrónico</h3>
            <a href="mailto:soporte@eventflow.com.mx" className="text-emerald-600 hover:underline text-lg">
              soporte@eventflow.com.mx
            </a>
          </div>

          <div className="text-center">
            <Phone className="w-12 h-12 mx-auto text-emerald-600 mb-4" />
            <h3 className="font-semibold mb-2">WhatsApp</h3>
            <a href="https://wa.me/525512345678" target="_blank" className="text-emerald-600 hover:underline text-lg">
              +52 55 1234 5678
            </a>
            <p className="text-sm text-gray-500 mt-1">Lunes a Viernes 9:00 - 18:00</p>
          </div>

          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-emerald-600 mb-4" />
            <h3 className="font-semibold mb-2">Chat en Vivo</h3>
            <p className="text-emerald-600 font-medium">Próximamente</p>
            <p className="text-sm text-gray-500">Estamos trabajando en esta función</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-16">
        <Link href="/eventos" className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 transition">
          Ir a Mis Eventos
          <ArrowRight size={24} />
        </Link>
      </div>
    </div>
  );
}