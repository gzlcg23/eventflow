// app/evento/[slug]/RegistroForm.tsx
'use client';

import { useState } from 'react';

export default function RegistroForm({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrCode, setQrCode] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("eventId", eventId);

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setQrCode(data.qrCodeDataUrl || "");
        setSuccess(true);
      } else {
        alert(data.error || "Error desconocido");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-green-600 mb-4">¡Registro Exitoso!</h2>
        {qrCode && (
          <div className="flex justify-center my-8">
            <img src={qrCode} alt="QR" className="border-8 border-white shadow-2xl rounded-2xl" />
          </div>
        )}
        <p className="text-gray-600">Guarda este código QR</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Nombre completo *</label>
        <input name="name" type="text" required className="w-full px-4 py-3 border rounded-xl" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Correo electrónico *</label>
        <input name="email" type="email" required className="w-full px-4 py-3 border rounded-xl" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Empresa</label>
        <input name="company" type="text" className="w-full px-4 py-3 border rounded-xl" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Teléfono</label>
        <input name="phone" type="tel" className="w-full px-4 py-3 border rounded-xl" />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {isLoading ? "Registrando..." : `Registrarme en ${eventName}`}
      </button>
    </form>
  );
}