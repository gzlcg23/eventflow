// app/checkin/[slug]/CheckInClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Check, Search, Users, Clock, Download, FileText, QrCode, UserCheck, X, Share2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, differenceInDays } from 'date-fns';

interface Attendee {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  qrCode: string;
  status: string;
  checkedInAt?: Date;
  createdAt: Date;
}

interface CheckInClientProps {
  event: any;
}

export default function CheckInClient({ event }: CheckInClientProps) {
  const [attendees, setAttendees] = useState<Attendee[]>(event.attendees || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredAttendees = attendees.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedInCount = attendees.filter(a => a.status === 'CHECKED_IN').length;
  const totalAttendees = attendees.length;
  const notCheckedInCount = totalAttendees - checkedInCount;

  // Verificar si el evento ya finalizó (1 día después)
  const eventDate = new Date(event.date);
  const isEventFinished = differenceInDays(new Date(), eventDate) > 1;

  // ==================== EXPORTAR EXCEL ====================
  const exportExcel = () => {
    if (attendees.length === 0) {
      alert("No hay asistentes para exportar");
      return;
    }

    const data = attendees.map((a: any) => ({
      "Código QR": a.qrCode,
      "Nombre": a.name,
      "Email": a.email,
      "Empresa": a.company || '',
      "Teléfono": a.phone || '',
      "Estado": a.status === 'CHECKED_IN' ? "CHECK-IN REALIZADO" : "Registrado",
      "Fecha Check-in": a.checkedInAt ? format(new Date(a.checkedInAt), "dd/MM/yyyy HH:mm") : '',
      "Fecha Registro": format(new Date(a.createdAt), "dd/MM/yyyy HH:mm")
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asistentes");

    XLSX.writeFile(wb, `${event.name.replace(/[^a-z0-9]/gi, '_')}_asistentes_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  // ==================== EXPORTAR PDF (DISEÑO MINIMALISTA PREMIUM) ====================
  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // --- CONFIGURACIÓN DE COLORES DE MARCA ---
    const primaryColor = [26, 32, 44];   // Charcoal (#1a202c)
    const mutedColor = [113, 128, 150];  // Slate Grey (#718096)
    const lightBg = [247, 250, 252];     // Soft Grey (#f7fafc)
    const successColor = [4, 116, 129];  // Deep Teal para check-ins

    // --- ENCABEZADO EDITORIAL ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text("EventFlow", 16, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text("Reporte Técnico de Accesos y Check-in", 16, 29);

    // Meta-datos del reporte a la derecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Control de Asistencia Individual", 194, 20, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 194, 25, { align: "right" });

    // Línea divisoria brutalista
    doc.setDrawColor(26, 32, 44);
    doc.setLineWidth(0.6);
    doc.line(16, 34, 194, 34);

    // --- BLOQUE INFORMATIVO DEL EVENTO ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(event.name.toUpperCase(), 16, 44);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const eventDateStr = event.date ? format(new Date(event.date), "dd/MM/yyyy") : '-';
    doc.text(`Fecha del Evento: ${eventDateStr}`, 16, 49);

    // --- CONTENEDOR DE MÉTRICAS RÁPIDAS ---
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(16, 56, 178, 20, "F");

    const attendanceRate = Math.round((checkedInCount / totalAttendees) * 100) || 0;
    const stats = [
      { value: `${totalAttendees}`, label: "Registrados" },
      { value: `${checkedInCount}`, label: "Check-ins" },
      { value: `${notCheckedInCount}`, label: "Faltantes" },
      { value: `${attendanceRate}%`, label: "Efectividad" }
    ];

    stats.forEach((stat, index) => {
      const startX = 26 + (index * 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(stat.value, startX, 65);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.text(stat.label, startX, 70);
    });

    // --- TABLA DE ASISTENTES ---
    const tableColumn = ['Nombre Asistente', 'Email', 'Empresa / Organización', 'Código QR', 'Estatus', 'Hora de Entrada'];
    const tableRows = attendees.map((a: any) => [
      a.name,
      a.email,
      a.company || '-',
      a.qrCode,
      a.status === 'CHECKED_IN' ? '✓ CHECK-IN' : 'PENDIENTE',
      a.checkedInAt ? format(new Date(a.checkedInAt), "dd/MM/yyyy HH:mm") : '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 84,
      margin: { left: 16, right: 16 },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3.5,
        textColor: [45, 55, 72]
      },
      headStyles: {
        fillColor: [26, 32, 44],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [252, 253, 253]
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === '✓ CHECK-IN') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = successColor;
          } else {
            data.cell.styles.textColor = mutedColor;
          }
        }
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 174, 192);
      doc.text("EventFlow Platform • Reporte Verificado", 16, 285);
      doc.text(`Pág. ${i} de ${totalPages}`, 194, 285, { align: "right" });
    }

    doc.save(`${event.name.replace(/[^a-z0-9]/gi, '_')}_asistentes.pdf`);
  };

  // ==================== PROCESAR CHECK-IN ====================
  const handleCheckIn = async (qrCode: string) => {
    if (isEventFinished) {
      setMessage({ type: 'error', text: "Este evento ya finalizó. No se pueden hacer más check-ins." });
      return;
    }

    try {
      // 🌟 CORREGIDO: Apuntando a la ruta física real de tu API de Check-In corporativa
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, eventId: event.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAttendees(prev => prev.map(a => 
          a.qrCode === qrCode 
            ? { ...a, status: 'CHECKED_IN', checkedInAt: new Date() } 
            : a
        ));
        setMessage({ type: 'success', text: `✅ Check-in exitoso: ${data.attendee.name}` });
      } else {
        // Muestra el error estructurado del backend (ej: "⚠️ ¡ALERTA DE PLAGIO! Este pase ya ingresó...")
        setMessage({ type: 'error', text: data.error || "No se pudo procesar el acceso" });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Error de red al procesar check-in" });
    }
  };

  const shareEvent = () => {
    const link = `${window.location.origin}/evento/${event.slug}`;
    const text = event.isPublic 
      ? `Únete a mi evento: ${event.name}\n${link}`
      : `Únete a mi evento privado: ${event.name}\nCódigo de acceso: ${event.accessCode}\n${link}`;

    if (navigator.share) {
      navigator.share({ title: event.name, text });
    } else {
      navigator.clipboard.writeText(text);
      alert("✅ Enlace copiado.");
    }
  };

  // Escáner QR
  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner("qr-scanner", {
      fps: 8,
      qrbox: { width: 280, height: 280 },
    }, false);

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanning(false);

        const qrCode = decodedText.split('/').pop();

        if (qrCode) {
          await handleCheckIn(qrCode);
        } else {
          setMessage({ type: 'error', text: "Código QR inválido" });
        }

        setTimeout(() => setScanning(true), 1800);
      },
      () => {}
    );

    return () => scanner.clear();
  }, [scanning, attendees]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        {!isEventFinished && (
          <button
            onClick={shareEvent}
            className="flex items-center gap-2 bg-white border border-gray-300 text-black px-5 py-3 rounded-2xl hover:bg-gray-50 transition"
            title="Compartir evento"
          >
            <Share2 size={20} />
            Compartir
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 p-6 rounded-3xl">
          <Users className="w-8 h-8 mb-3 text-blue-400" />
          <p className="text-4xl font-bold">{totalAttendees}</p>
          <p className="text-gray-400">Registrados</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl">
          <Check className="w-8 h-8 mb-3 text-emerald-400" />
          <p className="text-4xl font-bold text-emerald-400">{checkedInCount}</p>
          <p className="text-gray-400">Check-in realizados</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl">
          <X className="w-8 h-8 mb-3 text-red-400" />
          <p className="text-4xl font-bold text-red-400">{notCheckedInCount}</p>
          <p className="text-gray-400">Sin Check-in</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl">
          <Clock className="w-8 h-8 mb-3 text-amber-400" />
          <p className="text-4xl font-bold">{Math.round((checkedInCount / totalAttendees) * 100) || 0}%</p>
          <p className="text-gray-400">Asistencia</p>
        </div>
      </div>

      {/* Botón Escanear QR */}
      <button
        onClick={() => setScanning(!scanning)}
        disabled={isEventFinished}
        className={`w-full py-5 rounded-3xl font-medium text-lg flex items-center justify-center gap-3 transition ${isEventFinished ? 'bg-gray-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        <QrCode size={26} />
        {isEventFinished ? "Evento Finalizado - No se puede escanear" : (scanning ? "Detener Escáner" : "Escanear QR")}
      </button>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o código único..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 pl-12 py-4 rounded-3xl focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Sección de Reportes */}
      <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-zinc-800 pt-6">
        <span className="font-medium text-white whitespace-nowrap">Reportes:</span>
        <button onClick={exportExcel} className="flex items-center gap-2 hover:text-white transition" title="Descargar Excel">
          <Download size={18} /> Excel
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 hover:text-white transition" title="Descargar PDF">
          <FileText size={18} /> PDF
        </button>
      </div>

      {scanning && (
        <div className="bg-black p-8 rounded-3xl">
          <div id="qr-scanner" className="mx-auto max-w-[320px]"></div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-2xl ${message.type === 'success' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Lista de Asistentes */}
      <div className="bg-zinc-900 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-semibold">Asistentes ({filteredAttendees.length})</h3>
          <span className="text-sm text-gray-400">Check-in Manual</span>
        </div>

        <div className="divide-y divide-zinc-800 max-h-[600px] overflow-auto">
          {filteredAttendees.map((attendee) => (
            <div key={attendee.id} className="p-6 flex items-center justify-between hover:bg-zinc-800/50">
              <div>
                <p className="font-medium">{attendee.name}</p>
                <p className="text-sm text-gray-400">{attendee.email}</p>
              </div>

              <div>
                {attendee.status === 'CHECKED_IN' ? (
                  <div className="text-emerald-500">
                    <Check size={28} />
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckIn(attendee.qrCode)}
                    disabled={isEventFinished}
                    className={`flex items-center justify-center w-11 h-11 rounded-xl transition ${isEventFinished ? 'text-gray-500 cursor-not-allowed' : 'text-amber-500 hover:bg-amber-500/10'}`}
                    title="Hacer Check-in Manual"
                  >
                    <UserCheck size={26} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}