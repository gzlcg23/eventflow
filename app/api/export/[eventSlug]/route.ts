// app/api/export/[eventSlug]/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Papa from 'papaparse';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      attendees: true,
      user: true
    }
  });

  if (!event || event.user?.clerkId !== clerkUser.id) {
    return NextResponse.json({ error: "Evento no encontrado o sin acceso" }, { status: 403 });
  }

  const attendees = event.attendees.map((a: any) => ({
    Nombre: a.name,
    Email: a.email,
    Empresa: a.company || '',
    Teléfono: a.phone || '',
    Código: a.qrCode,
    Estado: a.status === 'CHECKED_IN' ? 'CHECK-IN REALIZADO' : 'Registrado',
    'Fecha Check-in': a.checkedInAt ? new Date(a.checkedInAt).toLocaleString('es-MX') : '',
    'Fecha Registro': new Date(a.createdAt).toLocaleString('es-MX')
  }));

  // Generar CSV
  const csv = Papa.unparse(attendees);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_asistentes.csv"`
    }
  });
}