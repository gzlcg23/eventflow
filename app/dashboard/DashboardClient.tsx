// app/dashboard/DashboardClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { Users, CheckCircle, Calendar, TrendingUp, Download, FileText } from 'lucide-react';
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

  // Nuevos conteos
  const activeEventsCount = filteredEvents.filter(e => e.isActive).length;
  const inactiveEventsCount = filteredEvents.filter(e => !e.isActive).length;
  const finishedEventsCount = filteredEvents.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate < new Date();
  }).length;

  // Gráfica horizontal de asistencia
  const barData = filteredEvents.slice(0, 8).map(event => ({
    name: event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name,
    registrados: event.attendees?.length || 0,
    checkins: event.attendees?.filter((a: any) => a.status === 'CHECKED_IN').length || 0,
  }));

  const pieData = [
    { name: 'Con Check-in', value: totalCheckedIn, color: '#10b981' },
    { name: 'Sin Check-in', value: totalAttendees - totalCheckedIn, color: '#6b7280' },
  ];

  // Exportar Excel (estilo discreto)
  const exportExcel = () => {
    if (filteredEvents.length === 0) {
      alert("No hay eventos para exportar");
      return;
    }

    const data = filteredEvents.map(event => ({
      "Número": event.eventNumber || '',
      "Evento": event.name,
      "Fecha": event.date ? format(new Date(event.date), "dd/MM/yyyy") : '',
      "Estado": event.isActive ? "Activo" : "Inactivo",
      "Registrados": event.attendees?.length || 0,
      "Check-ins": event.attendees?.filter((a: any) => a.status === 'CHECKED_IN').length || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard");

    XLSX.writeFile(wb, `Dashboard_Eventos_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`);
  };

  // Exportar PDF
  const exportAllPDF = () => {
    const { jsPDF } = require('jspdf');
    const autoTable = require('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Reporte General de Eventos", 14, 20);

    doc.setFontSize(12);
    doc.text(`Período: ${startDate || 'Todos los eventos'} - ${endDate || 'Hoy'}`, 14, 30);
    doc.text(`Total Eventos: ${filteredEvents.length}`, 14, 38);
    doc.text(`Eventos Activos: ${activeEventsCount}`, 14, 46);
    doc.text(`Eventos Finalizados: ${finishedEventsCount}`, 14, 54);

    doc.save(`Reporte_General_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="space-y-10">
      {/* Mensaje de Bienvenida Personalizado */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8">
        <h2 className="text-3xl font-bold">¡Bienvenido de nuevo!</h2>
        <p className="text-emerald-100 mt-2">Aquí tienes un resumen de tu actividad reciente.</p>
      </div>

      {/* Botones de Exportación - Estilo discreto */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span className="font-medium text-black">Reportes:</span>
        <button onClick={exportAllPDF} className="flex items-center gap-2 hover:text-black transition" title="Exportar PDF">
          <FileText size={18} /> PDF
        </button>
        <button onClick={exportExcel} className="flex items-center gap-2 hover:text-black transition" title="Exportar Excel">
          <Download size={18} /> Excel
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-3xl p-8">
          <Calendar className="w-10 h-10 text-blue-600 mb-4" />
          <p className="text-5xl font-bold">{filteredEvents.length}</p>
          <p className="text-gray-500 mt-2">Total Eventos</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <span className="text-emerald-600 text-5xl font-bold">●</span>
          <p className="text-5xl font-bold mt-2">{activeEventsCount}</p>
          <p className="text-gray-500 mt-2">Eventos Activos</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <span className="text-red-600 text-5xl font-bold">●</span>
          <p className="text-5xl font-bold mt-2">{finishedEventsCount}</p>
          <p className="text-gray-500 mt-2">Eventos Finalizados</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <span className="text-amber-600 text-5xl font-bold">●</span>
          <p className="text-5xl font-bold mt-2">{inactiveEventsCount}</p>
          <p className="text-gray-500 mt-2">Eventos Inactivos</p>
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
            <Bar dataKey="registrados" fill="#e5e7eb" name="Registrados" />
            <Bar dataKey="checkins" fill="#10b981" name="Check-ins" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
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
  );
}