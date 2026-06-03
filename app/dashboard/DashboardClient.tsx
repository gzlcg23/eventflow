// app/dashboard/DashboardClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { Users, CheckCircle, Calendar, TrendingUp, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardClientProps {
  events: any[];
  totalEvents: number;
  totalAttendees: number;
  totalCheckedIn: number;
  attendanceRate: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function DashboardClient({ 
  events, 
  totalEvents: initialTotalEvents, 
  totalAttendees: initialTotalAttendees, 
  totalCheckedIn: initialTotalCheckedIn, 
  attendanceRate: initialAttendanceRate 
}: DashboardClientProps) {

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filtrar eventos por fecha
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && eventDate < start) return false;
      if (end && eventDate > end) return false;
      return true;
    });
  }, [events, startDate, endDate]);

  const totalAttendees = filteredEvents.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);
  const totalCheckedIn = filteredEvents.reduce((sum, e) => 
    sum + (e.attendees?.filter((a: any) => a.status === 'CHECKED_IN').length || 0), 0
  );
  const attendanceRate = totalAttendees > 0 ? Math.round((totalCheckedIn / totalAttendees) * 100) : 0;

  // Datos para gráficos
  const barData = filteredEvents.slice(0, 6).map(event => ({
    name: event.name.length > 12 ? event.name.substring(0, 12) + '...' : event.name,
    registrados: event.attendees?.length || 0,
    checkins: event.attendees?.filter((a: any) => a.status === 'CHECKED_IN').length || 0,
  }));

  const pieData = [
    { name: 'Con Check-in', value: totalCheckedIn, color: '#10b981' },
    { name: 'Sin Check-in', value: totalAttendees - totalCheckedIn, color: '#6b7280' },
  ];

  // Exportar CSV General
  // Exportar PDF General - Versión Minimalista Avanzada (Estilo Red Space / EventFlow)
  const exportAllPDF = () => {
    const { jsPDF } = require('jspdf');
    require('jspdf-autotable');

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // --- ESTILOS TIPOGRÁFICOS GLOBALES ---
    const primaryColor = [26, 32, 44];   // Charcoal (#1a202c)
    const mutedColor = [113, 128, 150];  // Slate Grey (#718096)
    const lightBg = [247, 250, 252];     // Soft Grey (#f7fafc)

    // --- ENCABEZADO EDITORIAL ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(0, 0, 0);
    doc.text("EventFlow", 16, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text("Analytics & Acceso Digital", 16, 30);

    // Meta-datos alineación derecha de forma manual
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Reporte Ejecutivo de Impacto", 194, 20, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Fecha de emisión: ${format(new Date(), "dd/MM/yyyy")}`, 194, 25, { align: "right" });
    doc.text(`Período: ${startDate || 'Todos'} - ${endDate || 'Hoy'}`, 194, 30, { align: "right" });

    // Línea de corte minimalista gruesa (Estilo Brutalista)
    doc.setDrawColor(26, 32, 44);
    doc.setLineWidth(0.6);
    doc.line(16, 36, 194, 36);

    // --- BLOQUES DE RENDIMIENTO (DASHBOARD METRICS) ---
    // Dibujamos un rectángulo gris de fondo para el sumario
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(16, 42, 178, 22, "F");

    // Métricas
    const cols = [
      { num: `${filteredEvents.length}`, label: "Eventos" },
      { num: `${totalAttendees}`, label: "Registrados" },
      { num: `${totalCheckedIn}`, label: "Check-ins" },
      { num: `${attendanceRate}%`, label: "Asistencia" }
    ];

    cols.forEach((col, index) => {
      const startX = 24 + (index * 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(col.num, startX, 52);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(col.label, startX, 58);
    });

    // Subtítulo de sección
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("DESGLOSE ANALÍTICO POR EVENTO", 16, 76);

    let currentY = 82;

    // --- ITERACIÓN DE EVENTOS EN TABLAS MINIMALISTAS ---
    filteredEvents.forEach((event, index) => {
      // Verificar si nos estamos quedando sin espacio abajo en la página actual
      if (currentY > 240) {
        doc.addPage();
        currentY = 24;
      }

      // Banner o barra superior del evento
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(16, currentY, 178, 8, "F");
      
      // Detalle lateral de la barra (borde brutalista izquierdo)
      doc.setFillColor(0, 0, 0);
      doc.rect(16, currentY, 1.5, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`${String(index + 1).padStart(2, '0')}. ${event.name}`, 20, currentY + 5.5);

      const eventDateStr = event.date ? format(new Date(event.date), "dd/MM/yyyy") : '';
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(`Fecha: ${eventDateStr}`, 190, currentY + 5.5, { align: "right" });

      currentY += 12;

      // Estructuramos la data del evento actual
      const tableData = event.attendees.map((a: any) => [
        a.name,
        a.email,
        a.company || '-',
        a.qrCode || '-',
        a.status === 'CHECKED_IN' ? '✓ CHECK-IN' : 'REGISTRADO'
      ]);

      // Render de la tabla usando la API de autoTable de forma limpia
      doc.autoTable({
        body: tableData,
        columns: [
          { header: 'Nombre', dataKey: 'name' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Empresa', dataKey: 'company' },
          { header: 'Código QR', dataKey: 'qr' },
          { header: 'Estatus', dataKey: 'status' }
        ],
        startY: currentY,
        margin: { left: 16, right: 16 },
        theme: 'plain', // Eliminamos cajas pesadas corporativas
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3.5,
          textColor: [45, 55, 72]
        },
        headStyles: {
          fillColor: [26, 32, 44], // Encabezado oscuro plano
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [252, 253, 253] // Zebra striping ultra tenue
        },
        didParseCell: function (data) {
          // Cambiar dinámicamente el estilo del texto si es CHECK-IN para dar relieve visual limpio
          if (data.section === 'body' && data.column.index === 4) {
            if (data.cell.raw === '✓ CHECK-IN') {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [4, 116, 129]; // Color verde azulado de éxito sutil
            } else {
              data.cell.styles.textColor = [113, 128, 150];
            }
          }
        },
        afterPageContent: function (data) {
          // Numeración de páginas integrada
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(160, 174, 192);
          doc.text(`Pág. ${doc.internal.getNumberOfPages()}`, 194, 285, { align: "right" });
        }
      });

      // El siguiente elemento arranca después de donde terminó la tabla
      currentY = doc.lastAutoTable.finalY + 14;
    });

    // Guardar archivo final
    doc.save(`Reporte_Impacto_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

    // ==================== EXPORTAR A EXCEL (.xlsx) ====================
  const exportExcel = () => {
    if (filteredEvents.length === 0) {
      alert("No hay eventos para exportar");
      return;
    }

    const data = filteredEvents.map(event => ({
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
    XLSX.utils.book_append_sheet(wb, ws, "Estadísticas");

    XLSX.writeFile(wb, `Estadísticas_Eventos_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
  };

  return (
    <div className="space-y-10">
      {/* Filtros por fecha 
      <div className="flex flex-wrap gap-4 bg-white border rounded-3xl p-6">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Desde</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded-xl px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Hasta</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded-xl px-4 py-2" />
        </div>
        <button onClick={() => {setStartDate(""); setEndDate("");}} className="self-end text-sm text-gray-500 hover:text-gray-700">
          Limpiar filtros
        </button>
      </div>*/}


      {/* Botones de Exportación - Estilo discreto */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span className="font-medium text-black">Reportes:</span>
        <button onClick={exportAllPDF} className="flex items-center gap-2 hover:text-black transition" title="Exportar PDF">
          <FileText size={18} /> PDF
        </button>
       {/* <button onClick={exportExcel} className="flex items-center gap-2 hover:text-black transition" title="Exportar Excel">
          <Download size={18} /> Excel
        </button>*/}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-3xl p-8">
          <Calendar className="w-10 h-10 text-blue-600 mb-4" />
          <p className="text-5xl font-bold">{filteredEvents.length}</p>
          <p className="text-gray-500 mt-2">Eventos</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <Users className="w-10 h-10 text-purple-600 mb-4" />
          <p className="text-5xl font-bold">{totalAttendees}</p>
          <p className="text-gray-500 mt-2">Registrados</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <CheckCircle className="w-10 h-10 text-emerald-600 mb-4" />
          <p className="text-5xl font-bold text-emerald-600">{totalCheckedIn}</p>
          <p className="text-gray-500 mt-2">Check-ins</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <TrendingUp className="w-10 h-10 text-amber-600 mb-4" />
          <p className="text-5xl font-bold">{attendanceRate}%</p>
          <p className="text-gray-500 mt-2">Asistencia</p>
        </div>
      </div>

{/* Gráfica Horizontal */}
      <div className="bg-white border rounded-3xl p-8">
        <h3 className="text-xl font-semibold mb-6">Asistencia por Evento</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip />
            <Bar dataKey="registrados" fill="#8b5cf6" name="Registrados" />
            <Bar dataKey="checkins" fill="#10b981" name="Check-ins" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}