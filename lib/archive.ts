// lib/archive.ts
import JSZip from 'jszip';
import { prisma } from './prisma';

export async function generateEventArchive(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      attendees: true,
      user: true
    }
  });

  if (!event) throw new Error("Evento no encontrado");

  const zip = new JSZip();
  const folder = zip.folder(event.name) || zip;

  // Información general
  const info = {
    nombre: event.name,
    numeroReferencia: event.eventNumber,
    fechaEvento: event.date,
    ubicacion: event.location,
    tipo: event.isPublic ? "Público" : "Privado",
    codigoAcceso: event.accessCode || "N/A",
    totalRegistrados: event.attendees.length,
    checkIns: event.attendees.filter(a => a.status === 'CHECKED_IN').length,
    fechaCreacion: event.createdAt,
    fechaArchivo: new Date().toISOString()
  };

  folder.file("informacion.json", JSON.stringify(info, null, 2));

  // Lista de asistentes en CSV
  const csvRows = event.attendees.map(a => ({
    Nombre: a.name,
    Email: a.email,
    Empresa: a.company || '',
    Teléfono: a.phone || '',
    QR: a.qrCode,
    Estado: a.status,
    FechaCheckIn: a.checkedInAt ? a.checkedInAt.toISOString() : '',
    FechaRegistro: a.createdAt.toISOString()
  }));

  const csvContent = "data:text/csv;charset=utf-8," +
    Object.keys(csvRows[0]).join(",") + "\n" +
    csvRows.map(row => Object.values(row).join(",")).join("\n");

  folder.file("asistentes.csv", csvContent);

  // Generar ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  
  return {
    zipBlob,
    fileName: `${event.name.replace(/[^a-z0-9]/gi, '_')}_archivo_completo.zip`
  };
}