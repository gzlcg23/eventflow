// app/eventos/nuevo/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PRICING_TIERS, MULTI_DAY_MULTIPLIER } from '@/config/pricing';

export default function NuevoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(true);

  // 🌟 NUEVOS ESTADOS PARA EL MODELO MODULAR
  const [tierId, setTierId] = useState('MICRO');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState(0);

  // 🌟 EFECTO PARA CALCULAR EL COSTO DINÁMICAMENTE EN EL CLIENTE
  useEffect(() => {
    const tier = PRICING_TIERS[tierId];
    if (!tier) return;

    let total = tier.priceMXN;

    if (isMultiDay && startDate && endDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(0, 0, 0, 0);
      
      if (end > start) {
        const differenceInTime = end - start;
        const totalDays = Math.ceil(differenceInTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (totalDays > 1) {
          const extraDays = totalDays - 1;
          total = total + (total * MULTI_DAY_MULTIPLIER * extraDays);
        }
      }
    }

    setCalculatedCost(Math.round(total));
  }, [tierId, startDate, endDate, isMultiDay]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Validamos que si es multidía, tenga una fecha de fin válida
    if (isMultiDay && (!endDate || new Date(endDate) <= new Date(startDate))) {
      toast.error("Por favor, selecciona una fecha de finalización válida posterior al inicio.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      date: startDate,
      endDate: isMultiDay ? endDate : null,
      location: formData.get("location"),
      locationUrl: formData.get("locationUrl"),
      isPublic: isPublic,
      accessCode: formData.get("accessCode"),
      // 🌟 MANDAMOS EL CONTENIDO DE INFRAESTRUCTURA Y PRECIOS AL BACKEND
      tierId: tierId,
      capacity: PRICING_TIERS[tierId].maxAttendees,
      paymentAmount: calculatedCost,
    };

    const toastId = toast.loading("Guardando nuevo evento...");

    try {
      const response = await fetch('/api/eventos/nuevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <p className="text-xl font-semibold text-amber-600 mb-6">{successData.name}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-left">
            <p className="text-amber-700 text-sm mb-4 leading-relaxed">
              Tu evento se encuentra en estado <b>PENDIENTE DE ACTIVACIÓN</b>. Para darlo de alta, por favor transfiere el monto correspondiente enviando tu comprobante con el siguiente identificador único:
            </p>
            
            <div className="bg-white rounded-xl p-4 border border-amber-200 text-center mb-4">
              <p className="text-xs text-gray-500 mb-1">Monto a Transferir:</p>
              <p className="text-2xl font-black text-gray-900">
                ${Number(successData.paymentAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-amber-200 text-center">
              <p className="text-xs text-gray-500 mb-1"># de referencia del evento:</p>
              <p className="font-mono text-2xl font-bold text-amber-900 tracking-widest">
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

  // ==================== FORMULARIO NORMAL CON ADD-ONS ====================
  return (
    <div className="w-full flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
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

          {/* Gestión Dinámica de Fechas (Multidía) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Fecha de Inicio *</label>
              <input 
                type="datetime-local" 
                required 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" 
              />
            </div>
            
            {isMultiDay && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-sm font-medium mb-2 text-gray-700">Fecha de Finalización *</label>
                <input 
                  type="datetime-local" 
                  required={isMultiDay}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" 
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="isMultiDay"
              checked={isMultiDay}
              onChange={(e) => setIsMultiDay(e.target.checked)}
              className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black accent-black cursor-pointer"
            />
            <label htmlFor="isMultiDay" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Este evento dura más de 1 día (Aplica cargos multidía)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Ubicación</label>
              <input name="location" type="text" className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Link del Mapa (Opcional)</label>
              <input name="locationUrl" type="url" className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition" />
            </div>
          </div>

          {/* Tipo de Evento (Público/Privado) */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700">Privacidad del Evento</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-800">
                <input type="radio" checked={isPublic} className="accent-black w-4 h-4" onChange={() => setIsPublic(true)} />
                Público
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-800">
                <input type="radio" checked={!isPublic} className="accent-black w-4 h-4" onChange={() => setIsPublic(false)} />
                Privado
              </label>
            </div>
          </div>

          {!isPublic && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium mb-2 text-gray-700">Código de Acceso</label>
              <input name="accessCode" type="text" required minLength={4} maxLength={12} className="w-full px-4 py-3 border border-gray-200 rounded-2xl uppercase tracking-widest font-mono text-center text-lg bg-gray-50 focus:outline-none" placeholder="EJEMPLO2026" />
            </div>
          )}

          <hr className="border-gray-100 my-6" />

          {/* 🌟 SECCIÓN MODULAR: SELECCIÓN DEL PLAN CON CONTENEDOR TAILWIND MINIMALISTA */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-1">Capacidad de Asistentes Contratados</h3>
            <p className="text-xs text-gray-500 mb-4">Selecciona el límite de lugares que soportará el validador QR de tu evento.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(PRICING_TIERS).map((tier) => (
                <div 
                  key={tier.id}
                  onClick={() => setTierId(tier.id)}
                  className={`border-2 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition select-none text-center ${
                    tierId === tier.id 
                      ? 'border-black bg-white shadow-sm' 
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{tier.label.split(" ")[0]}</p>
                    <p className="text-lg font-extrabold text-gray-900">{tier.maxAttendees} Asistentes</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mt-3 bg-gray-100 rounded-lg py-1">
                    ${tier.priceMXN} MXN
                  </p>
                </div>
              ))}
            </div>

            {/* RESUMEN DE COMPRA EN VIVO */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Inversión Final de Infraestructura:</p>
                <p className="text-xs text-gray-500">Monto único por evento {isMultiDay ? '(Multidía)' : ''}</p>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                ${calculatedCost.toLocaleString('es-MX')} <span className="text-xs font-medium text-gray-500">MXN</span>
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-4 rounded-2xl font-medium hover:bg-gray-800 transition disabled:opacity-70 mt-4 shadow-sm"
          >
            {isLoading ? "Creando evento..." : "Crear Evento y Generar Ficha de Activación"}
          </button>
        </form>
      </div>
    </div>
  );
}