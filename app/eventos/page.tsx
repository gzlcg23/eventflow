// app/eventos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { format } from "date-fns";
import { Copy, Edit3, Trash2, ExternalLink, Scan, Lock, Download, Share2 } from "lucide-react";
import * as XLSX from 'xlsx';

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

  // ==================== EXPORTAR A EXCEL ====================
  const exportExcel = () => {
    if (events.length === 0) {
      alert("No hay eventos para exportar");
      return;
    }

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
  };

  const copyPublicLink = (slug: string) => {
    const link = `${window.location.origin}/evento/${slug}`;
    navigator.clipboard.writeText(link);
    alert("✅ Link público copiado");
  };

  const shareEvent = (event: any) => {
    const link = `${window.location.origin}/evento/${event.slug}`;
    const text = event.isPublic 
      ? `Únete a mi evento: ${event.name}\n${link}`
      : `Únete a mi evento privado: ${event.name}\nCódigo de acceso: ${event.accessCode}\n${link}`;

    if (navigator.share) {
      navigator.share({
        title: event.name,
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert("✅ Enlace copiado. Puedes pegarlo en WhatsApp, Instagram, etc.");
    }
  };

  const deleteEvent = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}"?\nEsta acción es irreversible.`)) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Evento eliminado");
        cargarEventos();
      } else {
        alert("No se pudo eliminar el evento");
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  if (loading) return <div className="p-12 text-center">Cargando eventos...</div>;

  // Separar eventos activos y finalizados
  const activeEvents = events.filter(e => e.isActive);
  const pastEvents = events.filter(e => !e.isActive);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Mis Eventos</h1>
        
        <div className="flex gap-3">
        {/*  <button
            onClick={exportExcel}
            className="flex items-center gap-3 bg-white border border-gray-300 text-black px-6 py-3 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            <Download size={20} />
            Descargar Excel
          </button>*/}

          <Link
            href="/eventos/nuevo"
            className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition flex items-center gap-2"
          >
            + Crear Nuevo Evento
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center">
          <h3 className="text-xl font-medium text-gray-400">Aún no tienes eventos</h3>
          <p className="text-gray-500 mt-2">Crea tu primer evento para comenzar</p>
        </div>
      ) : (
        <>
          {/* Eventos Activos */}
          {activeEvents.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-emerald-700">Eventos Activos ({activeEvents.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Eventos Activos */}
                {activeEvents.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 text-emerald-700">Eventos Activos ({activeEvents.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeEvents.map((event) => {
                        const eventDate = new Date(event.date);
                        const isPast = eventDate < new Date();   // Ya pasó la fecha

                        return (
                          <div key={event.id} className="bg-white border rounded-3xl p-6 hover:shadow-lg transition group">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <Link href={`/evento/${event.slug}`} className="font-semibold text-xl mb-1 hover:text-emerald-600 transition cursor-pointer">
                                  {event.name}
                                </Link>
                                <p className="text-sm font-mono text-gray-500">{event.eventNumber}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {!event.isPublic && <Lock className="w-5 h-5 text-blue-600" />}
                                <span className="text-xs px-3 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">Activo</span>
                              </div>
                            </div>

                            <p className="text-gray-500 text-sm mb-4">{event.location}</p>
                            <p className="text-sm text-gray-400">
                              {format(eventDate, "dd MMM yyyy - HH:mm")}
                            </p>

                            <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                              {/* Check-in siempre activo si el evento está pagado */}
                              <Link href={`/checkin/${event.slug}`} className="flex items-center justify-center w-10 h-10 text-emerald-600 hover:bg-emerald-50 rounded-xl transition" title="Check-in">
                                <Scan size={20} />
                              </Link>

                              {/* Copiar y Compartir solo si NO ha pasado la fecha */}
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

                              {/* ExternalLink comentado */}
                              {/* <Link href={`/evento/${event.slug}`} className="flex items-center justify-center w-10 h-10 text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Ver página pública">
                                <ExternalLink size={20} />
                              </Link> */}

                              {/* Editar y Eliminar siempre visibles */}
                              <Link href={`/eventos/editar/${event.id}`} className="flex items-center justify-center w-10 h-10 text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Editar">
                                <Edit3 size={20} />
                              </Link>

                              <button onClick={() => deleteEvent(event.id, event.name)} className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-xl transition" title="Eliminar">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Eventos Finalizados / Inactivos */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-500">Eventos Finalizados ({pastEvents.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {/* Eventos Inactivos / Finalizados */}
                {pastEvents.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6 text-gray-500">Eventos Finalizados / Inactivos ({pastEvents.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                      {pastEvents.map((event) => (
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
                          <p className="text-sm text-gray-400">
                            {format(new Date(event.date), "dd MMM yyyy - HH:mm")}
                          </p>

                          <div className="mt-6 pt-4 border-t flex flex-wrap gap-2">
                            {/* Solo Editar y Eliminar para inactivos */}
                            <Link href={`/eventos/editar/${event.id}`} className="flex items-center justify-center w-10 h-10 text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Editar">
                              <Edit3 size={20} />
                            </Link>

                            <button onClick={() => deleteEvent(event.id, event.name)} className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-xl transition" title="Eliminar">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}