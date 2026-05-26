// app/eventos/editar/[id]/EditEventForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EditEventFormProps {
  event: any;
}

export default function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
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
      } else {
        setError(data.error || "Error al actualizar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Nombre del Evento *</label>
        <input name="name" defaultValue={event.name} required className="w-full px-4 py-3 border rounded-2xl" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descripción</label>
        <textarea name="description" defaultValue={event.description || ""} rows={4} className="w-full px-4 py-3 border rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Fecha y Hora *</label>
          <input 
            name="date" 
            type="datetime-local" 
            defaultValue={
              event.date 
                ? new Date(event.date).toISOString().slice(0, 16) 
                : ""
            } 
            required 
            className="w-full px-4 py-3 border rounded-2xl" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ubicación</label>
          <input name="location" defaultValue={event.location || ""} className="w-full px-4 py-3 border rounded-2xl" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Link de Google Maps</label>
        <input name="locationUrl" defaultValue={event.locationUrl || ""} type="url" className="w-full px-4 py-3 border rounded-2xl" />
      </div>

      {/* Tipo de Evento */}
      <div className="bg-gray-50 border rounded-3xl p-6">
        <label className="block text-sm font-medium mb-3">Tipo de Evento</label>
        
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="radio" 
              name="isPublic" 
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="w-5 h-5 accent-black"
            />
            <div>
              <p className="font-medium">Público</p>
              <p className="text-sm text-gray-500">Cualquiera puede registrarse</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="radio" 
              name="isPublic" 
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="w-5 h-5 accent-black"
            />
            <div>
              <p className="font-medium">Privado</p>
              <p className="text-sm text-gray-500">Solo con código de acceso</p>
            </div>
          </label>
        </div>

        {!isPublic && (
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Código de Acceso</label>
            <input 
              name="accessCode" 
              defaultValue={event.accessCode || ""} 
              className="w-full px-4 py-3 border rounded-2xl uppercase tracking-widest" 
              placeholder="EJEMPLO2026"
            />
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
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-70"
        >
          {isLoading ? "Guardando cambios..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}