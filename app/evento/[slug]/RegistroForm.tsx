// app/evento/[slug]/RegistroForm.tsx 
'use client';

import { useState } from 'react';
// 🌟 Importamos el componente de teléfono internacional y sus estilos de banderas
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function RegistroForm({ 
  eventId, 
  eventName, 
  isPublic, 
  accessCode 
}: { 
  eventId: string; 
  eventName: string; 
  isPublic: boolean;
  accessCode?: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [qrNumber, setQrNumber] = useState("");
  const [eventData, setEventData] = useState<any>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(isPublic);
  const [errorMsg, setErrorMsg] = useState("");

  // 🌟 Estado controlado por el componente internacional (Ej: "+525512345678")
  const [phoneValue, setPhoneValue] = useState<string | undefined>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(""); 

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      eventId: eventId,
      name: formData.get("name")?.toString().trim(),
      email: formData.get("email")?.toString().trim().toLowerCase(),
      company: formData.get("company")?.toString().trim() || null,
      // 🌟 Enviamos la cadena con formato internacional limpio (+LADA...) o null si está vacío
      phone: phoneValue ? phoneValue.trim() : null,
    };

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setQrCode(data.qrCodeDataUrl);
        setAttendeeName(data.attendee.name);
        setQrNumber(data.attendee.qrCode);
        setEventData(data.event);
        setSuccess(true);
      } else {
        console.log("❌ Error devuelto por la API:", data);
        setErrorMsg(data.error || "Ocurrió un error al registrarse");
      }
    } catch (error) {
      console.error("❌ Error de red/conexión:", error);
      setErrorMsg("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAccessCode = () => {
    if (enteredCode.trim().toUpperCase() === accessCode?.toUpperCase()) {
      setCodeVerified(true);
    } else {
      alert("Código de acceso incorrecto");
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `QR-${attendeeName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isPublic && !codeVerified) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-6">Evento Privado</h2>
        <p className="text-gray-600 mb-8">Ingresa el código de acceso para registrarte</p>
        <input
          type="text"
          value={enteredCode}
          onChange={(e) => setEnteredCode(e.target.value)}
          placeholder="CÓDIGO DE ACCESO"
          className="w-full max-w-xs mx-auto text-center text-xl tracking-widest uppercase border-2 border-gray-300 focus:border-black rounded-2xl px-6 py-4 mb-6"
        />
        <button
          onClick={verifyAccessCode}
          className="bg-black text-white px-10 py-3.5 rounded-2xl text-lg font-medium hover:bg-gray-800"
        >
          Verificar Código
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center max-w-md mx-auto">
        <p className="text-xs text-gray-400 text-right mb-6">
          Registrado el {new Date().toLocaleDateString('es-MX')}
        </p>

        <p className="text-2xl font-medium text-emerald-600 mb-6">¡Registro Exitoso!</p>
        <p className="text-2xl text-gray-800 mb-10">Gracias, <strong>{attendeeName}</strong></p>

        <div className="flex justify-center mx-auto mb-5 w-72 h-72">
          <img src={qrCode} alt="QR" className="rounded-3xl shadow-2xl border-8 border-white" />
        </div>

        <div className="mb-8">
          <p className="font-mono text-[15px] tracking-widest text-gray-700 uppercase">
            {qrNumber}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-10 text-left">
          <p className="font-medium text-gray-700 mb-4">Detalles del Evento:</p>
          <div className="flex items-center gap-4 flex-wrap">
            {eventData?.location && <span>📍 {eventData.location}</span>}
            {eventData?.locationUrl && (
              <a href={eventData.locationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Ver en Google Maps →
              </a>
            )}
          </div>
          {eventData?.date && (
            <p className="text-gray-600 mt-4 font-medium">
              {new Date(eventData.date).toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </div>

        <button onClick={downloadQR} className="bg-black text-white w-full py-4 rounded-2xl text-lg font-medium hover:bg-gray-800">
          📥 Descargar QR
        </button>

        <p className="text-sm text-gray-500 mt-8">
          Te hemos enviado una copia a tu correo electrónico.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Nombre completo *</label>
        <input 
          name="name" 
          type="text" 
          required 
          placeholder="Ej. Juan Pérez"
          className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-black" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Correo electrónico *</label>
        <input 
          name="email" 
          type="email" 
          required 
          placeholder="juan@empresa.com"
          className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-black" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Empresa</label>
          <input 
            name="company" 
            type="text" 
            placeholder="Opcional"
            className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:border-black" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Teléfono móvil</label>
          {/* 🌟 Campo internacional con selector e inyección directa de clases */}
          <PhoneInput
            international
            defaultCountry="MX"
            placeholder="Número de celular"
            value={phoneValue}
            onChange={setPhoneValue}
            className="flex w-full px-4 py-1.5 border rounded-2xl bg-white focus-within:border-black phone-input-container"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-200">
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-2xl text-lg font-medium transition disabled:opacity-70"
      >
        {isLoading ? "Procesando..." : `Registrarme en ${eventName}`}
      </button>
    </form>
  );
}