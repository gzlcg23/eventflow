// app/admin/SuperAdminClient.tsx
'use client';

import { useState, useMemo, useEffect } from 'react'; // 🌟 Asegúrate de tener useEffect aquí
import { Check, X, Lock, Unlock, Search, Download, Trash2 } from 'lucide-react';
import { format, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COSTO_POR_EVENTO = 1500;

export default function SuperAdminClient({ events: initialEvents }: { events: any[] }) {
  // 🌟 EL ESTADO DE HYDRATION VA AQUÍ ABAJO
  const [mounted, setMounted] = useState(false);

  // Tus estados actuales (Limpios, sin nada de "className" colado entre ellos):
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear'>('all');

  // Paginación
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de razón
  const [showModal, setShowModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // 🌟 EL EFECTO QUE CAMBIA EL ESTADO AL MONTAR:
  useEffect(() => {
    setMounted(true);
  }, []);

// ==================== FILTRADO DE EVENTOS OPTIMIZADO ====================
  const filteredEvents = useMemo(() => {
    let result = [...initialEvents];

    // 1. Filtro por Buscador (Texto)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(event =>
        event.name.toLowerCase().includes(searchLower) ||
        `${event.user?.firstName} ${event.user?.lastName}`.toLowerCase().includes(searchLower) ||
        event.user?.email.toLowerCase().includes(searchLower) ||
        (event.eventNumber && event.eventNumber.toLowerCase().includes(searchLower))
      );
    }

    // 2. Filtro Estratégico por Estado (ON / OFF / Cron Archived)
    if (statusFilter === "active") {
      result = result.filter(e => e.isActive && !e.archived);
    } else if (statusFilter === "inactive") {
      result = result.filter(e => !e.isActive && !e.archived);
    } else if (statusFilter === "archived") {
      result = result.filter(e => e.archived);
    } else if (statusFilter === "all") {
      // 💡 CORRECCIÓN CLAVE: Cuando ven "Todos", ocultamos los archivados automáticos del cron
      result = result.filter(e => !e.archived);
    }

    // 3. Filtro por Periodo de Tiempo
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

 // ==================== EXPORTAR PDF (DISEÑO EDITORIAL MINIMALISTA) ====================
  const exportFinancialPDF = () => {
    // 🌟 Usamos las instancias importadas estáticamente al inicio del archivo para Next.js
    const doc = new jsPDF('p', 'mm', 'a4');
    const today = new Date();

    // --- CONFIGURACIÓN DE COLORES DE MARCA ---
    const primaryColor = [26, 32, 44];   // Charcoal (#1a202c)
    const mutedColor = [113, 128, 150];  // Slate Grey (#718096)
    const lightBg = [247, 250, 252];     // Soft Grey (#f7fafc)
    const successColor = [4, 116, 129];  // Deep Teal para Relieve Financiero Neta

    // --- ENCABEZADO EDITORIAL ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text("EventFlow", 16, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text("Internal Administration & Corporate Operations", 16, 29);

    // Meta-datos a la derecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("REPORTE FINANCIERO EJECUTIVO", 194, 20, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Corte: ${format(today, "dd/MM/yyyy HH:mm")}`, 194, 25, { align: "right" });

    // Línea divisoria brutalista
    doc.setDrawColor(26, 32, 44);
    doc.setLineWidth(0.6);
    doc.line(16, 34, 194, 34);

    // --- BLOQUE 1: RESUMEN OPERATIVO ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("01. RESUMEN OPERATIVO GENERAL", 16, 45);

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(16, 50, 178, 18, "F");

    const stats = [
      { value: `${filteredEvents.length}`, label: "Eventos Totales" },
      { value: `${activeEvents.length}`, label: "Eventos Activos" },
      { value: `${filteredEvents.length - activeEvents.length}`, label: "Eventos Inactivos" }
    ];

    stats.forEach((stat, index) => {
      const startX = 30 + (index * 58);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(stat.value, startX, 58);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(stat.label, startX, 63);
    });

// --- DICCIONARIO DE TARIFAS (Debe coincidir con tus PRICING_TIERS del frontend) ---
const PLANES_PRECIOS: Record<string, { precioBase: number; costoDiaExtra: number }> = {
  'TIER_BASIC':   { precioBase: 499,  costoDiaExtra: 150 }, // Ejemplo: Ajusta con tus precios reales
  'TIER_MEDIUM':  { precioBase: 899,  costoDiaExtra: 250 }, 
  'TIER_PREMIUM': { precioBase: 1499, costoDiaExtra: 400 }
};

// --- CÁLCULOS FINANCIEROS BIEN OPERADOS (DINÁMICO POR EVENTO) ---
// Iteramos sobre cada evento activo para sumar lo que realmente pagó el organizador
const totalIngresosSaaS = activeEvents.reduce((acumulado, evento) => {
  // Buscamos la tarifa del plan; si no existe, asignamos un plan base por seguridad
  const plan = PLANES_PRECIOS[evento.tierId] || { precioBase: 499, costoDiaExtra: 150 };
  
  let costoEvento = plan.precioBase;

  // Si el evento es multidía, calculamos los días adicionales
  if (evento.isMultiDay && evento.endDate && evento.date) {
    const inicio = new Date(evento.date);
    const fin = new Date(evento.endDate);
    
    // Diferencia en días enteros
    const diferenciaTiempo = fin.getTime() - inicio.getTime();
    const diasTotales = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
    
    if (diasTotales > 1) {
      const diasExtras = diasTotales - 1;
      costoEvento += (diasExtras * plan.costoDiaExtra);
    }
  }

  return acumulado + costoEvento;
}, 0);

// Desglosamos el IVA contenido en los ingresos reales calculados
const gananciaSubtotal = totalIngresosSaaS / 1.16;
const ivaContenido = totalIngresosSaaS - gananciaSubtotal;

// Costos fijos operativos de infraestructura
const domainCost = 450;
const serverCost = 200;

// El total de costos fijos que disminuyen la base distribuible
const totalCostsFijos = domainCost + serverCost;

// Ganancia Neta Real Distribuible = Subtotal neto - Costos fijos operativos
const netProfit = gananciaSubtotal - totalCostsFijos;

// Reparto de dividendos sobre la utilidad neta real
const partner1Share = netProfit * 0.40;   // Socio 1 - 40%
const partner2Share = netProfit * 0.60;   // Socio 2 - 60%

// --- BLOQUE 2: BALANCE DE GANANCIAS (TABLA JUSTIFICADA) ---
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.setTextColor(0, 0, 0);
doc.text("02. ESTADO DE RESULTADOS & PARTICIPACIÓN", 16, 82);

const financialRows = [
  ['Total Ingresos Brutos (Caja Real)', `$${totalIngresosSaaS.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['- Desglose de Impuesto Trasladado (IVA 16%)', `$${ivaContenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['Subtotal Neto Operativo (Base)', `$${gananciaSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['- Costos fijos operativos (Dominio)', `$${domainCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['- Costos fijos operativos (Infraestructura / Servidor)', `$${serverCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['GANANCIA NETA DISTRIBUIBLE', `$${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['Asignación Socio 1 (Distribución 40%)', `$${partner1Share.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ['Asignación Socio 2 (Distribución 60%)', `$${partner2Share.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
];

autoTable(doc, {
  body: financialRows,
  startY: 87,
  margin: { left: 16, right: 16 },
  theme: 'plain',
  styles: {
    font: 'helvetica',
    fontSize: 9,
    cellPadding: 3.5,
    textColor: [45, 55, 72]
  },
  columnStyles: {
    0: { cellWidth: 130 },
    1: { cellWidth: 48, halign: 'right', fontStyle: 'bold' }
  },
  didParseCell: function (data) {
    if (data.row.index === 5) {
      data.cell.styles.fillColor = [26, 32, 44];
      data.cell.styles.textColor = [255, 255, 255];
      data.cell.styles.fontStyle = 'bold';
    }
    if (data.row.index > 5) {
      data.cell.styles.fillColor = [252, 253, 253];
      if (data.column.index === 1) {
        data.cell.styles.textColor = successColor;
      }
    }
  }
});

    // --- BLOQUE 3: DETALLE COMPLETO DE EVENTOS ---
    const nextY = (doc as any).lastAutoTable.finalY + 14;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("03. DESGLOSE INDIVIDUAL DE TRANSACCIONES", 16, nextY);

    const tableData = filteredEvents.map(event => [
      event.eventNumber || '—',
      event.name,
      `${event.user.firstName || ''} ${event.user.lastName || ''}`.trim() || 'Sin nombre',
      format(new Date(event.date), "dd/MM/yyyy"),
      event.activatedAt ? format(new Date(event.activatedAt), "dd/MM/yyyy") : '—',
      event.isActive ? `$${COSTO_POR_EVENTO.toLocaleString('es-MX')}` : '—',
      event.deactivationReason || '—'
    ]);

    autoTable(doc, {
      head: [['Número', 'Evento', 'Organizador', 'Fecha', 'Activación', 'Monto', 'Motivo de Baja']],
      body: tableData,
      startY: nextY + 5,
      margin: { left: 16, right: 16 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: [45, 55, 72]
      },
      headStyles: {
        fillColor: [26, 32, 44], // Encabezado Charcoal
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [252, 253, 253]
      },
      columnStyles: {
        5: { fontStyle: 'bold', halign: 'right' }
      }
    });

    // Paginación y validación institucional al pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 174, 192);
      doc.text("CONFIDENCIAL • EventFlow Superadmin Audit System", 16, 285);
      doc.text(`Pág. ${i} de ${totalPages}`, 194, 285, { align: "right" });
    }

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
  // ==================== NUEVA FUNCIÓN: ARCHIVAR EVENTO ====================
  const archiveEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`¿Archivar el evento "${eventName}"?\nSe descargará un ZIP con toda la información.`)) return;

    try {
      const res = await fetch(`/api/admin/archive/${eventId}`);
      const data = await res.json();

      if (data.success) {
        alert(`✅ Evento "${eventName}" archivado correctamente.`);
        window.location.reload();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error al archivar el evento");
    }
  };
  // =====================================================================
    const deletePermanently = async (eventId: string, eventName: string) => {
    if (!confirm(`¿Eliminar PERMANENTEMENTE "${eventName}" y TODOS sus datos?\nEsta acción es irreversible.`)) return;

    const res = await fetch(`/api/admin/archive/${eventId}/permanent`, {
      method: 'DELETE',
    });

    if (res.ok) {
      alert("Evento eliminado permanentemente.");
      window.location.reload();
    } else {
      alert("Error al eliminar permanentemente");
    }
  }; // <-- Aquí termina tu función deletePermanently limpia

  // 🌟 EL CANDADO DE SEGURIDAD PARA ELIMINAR EL ERROR #418 DE RAÍZ:
  if (!mounted) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-1/4"></div>
        <div className="h-64 bg-slate-50 rounded-2xl"></div>
      </div>
    );
  }

  // Tu return principal con suppressHydrationWarning se queda justo abajo:
  return (
    <div className="space-y-8" suppressHydrationWarning>
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
      <div className="flex gap-3">
            <button 
              onClick={exportFinancialPDF} 
              className="flex items-center gap-3 bg-white text-black px-3 py-3 rounded-2xl hover:bg-gray-100 transition font-medium"
            >
              <Download size={18} /> PDF
            </button>
            <button 
              onClick={exportExcel} 
              className="flex items-center gap-3 bg-white text-black px-3 py-3 rounded-2xl hover:bg-gray-100 transition font-medium"
            >
              <Download size={18} /> Excel
            </button>
          </div>
      
{/* Filtros y Buscador */}
<div className="bg-white rounded-3xl shadow border p-6">
  <div className="flex flex-col lg:flex-row gap-6">
    
   

    {/* Filtros por fecha */}
    <div>
      <h3 className="font-medium text-gray-700 mb-3">Filtrar por fecha del evento:</h3>
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

    {/* Filtros por Estado */}
    <div>
      <h3 className="font-medium text-gray-700 mb-3">Estado:</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-5 py-2.5 rounded-2xl text-sm transition ${
            statusFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-5 py-2.5 rounded-2xl text-sm transition ${
            statusFilter === 'active' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Activos
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className={`px-5 py-2.5 rounded-2xl text-sm transition ${
            statusFilter === 'inactive' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Inactivos
        </button>
        <button
          onClick={() => setStatusFilter("archived")}
          className={`px-5 py-2.5 rounded-2xl text-sm transition ${
            statusFilter === 'archived' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Archivados
        </button>
      </div>
    </div>
    {/* Buscador - Debajo y a todo el ancho */}
  <div className="relative">
    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
    <input
      type="text"
      placeholder="Buscar por evento, organizador, número de evento o fecha..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-11 pr-4 py-3.5 border rounded-2xl text-sm focus:outline-none focus:border-black"
    />
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

                // 🌟 NUEVA LÓGICA DE COLOR: Si está archivado, gana el color gris de congelado
                    const statusColor = event.archived 
                      ? 'bg-zinc-400' 
                      : event.isActive 
                        ? 'bg-emerald-500' 
                        : isOverdue 
                          ? 'bg-red-500' 
                          : 'bg-yellow-500';

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
                    {/* Célula del Estado Corregida */}
                    <td className="p-6">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${statusColor}`}>
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

    {/* Botón ON/OFF - Solo mostrar si NO está archivado */}
    {!event.archived && (
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
    )}

    {/* Botón Eliminar Permanentemente - Solo para eventos archivados */}
    {event.archived && (
      <button
        onClick={() => deletePermanently(event.id, event.name)}
        className="flex items-center justify-center w-9 h-9 text-red-600 hover:bg-red-50 rounded-xl transition"
        title="Eliminar permanentemente"
      >
        <Trash2 size={20} />
      </button>
    )}
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