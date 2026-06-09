// app/eventos/editar/[id]/EditEventForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditEventFormProps {
  event: any;
}

export default function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [error, setError] = useState("");

  // 🛡️ Evaluar el estado del evento para aplicar las restricciones de negocio
  const estaActivo = event.isActive || event.paymentStatus === "PAID";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estaActivo) return; // Protección extra en cliente

    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    // Solo enviamos isPublic si no está bloqueado por la activación previa
    formData.append("isPublic", isPublic.toString());

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Evento actualizado correctamente");
        router.push("/eventos");
        router.refresh();
      } else {
        setError(data.error || "Error al actualizar");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 🌟 BANNERS INFORMATIVOS DE POLÍTICAS DE USO */}
      {estaActivo ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-sm text-red-800">
          <p className="font-semibold">🛡️ Evento Confirmado y Bloqueado</p>
          <p className="text-xs text-red-700 mt-1">
            Este evento ya se encuentra activo y pagado. No es posible modificar ningún parámetro por cuestiones de cotización y términos del servicio contratado.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl text-sm text-amber-800">
          <p className="font-semibold">⚠️ Restricción de Cotización Activa</p>
          <p className="text-xs text-amber-700 mt-1">
            Las fechas, numero de registros y el tipo de privacidad del evento están congelados para mantener la integridad de tu presupuesto inicial. Solo puedes editar los datos de información logística.
          </p>
        </div>
      )}

      {/* Muestra errores del backend en pantalla si ocurren */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm font-medium">
          ❌ {error}
        </div>
      )}

      {/* CAMPO: Nombre (Editable solo antes de pagar) */}
      <div>
        <label className="block text-sm font-medium mb-2">Nombre del Evento *</label>
        <input 
          name="name" 
          defaultValue={event.name} 
          required 
          disabled={estaActivo}
          className="w-full px-4 py-3 border rounded-2xl bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" 
        />
      </div>

      {/* CAMPO: Descripción (Editable solo antes de pagar) */}
      <div>
        <label className="block text-sm font-medium mb-2">Descripción</label>
        <textarea 
          name="description" 
          defaultValue={event.description || ""} 
          rows={4} 
          disabled={estaActivo}
          className="w-full px-4 py-3 border rounded-2xl bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" 
        />
      </div>

      {/* 🌟 SECCIÓN DE FECHAS EN DOS COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ❌ CAMPO: Fecha y Hora de Inicio (INMUTABLE) */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-400">Fecha y Hora de Inicio (Inmutable)</label>
          <input 
            type="datetime-local" 
            disabled={true} 
            value={
              event.date 
                ? new Date(event.date).toISOString().slice(0, 16) 
                : ""
            } 
            className="w-full px-4 py-3 border rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed font-mono text-sm" 
          />
        </div>

        {/* ❌ CAMPO: Fecha y Hora de Finalización (INMUTABLE) */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-400">Fecha y Hora de Finalización (Inmutable)</label>
          <input 
            type="datetime-local" 
            disabled={true} 
            value={
              event.endDate 
                ? new Date(event.endDate).toISOString().slice(0, 16) 
                : ""
            } 
            className="w-full px-4 py-3 border rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed font-mono text-sm" 
          />
        </div>
      </div>

      {/* SECCIÓN DE DATOS DE UBICACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CAMPO: Ubicación (Editable solo antes de pagar) */}
        <div>
          <label className="block text-sm font-medium mb-2">Ubicación</label>
          <input 
            name="location" 
            defaultValue={event.location || ""} 
            disabled={estaActivo}
            className="w-full px-4 py-3 border rounded-2xl bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" 
          />
        </div>

        {/* CAMPO: URL de Maps (Editable solo antes de pagar) */}
        <div>
          <label className="block text-sm font-medium mb-2">Link de Google Maps</label>
          <input 
            name="locationUrl" 
            defaultValue={event.locationUrl || ""} 
            type="url" 
            disabled={estaActivo}
            className="w-full px-4 py-3 border rounded-2xl bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" 
          />
        </div>
      </div>

      {/* ❌ SECCIÓN: Tipo de Evento y Paquetes (INMUTABLES EN EDICIÓN) */}
      <div className="bg-gray-100 border rounded-3xl p-6 opacity-75">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-500">Configuración del Paquete e Integridad (Fijo)</label>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-mono font-bold">{event.tierId}</span>
        </div>
        
        <div className="flex gap-6 pointer-events-none">
          <label className="flex items-center gap-3 cursor-not-allowed">
            <input 
              type="radio" 
              checked={isPublic}
              readOnly
              className="w-5 h-5 accent-gray-400"
            />
            <div>
              <p className="font-medium text-gray-500">Público</p>
              <p className="text-xs text-gray-400">Capacidad: {event.capacity || "Ilimitada"}</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-not-allowed">
            <input 
              type="radio" 
              checked={!isPublic}
              readOnly
              className="w-5 h-5 accent-gray-400"
            />
            <div>
              <p className="font-medium text-gray-500">Privado</p>
              <p className="text-xs text-gray-400">Código de acceso vinculado</p>
            </div>
          </label>
        </div>

        {!isPublic && event.accessCode && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-400 mb-1">Código de Acceso Requerido</label>
            <p className="text-sm font-mono tracking-widest text-gray-600 bg-gray-200 inline-block px-3 py-1 rounded">
              {event.accessCode}
            </p>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 py-4 rounded-2xl font-medium hover:bg-gray-50 transition"
        >
          {estaActivo ? "Volver" : "Cancelar"}
        </button>

        {/* Ocultamos por completo el botón de guardar si el evento está activo */}
        {!estaActivo && (
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-70 transition"
          >
            {isLoading ? "Guardando cambios..." : "Guardar Cambios"}
          </button>
        )}
      </div>
    </form>
  );
}