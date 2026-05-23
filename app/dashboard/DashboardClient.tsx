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
  const exportAllCSV = () => {
    const allData: any[] = [];
    filteredEvents.forEach(event => {
      event.attendees.forEach((a: any) => {
        allData.push({
          Evento: event.name,
          Nombre: a.name,
          Email: a.email,
          Empresa: a.company || '',
          Teléfono: a.phone || '',
          Código: a.qrCode,
          Estado: a.status === 'CHECKED_IN' ? 'CHECK-IN' : 'Registrado',
          'Fecha Check-in': a.checkedInAt ? new Date(a.checkedInAt).toLocaleString('es-MX') : '',
          'Fecha Registro': new Date(a.createdAt).toLocaleString('es-MX')
        });
      });
    });

   
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_General_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

    // Exportar PDF General - Versión corregida
  const exportAllPDF = () => {
    const { jsPDF } = require('jspdf');
    const autoTable = require('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Reporte General de Eventos", 14, 20);

    doc.setFontSize(12);
    doc.text(`Período: ${startDate || 'Todos los eventos'} - ${endDate || 'Hoy'}`, 14, 30);
    doc.text(`Total Eventos: ${filteredEvents.length}`, 14, 38);
    doc.text(`Total Asistentes: ${totalAttendees}`, 14, 46);
    doc.text(`Check-ins: ${totalCheckedIn} (${attendanceRate}%)`, 14, 54);

    let y = 70;

    filteredEvents.forEach((event) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text(event.name, 14, y);
      y += 10;

      const tableData = event.attendees.map((a: any) => [
        a.name,
        a.email,
        a.company || '-',
        a.qrCode,
        a.status === 'CHECKED_IN' ? '✓ CHECK-IN' : 'Pendiente',
        a.checkedInAt ? new Date(a.checkedInAt).toLocaleDateString('es-MX') : '-'
      ]);

      autoTable.default(doc, {
        head: [['Nombre', 'Email', 'Empresa', 'Código', 'Estado', 'Check-in']],
        body: tableData,
        startY: y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] }
      });

      y = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`Reporte_General_${new Date().toISOString().slice(0,10)}.pdf`);
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
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard");

    XLSX.writeFile(wb, `Dashboard_Eventos_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
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


      {/* Botones de Exportación */}
            {/* Botones de Exportación */}
      <div className="flex gap-4 justify-end">
      {/*  <button onClick={exportAllCSV} className="flex items-center gap-3 bg-white border px-6 py-3 rounded-2xl hover:bg-gray-50 transition">
          <Download size={20} /> Exportar CSV General
        </button> */}
        <button onClick={exportAllPDF} className="flex items-center gap-3 bg-white border px-6 py-3 rounded-2xl hover:bg-gray-50 transition">
          <FileText size={20} /> Exportar PDF General
        </button>
        <button onClick={exportExcel} className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition">
          <Download size={20} /> Exportar Excel (.xlsx)
        </button>
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border rounded-3xl p-8">
          <h3 className="text-xl font-semibold mb-6">Asistencia por Evento</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="registrados" fill="#e5e7eb" name="Registrados" />
              <Bar dataKey="checkins" fill="#10b981" name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <h3 className="text-xl font-semibold mb-6">Distribución General</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span>Con Check-in ({totalCheckedIn})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Sin Check-in ({totalAttendees - totalCheckedIn})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Tus Eventos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const total = event.attendees?.length || 0;
            const checkedIn = event.attendees?.filter((a: any) => a.status === 'CHECKED_IN').length || 0;
            const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

            return (
              <Link 
                key={event.id} 
                href={`/checkin/${event.slug}`}
                className="bg-white border rounded-3xl p-6 hover:shadow-xl transition group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-xl group-hover:text-blue-600 transition">{event.name}</h3>
                    <p className="text-sm font-mono text-gray-500">{event.eventNumber}</p>
                  </div>
                  
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${event.isActive 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'}`}>
                    {event.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-4">{event.location}</p>
                
                <div className="flex justify-between text-sm">
                  <span>{total} registrados</span>
                  <span className="text-emerald-600 font-medium">{checkedIn} presentes ({rate}%)</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}