// app/eventos/nuevo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from './actions';

export default function NuevoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await createEvent(formData);

    if (result.success) {
      setSuccessData(result.event);   // Guardamos el evento completo
    } else {
      alert("Error: " + result.error);
    }

    setIsLoading(false);
  };

  // Pantalla de éxito mejorada
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-10 text-center">
          <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-5xl">⚠️</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evento Creado</h1>
          <p className="text-xl font-semibold text-amber-600 mb-8">{successData.name}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 mb-8 text-left">
            <p className="text-amber-800 font-medium text-lg mb-4">Evento no activo</p>
            
            <p className="text-amber-700 mb-6 leading-relaxed">
              Este evento aún no ha sido activado.<br />
              No olvides mandar tu número de referencia del evento y tu nombre en el comprobante de pago.
            </p>
            
            <div className="bg-white rounded-xl p-5 border border-amber-200 text-center">
              <p className="text-sm text-gray-500 mb-1">Número de referencia:</p>
              <p className="font-mono text-3xl font-bold text-amber-900 tracking-widest">
                {successData.eventNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/eventos')}
              className="w-full bg-black text-white py-4 rounded-2xl font-medium hover:bg-gray-800 transition"
            >
              Ver Mis Eventos
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-gray-300 py-4 rounded-2xl font-medium hover:bg-gray-50 transition"
            >
              Crear Otro Evento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== FORMULARIO NORMAL ====================
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Crear Nuevo Evento</h1>

      <form action={handleSubmit} className="space-y-6">
        {/* Aquí va tu formulario actual */}
        <div>
          <label className="block text-sm font-medium mb-2">Nombre del Evento *</label>
          <input name="name" type="text" required className="w-full px-4 py-3 border rounded-2xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <textarea name="description" rows={3} className="w-full px-4 py-3 border rounded-2xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fecha y Hora *</label>
          <input name="date" type="datetime-local" required className="w-full px-4 py-3 border rounded-2xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ubicación</label>
          <input name="location" type="text" className="w-full px-4 py-3 border rounded-2xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link del Mapa (Opcional)</label>
          <input name="locationUrl" type="url" className="w-full px-4 py-3 border rounded-2xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Tipo de Evento</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="isPublic" value="true" defaultChecked />
              Público
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="isPublic" value="false" />
              Privado
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-4 rounded-2xl font-medium hover:bg-gray-800 transition disabled:opacity-70"
        >
          {isLoading ? "Creando evento..." : "Crear Evento"}
        </button>
      </form>
    </div>
  );
}