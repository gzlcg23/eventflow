// app/eventos/nuevo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // 🌟 Integrado para notificaciones profesionales

export default function NuevoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(true);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      date: formData.get("date"),
      location: formData.get("location"),
      locationUrl: formData.get("locationUrl"),
      isPublic: isPublic,
      accessCode: formData.get("accessCode"),
    };

    // Mostramos estado de carga elegante
    const toastId = toast.loading("Guardando nuevo evento...");

    try {
      const response = await fetch('/api/eventos/nuevo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("¡Evento registrado en el sistema!", { id: toastId });
        setSuccessData(result.event);
      } else {
        toast.error(`Error: ${result.error}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Error de conexión. Inténtalo de nuevo más tarde.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== PANTALLA DE ÉXITO ====================
  if (successData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
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

  // ==================== FORMULARIO NORMAL CORREGIDO ====================
  return (
    // 🌟 Añadimos un contenedor padre con w-full y flex-1 para neutralizar el layout
    <div className="w-full flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      {/* 🌟 max-w-2xl mx-auto ahora funciona perfecto y w-full evita que flexbox lo comprima */}
      <div className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-sm w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Crear Nuevo Evento</h1>
        <p className="text-sm text-gray-500 mb-8">Completa los campos para registrar un nuevo evento en la plataforma.</p>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Nombre del Evento *</label>
            <input name="name" type="text" required className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Descripción</label>
            <textarea name="description" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Fecha y Hora *</label>
            <input name="date" type="datetime-local" required className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Ubicación</label>
            <input name="location" type="text" className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Link del Mapa (Opcional)</label>
            <input name="locationUrl" type="url" className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
          </div>

          {/* Tipo de Evento */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700">Tipo de Evento</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-800">
                <input 
                  type="radio" 
                  name="isPublic" 
                  value="true" 
                  checked={isPublic}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black accent-black"
                  onChange={() => setIsPublic(true)}
                />
                Público
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-800">
                <input 
                  type="radio" 
                  name="isPublic" 
                  value="false" 
                  checked={!isPublic}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black accent-black"
                  onChange={() => setIsPublic(false)}
                />
                Privado
              </label>
            </div>
          </div>

          {/* Campo Código de Acceso */}
          {!isPublic && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium mb-2 text-gray-700">Código de Acceso (mínimo 4 - máximo 12 caracteres)</label>
              <input 
                name="accessCode" 
                type="text" 
                required 
                minLength={4}
                maxLength={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl uppercase tracking-widest font-mono text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" 
                placeholder="EJEMPLO2026"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-4 rounded-2xl font-medium hover:bg-gray-800 transition disabled:opacity-70 mt-4 shadow-sm"
          >
            {isLoading ? "Creando evento..." : "Crear Evento"}
          </button>
        </form>
      </div>
    </div>
  );
}