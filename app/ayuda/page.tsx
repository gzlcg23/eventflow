// app/ayuda/page.tsx
import { ArrowRight, Users, QrCode, Calendar, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AyudaPage() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-10">Centro de Ayuda - EventFlow</h1>

      <div className="space-y-16">
        {/* Paso a paso */}
        <div>
          <h2 className="text-3xl font-semibold mb-8">Cómo usar EventFlow paso a paso</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border rounded-3xl p-8">
              <div className="text-4xl mb-4">1️⃣</div>
              <h3 className="font-semibold text-xl mb-3">Crea tu evento</h3>
              <p className="text-gray-600">Ve a "Mis Eventos" → "+ Crear Nuevo Evento". Completa los datos y elige si es público o privado.</p>
            </div>

            <div className="bg-white border rounded-3xl p-8">
              <div className="text-4xl mb-4">2️⃣</div>
              <h3 className="font-semibold text-xl mb-3">Comparte el enlace</h3>
              <p className="text-gray-600">Copia el enlace del evento y compártelo. Los asistentes se registran y reciben su QR automáticamente.</p>
            </div>

            <div className="bg-white border rounded-3xl p-8">
              <div className="text-4xl mb-4">3️⃣</div>
              <h3 className="font-semibold text-xl mb-3">Realiza el Check-in</h3>
              <p className="text-gray-600">En la página del evento, usa el botón "Escanear QR" o busca manualmente a los asistentes.</p>
            </div>

            <div className="bg-white border rounded-3xl p-8">
              <div className="text-4xl mb-4">4️⃣</div>
              <h3 className="font-semibold text-xl mb-3">Descarga reportes</h3>
              <p className="text-gray-600">En cualquier momento puedes descargar Excel o PDF con la lista de asistentes y estadísticas.</p>
            </div>
          </div>
        </div>

        {/* Preguntas frecuentes */}
        <div>
          <h2 className="text-3xl font-semibold mb-8">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            <div className="bg-white border rounded-3xl p-8">
              <h3 className="font-semibold mb-2">¿Cómo activo un evento privado?</h3>
              <p className="text-gray-600">Envía tu comprobante de pago con el número de referencia del evento. Una vez verificado, lo activaremos.</p>
            </div>
            <div className="bg-white border rounded-3xl p-8">
              <h3 className="font-semibold mb-2">¿Cuántos eventos puedo crear?</h3>
              <p className="text-gray-600">Por ahora tienes un límite de 5 eventos activos. Puedes eliminar o archivar para crear más.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-8">
          <Link href="/eventos" className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 rounded-2xl text-lg font-medium hover:bg-gray-800">
            Ir a Mis Eventos
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
}