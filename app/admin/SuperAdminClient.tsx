// app/admin/SuperAdminClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { Check, X, Lock, Unlock, Search, Download } from 'lucide-react';
import { format, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COSTO_POR_EVENTO = 1500;

export default function SuperAdminClient({ events: initialEvents }: { events: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear'>('all');

  // Paginación
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de razón
  const [showModal, setShowModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  const filteredEvents = useMemo(() => {
    let result = [...initialEvents];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(event =>
        event.name.toLowerCase().includes(searchLower) ||
        `${event.user.firstName} ${event.user.lastName}`.toLowerCase().includes(searchLower) ||
        event.user.email.toLowerCase().includes(searchLower) ||
        (event.eventNumber && event.eventNumber.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(event => statusFilter === "active" ? event.isActive : !event.isActive);
    }

    const now = new Date();
    if (periodFilter !== 'all') {
      result = result.filter(event => {
        const eventDate = new Date(event.date);
        switch (periodFilter) {
          case 'today': return format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          case '7days': return differenceInDays(now, eventDate) <= 7;
          case '30days': return differenceInDays(now, eventDate) <= 30;
          case 'thisMonth': return eventDate >= startOfMonth(now) && eventDate <= endOfMonth(now);
          case 'thisYear': return eventDate >= startOfYear(now) && eventDate <= endOfYear(now);
          default: return true;
        }
      });
    }

    return result;
  }, [initialEvents, searchTerm, statusFilter, periodFilter]);

  // Paginación
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const currentEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeEvents = filteredEvents.filter(e => e.isActive);
  const totalIncome = activeEvents.length * COSTO_POR_EVENTO;

  // ==================== EXPORTAR EXCEL (.xlsx) ====================
  const exportExcel = () => {
    if (filteredEvents.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const data = filteredEvents.map(event => ({
      "Número": event.eventNumber || '',
      "Evento": event.name,
      "Organizador": `${event.user.firstName || ''} ${event.user.lastName || ''}`.trim(),
      "Email": event.user.email || '',
      "Fecha Evento": event.date ? format(new Date(event.date), "dd/MM/yyyy") : '',
      "Estado": event.isActive ? "Activo" : "Inactivo",
      "Activado": event.activatedAt ? format(new Date(event.activatedAt), "dd/MM/yyyy HH:mm") : '',
      "Razón Desactivación": event.deactivationReason || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eventos");

    XLSX.writeFile(wb, `Reporte_SuperAdmin_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
  };

  // ==================== EXPORTAR PDF ====================
  const exportFinancialPDF = () => {
    const { jsPDF } = require('jspdf');
    const autoTable = require('jspdf-autotable');

    const doc = new jsPDF();
    const today = new Date();

    doc.setFontSize(22);
    doc.text("REPORTE FINANCIERO - EVENTFLOW", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generado el ${format(today, "dd 'de' MMMM yyyy 'a las' HH:mm")}`, 14, 28);

    doc.setFontSize(14);
    doc.text("Resumen General", 14, 45);

    doc.setFontSize(11);
    doc.text(`Eventos Mostrados: ${filteredEvents.length}`, 20, 55);
    doc.text(`Eventos Activados: ${activeEvents.length}`, 20, 63);

    const tableData = filteredEvents.map(event => [
      event.eventNumber || '—',
      event.name,
      `${event.user.firstName || ''} ${event.user.lastName || ''}`.trim() || 'Sin nombre',
      format(new Date(event.date), "dd/MM/yyyy"),
      event.isActive ? `$${COSTO_POR_EVENTO}` : '—',
      event.activatedAt ? format(new Date(event.activatedAt), "dd/MM/yyyy HH:mm") : '—',
      event.deactivationReason || '—'
    ]);

    autoTable.default(doc, {
      head: [['Número', 'Evento', 'Organizador', 'Fecha Evento', 'Monto', 'Activado', 'Razón Desactivación']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: { 6: { cellWidth: 55 } }
    });

    doc.save(`Reporte_Financiero_${format(today, "yyyy-MM-dd")}.pdf`);
  };

  const handleDeactivate = (eventId: string) => {
    setSelectedEventId(eventId);
    setDeactivationReason("");
    setShowModal(true);
  };

  const confirmDeactivation = async () => {
    if (!selectedEventId || !deactivationReason.trim()) {
      alert("Debes escribir una razón para desactivar el evento");
      return;
    }

    const res = await fetch('/api/admin/toggle-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        eventId: selectedEventId, 
        isActive: false,
        deactivationReason: deactivationReason.trim()
      }),
    });

    if (res.ok) {
      setShowModal(false);
      setDeactivationReason("");
      setSelectedEventId(null);
      window.location.reload();
    } else {
      alert("Error al desactivar el evento");
    }
  };

  const toggleActive = async (eventId: string, currentStatus: boolean) => {
    if (currentStatus) {
      handleDeactivate(eventId);
    } else {
      if (!confirm("¿Estás seguro de ACTIVAR este evento?")) return;

      const res = await fetch('/api/admin/toggle-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, isActive: true }),
      });

      if (res.ok) window.location.reload();
      else alert("Error al activar el evento");
    }
  };
// ==================== FUNCIÓN NUEVA: DESCARGAR ZIP ====================
  const downloadArchive = async (eventId: string, eventName: string) => {
    if (!confirm(`¿Descargar archivo completo de "${eventName}" antes de archivar?`)) return;

    try {
      const res = await fetch(`/api/admin/archive/${eventId}`);
      const data = await res.json();

      if (data.success) {
        const link = document.createElement('a');
        link.href = data.zipUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("✅ Archivo ZIP descargado correctamente.");
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error al descargar el archivo");
    }
  };
  // ===================================================================
  return (
    <div className="space-y-8">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-2">Desactivar Evento</h3>
            <p className="text-gray-600 mb-6">Por favor indica la razón por la que se desactiva este evento:</p>
            
            <textarea
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder="Escribe aquí la razón (obligatorio)..."
              className="w-full h-32 border rounded-2xl p-4 focus:outline-none focus:border-red-500 resize-y"
            />

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 border rounded-2xl hover:bg-gray-50 font-medium">
                Cancelar
              </button>
              <button
                onClick={confirmDeactivation}
                disabled={!deactivationReason.trim()}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Confirmar Desactivación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reporte Financiero */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold">Reporte Financiero</h2>
            <p className="text-emerald-100 mt-2">Resumen de ingresos generados</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportFinancialPDF} 
              className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-2xl hover:bg-gray-100 transition font-medium"
            >
              <Download size={20} /> PDF
            </button>
            <button 
              onClick={exportExcel} 
              className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition font-medium"
            >
              <Download size={20} /> Excel (.xlsx)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div>
            <p className="text-emerald-100 text-sm">Eventos Activados</p>
            <p className="text-5xl font-bold mt-2">{activeEvents.length}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-sm">Ingreso Total</p>
            <p className="text-5xl font-bold mt-2">${totalIncome.toLocaleString('es-MX')}</p>
          </div>
          <div>
            <p className="text-emerald-200 text-sm">Costo por Evento</p>
            <p className="text-4xl font-bold mt-2">${COSTO_POR_EVENTO}</p>
          </div>
          <div>
            <p className="text-emerald-200 text-sm">Tasa de Activación</p>
            <p className="text-5xl font-bold mt-2">
              {initialEvents.length > 0 ? Math.round((activeEvents.length / initialEvents.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Filtros por Período */}
      <div className="bg-white rounded-3xl shadow border p-6">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="font-medium text-gray-700">Filtrar por fecha del evento:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todo' },
              { value: 'today', label: 'Hoy' },
              { value: '7days', label: 'Últimos 7 días' },
              { value: '30days', label: 'Últimos 30 días' },
              { value: 'thisMonth', label: 'Este mes' },
              { value: 'thisYear', label: 'Este año' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setPeriodFilter(item.value as any)}
                className={`px-5 py-2.5 rounded-2xl text-sm transition ${
                  periodFilter === item.value 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Eventos con Paginación */}
      <div className="bg-white rounded-3xl shadow border overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Todos los Eventos ({filteredEvents.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-6 font-medium">Evento</th>
                <th className="text-left p-6 font-medium">Organizador</th>
                <th className="text-left p-6 font-medium">Número</th>
                <th className="text-left p-6 font-medium">Fecha Evento</th>
                <th className="text-left p-6 font-medium">Tipo</th>
                <th className="text-left p-6 font-medium">Estado</th>
                <th className="text-left p-6 font-medium">Activado</th>
                <th className="text-left p-6 font-medium w-32">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentEvents.map((event) => {
                const eventDate = new Date(event.date);
                const daysToEvent = differenceInDays(eventDate, new Date());
                const isOverdue = !event.isActive && daysToEvent < 0;

                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition">
                    <td className="p-6 font-medium">{event.name}</td>
                    <td className="p-6">
                      {event.user.firstName} {event.user.lastName}
                      <div className="text-xs text-gray-500">{event.user.email}</div>
                    </td>
                    <td className="p-6 font-mono text-gray-600">{event.eventNumber}</td>
                    <td className="p-6 text-gray-600">
                      {format(eventDate, "dd MMM yyyy")}
                    </td>
                    <td className="p-6">
                      {event.isPublic ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
                    </td>
                    <td className="p-6">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${event.isActive ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-yellow-500'}`}>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </td>
                    <td className="p-6 text-xs text-gray-500">
                      {event.activatedAt ? format(new Date(event.activatedAt), "dd/MM/yyyy HH:mm") : '—'}
                    </td>
                    <td className="p-6">
                      <div className="flex gap-2">
                        {/* Botón Descargar ZIP */}
                      <button
                        onClick={() => downloadArchive(event.id, event.name)}
                        className="flex items-center justify-center w-9 h-9 text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="Descargar archivo completo antes de archivar"
                      >
                        <Download size={20} />
                      </button>

                        {/* Botón ON/OFF */}
                        <button
                          onClick={() => toggleActive(event.id, event.isActive)}
                          className={`px-5 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 transition min-w-[90px] justify-center ${
                            event.isActive 
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' 
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                        >
                          {event.isActive ? (
                            <span className="font-semibold">ON</span>
                          ) : (
                            <span className="font-semibold">OFF</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEvents.length)} de {filteredEvents.length} eventos
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    currentPage === page 
                      ? 'bg-black text-white' 
                      : 'border hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}