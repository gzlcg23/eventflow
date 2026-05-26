// app/api/cron/archive-events/route.ts
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. PROTECCIÓN DE SEGURIDAD (Recomendado por Vercel)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 2. OPTIMIZACIÓN: updateMany en una sola query
    const updateResult = await prisma.event.updateMany({
      where: {
        isActive: false,
        archived: false,
        date: { lt: sixtyDaysAgo }
      },
      data: {
        archived: true,
        archivedAt: new Date()
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ message: "No hay eventos para archivar" });
    }

    console.log(`📦 Se archivaron automáticamente ${updateResult.count} eventos.`);

    return NextResponse.json({ 
      success: true, 
      archivedCount: updateResult.count 
    });

  } catch (error) {
    console.error("Error en archivado automático:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}