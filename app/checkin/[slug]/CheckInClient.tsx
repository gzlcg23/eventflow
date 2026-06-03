// app/checkin/[slug]/CheckInClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Check, Search, Users, Clock, Download, FileText, QrCode, UserCheck, X, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

  // ==================== EXPORTAR PDF ====================
  const exportPDF = () => {
    const { jsPDF } = require('jspdf');
    const autoTable = require('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Evento: ${event.name}`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date(event.date).toLocaleDateString('es-MX')}`, 14, 30);
    doc.text(`Total registrados: ${totalAttendees}`, 14, 38);
    doc.text(`Check-in realizados: ${checkedInCount} (${Math.round((checkedInCount / totalAttendees) * 100) || 0}%)`, 14, 46);
    doc.text(`Sin Check-in: ${notCheckedInCount}`, 14, 54);

    const tableColumn = ['Nombre', 'Email', 'Empresa', 'Código QR', 'Estado', 'Check-in'];
    const tableRows = attendees.map(a => [
      a.name,
      a.email,
      a.company || '-',
      a.qrCode,
      a.status === 'CHECKED_IN' ? '✓ CHECK-IN' : 'Pendiente',
      a.checkedInAt ? new Date(a.checkedInAt).toLocaleString('es-MX') : '-'
    ]);

    autoTable.default(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`${event.name.replace(/[^a-z0-9]/gi, '_')}_asistentes.pdf`);
  };

  const handleCheckIn = async (qrCode: string) => { // 🌟 Ahora recibe el código QR
    if (isEventFinished) {
      setMessage({ type: 'error', text: "Este evento ya finalizó. No se pueden hacer más check-ins." });
      return;
    }

    try {
      // 🌟 Apuntamos a la nueva API pasándole el código QR y el ID del Evento
      const res = await fetch('/api/registro/checkin', {
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
        // Muestra el error estructurado de la API (ej: Si el pase ya fue usado)
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

        // Extraemos el código único del QR de la URL decodificada
        const qrCode = decodedText.split('/').pop();

        if (qrCode) {
          // 🌟 Disparamos directo a la API usando el código QR
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
      {/* Título del Evento + Botón Compartir */}
      <div className="flex justify-between items-start">

        {/* Botón Compartir - Solo visible si el evento NO ha finalizado */}
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

      {/* Botón Escanear QR - Más grande */}
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

      {/* Escáner */}
      {scanning && (
        <div className="bg-black p-8 rounded-3xl">
          <div id="qr-scanner" className="mx-auto max-w-[320px]"></div>
        </div>
      )}

      {/* Mensaje */}
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