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

  // 🌟 Protección total: Aseguramos que attendees siempre sea un arreglo
  const attendeesList = event.attendees ?? [];

  // Información general
  const info = {
    nombre: event.name,
    numeroReferencia: event.eventNumber,
    fechaEvento: event.date,
    ubicacion: event.location || "No especificada", // Salvavidas si viene nulo
    tipo: event.isPublic ? "Público" : "Privado",
    codigoAcceso: event.accessCode || "N/A",
    totalRegistrados: attendeesList.length,
    checkIns: attendeesList.filter(a => a.status === 'CHECKED_IN').length,
    fechaCreacion: event.createdAt,
    fechaArchivo: new Date().toISOString()
  };

  folder.file("informacion.json", JSON.stringify(info, null, 2));

  // Lista de asistentes en CSV
  const csvRows = attendeesList.map(a => ({
    Nombre: a.name || '',
    Email: a.email || '',
    Empresa: a.company || '',
    "Teléfono": a.phone || '',
    QR: a.qrCode || '',
    Estado: a.status || '',
    "FechaCheckIn": a.checkedInAt ? new Date(a.checkedInAt).toISOString() : '',
    FechaRegistro: a.createdAt ? new Date(a.createdAt).toISOString() : ''
  }));

  // 🌟 REGLA DE ORO: Cabeceras fijas para evitar leer la posición [0] si el arreglo está vacío
  const headers = ["Nombre", "Email", "Empresa", "Teléfono", "QR", "Estado", "FechaCheckIn", "FechaRegistro"];
  
  // Construcción del contenido del CSV de forma 100% segura
  const csvHeadersLine = headers.join(",");
  const csvBodyLines = csvRows.map(row => Object.values(row).join(",")).join("\n");
  const csvContent = csvBodyLines ? `${csvHeadersLine}\n${csvBodyLines}` : csvHeadersLine;

  folder.file("asistentes.csv", csvContent);

  // Generar ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  
  return {
    zipBlob,
    fileName: `${event.name.replace(/[^a-z0-9]/gi, '_')}_archivo_completo.zip`
  };
}