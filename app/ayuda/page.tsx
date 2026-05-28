// app/ayuda/page.tsx
import { ArrowRight, Mail, Phone, MessageCircle, Users, QrCode, Calendar, Download } from "lucide-react";
import Link from "next/link";

export default function AyudaPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 pb-24">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Centro de Ayuda</h1>
        <p className="text-xl text-gray-600">Estamos aquí para resolver todas tus dudas</p>
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
            <p className="text-gray-600">Los asistentes se registran y reciben su QR por correo automáticamente.</p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-5xl mb-6">3️⃣</div>
            <h3 className="font-semibold text-xl mb-3">Realiza el check-in</h3>
            <p className="text-gray-600">Escanea los QR o busca manualmente a los asistentes.</p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-5xl mb-6">4️⃣</div>
            <h3 className="font-semibold text-xl mb-3">Descarga reportes</h3>
            <p className="text-gray-600">Exporta listas y estadísticas en Excel o PDF cuando lo necesites.</p>
          </div>
        </div>
      </div>

      {/* Contacto Directo */}
      <div className="bg-white border rounded-3xl p-12 shadow-sm">
        <h2 className="text-3xl font-semibold text-center mb-10">¿Necesitas ayuda personalizada?</h2>
        
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
            <p className="text-sm text-gray-500">Estamos trabajando para darte atención inmediata</p>
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