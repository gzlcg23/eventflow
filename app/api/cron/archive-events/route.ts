// app/api/cron/archive-events/route.ts
import { prisma } from "@/lib/prisma"; // 🌟 Simplificado con tu alias limpio
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit"; // 🌟 Traemos el motor de auditoría

export async function GET(request: Request) {
  try {
    // 1. PROTECCIÓN DE SEGURIDAD (Recomendado por Vercel)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Blindaje: Solo exigir el token si estamos en producción (así puedes testear en local libremente)
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Calcular la ventana de tiempo (Hace 60 días)
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
      return NextResponse.json({ success: true, message: "No hay eventos viejos para archivar en este ciclo." });
    }

    // 3. 🌟 ESCRIBIR EL LOG DE AUDITORÍA CON LA FIRMA DEL SISTEMA
    await createAuditLog({
      action: "SYSTEM_CRON_ARCHIVE",
      entity: "EVENT",
      entityId: "SYSTEM_BULK_ARCHIVE",
      userId: "system_cron", // El bot del sistema firma la acción
      userEmail: "sistema@eventflow.mx",
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Limpieza automatizada ejecutada con éxito. Se movieron al archivo histórico profundo ${updateResult.count} eventos con más de 60 días de antigüedad.`
    });

    console.log(`📦 Se archivaron automáticamente ${updateResult.count} eventos.`);

    return NextResponse.json({ 
      success: true, 
      archivedCount: updateResult.count 
    });

  } catch (error: any) {
    console.error("❌ Error crítico en archivado automático:", error);
    return NextResponse.json({ 
      error: "Ocurrió un error interno al intentar procesar el archivado automático." 
    }, { status: 500 });
  }
}