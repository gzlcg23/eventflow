// app/eventos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { format } from "date-fns";
import { Copy, Edit3, Eye, Trash2, ExternalLink, Scan, Lock, Download, Share2, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner"; // 🌟 1. IMPORTA TOAST AL INICIO

export default function EventosPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarEventos = async () => {
    try {
      const res = await fetch('/api/events', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== EXPORTAR A EXCEL ===================
  const exportExcel = () => {
    if (events.length === 0) {
      toast.warning("No hay eventos disponibles para exportar"); // 🌟 Cambiado
      return;
    }
try {
    const data = events.map(event => ({
      "Número": event.eventNumber || '',
      "Evento": event.name,
      "Fecha": event.date ? format(new Date(event.date), "dd/MM/yyyy") : '',
      "Ubicación": event.location || '',
      "Tipo": event.isPublic ? "Público" : "Privado",
      "Estado": event.isActive ? "Activo" : "Inactivo",
      "Activado": event.activatedAt ? format(new Date(event.activatedAt), "dd/MM/yyyy HH:mm") : 'No activado',
      "Razón Desactivación": event.deactivationReason || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mis Eventos");

    XLSX.writeFile(wb, `Mis_Eventos_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
      
      toast.success("📊 Excel descargado con éxito"); // 🌟 Cambiado
    } catch (err) {
      toast.error("No se pudo generar el archivo de Excel");
    }
  };

  const copyPublicLink = (slug: string) => {
    const link = `${window.location.origin}/evento/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("🔗 Enlace público copiado al portapapeles"); // 🌟 Cambiado
  };

const shareEvent = (event: any) => {
  // 1. Construimos la URL del evento
  const link = `${window.location.origin}/evento/${event.slug}`;
  
  // 2. Quitamos el link del final para que el celular no lo duplique nativamente
  const textParaCelular = event.isPublic 
    ? `Regístrate en el siguiente enlace:`
    : `Evento privado: ${event.name}\n🔑 Código de acceso obligatorio: ${event.accessCode}\n\nRegístrate aquí:`;

  // 3. Para computadoras (Portapapeles), sí estructuramos el link abajo de forma limpia
  const textParaPortapapeles = event.isPublic
    ? `Regístrate aquí:\n${link}`
    : `Evento privado: ${event.name}\n🔑 Código de acceso: ${event.accessCode}\n\nRegístrate aquí:\n${link}`;

  if (navigator.share) {
    // En móviles, el sistema operativo pega el 'link' elegantemente al final del 'text'
    navigator.share({
      title: event.name,
      text: textParaCelular, 
      url: link, // 👈 El celular maneja esto de forma nativa y limpia
    }).catch((err) => console.log("Error al compartir:", err));
  } else {
    // En PC se copia el texto estructurado directo al portapapeles
    navigator.clipboard.writeText(textParaPortapapeles);
    toast.info("✅ Enlace de invitación copiado. ¡Ya puedes pegarlo en tus chats!");
  }
};

  const deleteEvent = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}"?\nEsta acción es irreversible.`)) return;

    const toastId = toast.loading("Eliminando evento..."); // 🌟 Notificación de carga asíncrona

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Evento eliminado correctamente", { id: toastId }); // 🌟 Éxito
        cargarEventos();
      } else {
        toast.error("No tienes permisos o no se pudo eliminar este evento", { id: toastId }); // 🌟 Fallo
      }
    } catch (error) {
      toast.error("Error de red. Revisa tu conexión a internet", { id: toastId });
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  if (loading) return <div className="p-12 text-center">Cargando eventos...</div>;

  // Separar eventos activos y finalizados
  // 🌟 CORRECCIÓN TÉCNICA: Filtramos para ignorar los eventos archivados por el Cron Job o el sistema
  const activeEvents = events.filter(e => e.isActive && !e.archived);
  const pastEvents = events.filter(e => !e.isActive && !e.archived);

  return (
    <div className="p-8 max-w-7xl mx-auto">
  <div className="flex justify-between items-center mb-8">
    <h1 className="text-3xl md:text-4xl font-bold">Mis Eventos</h1>
    
    <div className="flex gap-3">
     {/* <button
        onClick={exportExcel}
        className="hidden md:flex items-center gap-3 bg-white border border-gray-300 text-black px-6 py-3 rounded-xl hover:bg-gray-50 transition font-medium"
      >
        <Download size={20} />
        Descargar Excel
      </button>*/}

      <Link
        href="/eventos/nuevo"
        className="bg-black text-white px-5 py-3 md:px-6 md:py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
      >
        <span className="hidden md:inline">+</span>
        <span className="md:hidden text-2xl leading-none">+</span>
        <span className="hidden md:inline">Crear Evento</span>
      </Link>
    </div>
  </div>

  {events.length === 0 ? (
    <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center relative">
      <h3 className="text-xl font-medium text-gray-400 mb-3">Aún no tienes eventos</h3>
      <p className="text-gray-500 mb-8">
        Crea tu primer evento dando clic en el botón <span className="font-semibold text-black">+</span> de arriba
      </p>

      {/* Animación sutil */}
      <div className="flex justify-center">
        <div className="animate-bounce text-4xl text-emerald-500">↑</div>
      </div>
    </div>
  ) : (
        <>

{/* Eventos Activos */}
{activeEvents.length > 0 && (
  <div className="mb-12">
    <h2 className="text-2xl font-semibold mb-6 text-emerald-700">Eventos Activos ({activeEvents.length})</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeEvents.map((event) => {
        // 🌟 EVALUACIÓN DE EXPIRACIÓN AL MINUTO EXACTO (Evita errores con nulos)
                  const fechaExactaFin = event.endDate 
                    ? new Date(event.endDate) 
                    : (() => {
                        const limite = new Date(event.date);
                        limite.setDate(limite.getDate() + 1); // Día de gracia para nulos viejos
                        return limite;
                      })();

                  const isPast = fechaExactaFin < new Date();
                  
                  const daysSinceEnd = isPast ? Math.floor((new Date().getTime() - fechaExactaFin.getTime()) / (1000 * 3600 * 24)) : 0;
                  const daysLeft = Math.max(60 - daysSinceEnd, 0);
        
        // 🌟 CONSTANTES PARA MOSTRAR INICIO Y FIN POR SEPARADO:
        

        const fechaInicioFormateada = format(new Date(event.date), "dd MMM yyyy - HH:mm");
    const fechaFinFormateada = event.endDate ? format(new Date(event.endDate), "dd MMM yyyy - HH:mm") : null;

  

        return (
          <div key={event.id} className="bg-white border rounded-3xl p-6 hover:shadow-lg transition group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Link href={`/checkin/${event.slug}`} className="font-semibold text-xl mb-1 hover:text-emerald-600 transition cursor-pointer">
                  {event.name}
                </Link>
                <p className="text-sm font-mono text-gray-500">{event.eventNumber}</p>
              </div>

              <div className="flex items-center gap-2">
                {!event.isPublic && <Lock className="w-5 h-5 text-blue-600" />}
                
                {isPast && (
  <div className="flex items-center gap-2">
    <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">Finalizado</span>
    
    {/* Tooltip mejorado para móviles */}
    <div className="relative">
      <button 
        onClick={() => {
          const tooltip = document.getElementById(`tooltip-${event.id}`);
          if (tooltip) tooltip.classList.toggle('hidden');
        }}
        className="text-amber-500 hover:text-amber-600"
      >
        <AlertCircle size={20} />
      </button>
      
      {/* Tooltip */}
      <div id={`tooltip-${event.id}`} className="hidden absolute bg-gray-900 text-white text-xs rounded-lg px-4 py-3 w-72 -top-2 right-8 z-10">
        Este evento ya finalizó.<br />
        Cuentas con <strong>{daysLeft} días</strong> para descargar la información de tu evento
        antes de que se archive automáticamente.
      </div>
    </div>
  </div>
)}
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">{event.location}</p>

<div className="space-y-1">
                        <p className={`text-sm font-medium ${isPast ? 'text-red-600' : 'text-gray-400'}`}>
                          <span>Inicio: {fechaInicioFormateada}</span>
                          {isPast && " • Finalizado"}
                        </p>

                        {fechaFinFormateada && (
                          <p className={`text-sm font-medium ${isPast ? 'text-red-600' : 'text-gray-400'}`}>
                            <span>Fin: {fechaFinFormateada}</span>
                          </p>
                        )}
                      </div>

            <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
              {/* Check-in siempre visible si está activo */}
              <Link href={`/checkin/${event.slug}`} className="flex items-center justify-center w-10 h-10 text-emerald-600 hover:bg-emerald-50 rounded-xl transition" title="Check-in">
                <Scan size={20} />
              </Link>

              {/* Copiar y Compartir solo si la fecha NO ha pasado */}
              {!isPast && (
                <>
                  <button onClick={() => copyPublicLink(event.slug)} className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-xl transition" title="Copiar link">
                    <Copy size={20} />
                  </button>

                  <button onClick={() => shareEvent(event)} className="flex items-center justify-center w-10 h-10 text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Compartir">
                    <Share2 size={20} />
                  </button>
                </>
              )}

              {/* Editar y Eliminar solo si la fecha NO ha pasado */}
              {!isPast && (
                <>
                  <Link 
                    href={`/eventos/editar/${event.id}`} 
                    className="flex items-center justify-center w-10 h-10 text-zinc-700 hover:bg-zinc-200 rounded-xl transition" 
                    title="Ver Resumen de Configuración"
                  >
                    <Eye size={20} />
                  </Link>

                  <button onClick={() => deleteEvent(event.id, event.name)} className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-xl transition" title="Eliminar">
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
             

          {/* Eventos Finalizados / Inactivos */}
 {/* Eventos Inactivos / Finalizados */}
{pastEvents.length > 0 && (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-gray-500">Eventos Inactivos ({pastEvents.length})</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
      
      {/* 🌟 1. Cambiamos el inicio del map abriendo llaves { */}
      {pastEvents.map((event) => {
        
        // 🌟 2. Declaramos las constantes que hacían falta aquí dentro
        const fechaInicioFormateada = format(new Date(event.date), "dd MMM yyyy - HH:mm");
        const fechaFinFormateada = event.endDate ? format(new Date(event.endDate), "dd MMM yyyy - HH:mm") : null;

        // 🌟 3. Abrimos el return explícito obligatorio para que funcione
        return (
          <div key={event.id} className="bg-white border rounded-3xl p-6 hover:shadow-lg transition group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-xl mb-1 text-gray-400 cursor-default">
                  {event.name}
                </h3>
                <p className="text-sm font-mono text-gray-500">{event.eventNumber}</p>
              </div>

              <div className="flex items-center gap-2">
                {!event.isPublic && <Lock className="w-5 h-5 text-blue-600" />}
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-100 text-red-700">Inactivo</span>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">{event.location}</p>

            <div className="space-y-1">
              {/* Fecha de Inicio */}
              <p className="text-sm text-gray-400">
                Inicio: {fechaInicioFormateada}
              </p>

              {/* Fecha de Fin (Solo si existe en la base de datos) */}
              {fechaFinFormateada && (
                <p className="text-sm text-gray-400">
                Fin: {fechaFinFormateada}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
              {/* Solo Editar y Eliminar para inactivos/finalizados */}
              <Link href={`/eventos/editar/${event.id}`} className="flex items-center justify-center w-10 h-10 text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Editar">
                <Edit3 size={20} />
              </Link>

              <button onClick={() => deleteEvent(event.id, event.name)} className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-xl transition" title="Eliminar">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ); // 🌟 Cerramos el return con paréntesis y punto y coma
      })} {/* 🌟 Cerramos el .map() con la llave y el paréntesis correspondiente */}

    </div>
  </div>
)}
        </>
      )}
    </div>
  );
}