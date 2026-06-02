// app/eventos/nuevo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from './actions';

export default function NuevoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);

    const result = await createEvent(formData);

    if (result.success) {
      setSuccessData(result.event);
    } else {
      alert("Error: " + result.error);
    }

    setIsLoading(false);
  };

  // Pantalla de éxito
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evento Creado con éxito</h1>
          <p className="text-xl font-semibold text-amber-600 mb-8">{successData.name}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 mb-8 text-left">
            <p className="text-amber-700 mb-6 leading-relaxed">
              Para que tu evento pueda ser activado no olvides mandar en tu comprobante de pago tu nombre completo y tu <b>número de referencia</b>:
            </p>
            
            <div className="bg-white rounded-xl p-5 border border-amber-200 text-center">
              <p className="text-sm text-gray-500 mb-1"># de referencia del evento:</p>
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

        {/* Tipo de Evento */}
        <div>
          <label className="block text-sm font-medium mb-3">Tipo de Evento</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="isPublic" 
                value="true" 
                checked={isPublic}
                onChange={() => setIsPublic(true)}
              />
              Público
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="isPublic" 
                value="false" 
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
              />
              Privado
            </label>
          </div>
        </div>

        {/* Campo Código de Acceso */}
        {!isPublic && (
          <div>
            <label className="block text-sm font-medium mb-2">Código de Acceso (mínimo 4 caracteres - máximo 12 caracteres)</label>
            <input 
              name="accessCode" 
              type="text" 
              required 
              minLength={4}
              maxLength={12}
              className="w-full px-4 py-3 border rounded-2xl uppercase tracking-widest" 
              placeholder="EJEMPLO2026"
            />
          </div>
        )}

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