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

    // 2. CONFIGURACIÓN DE LA VENTANA DE TIEMPO (60 días / 2 meses de colchón)
    const DIAS_PARA_ARCHIVAR = 60; 
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - DIAS_PARA_ARCHIVAR);

    // 3. OPTIMIZACIÓN: updateMany en una sola query masiva
    const updateResult = await prisma.event.updateMany({
      where: {
        archived: false,
        date: { lt: targetDate } // Agarra cualquier evento de hace más de 2 meses (tanto activos como inactivos)
      },
      data: {
        isActive: false, // Nos aseguramos de apagarlo por seguridad si seguía prendido
        archived: true,
        archivedAt: new Date()
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Mantenimiento al día. No se encontraron eventos de más de ${DIAS_PARA_ARCHIVAR} días para archivar.` 
      });
    }

    // 4. 🌟 ESCRIBIR EL LOG DE AUDITORÍA SIN VIOLAR LA LLAVE FORÁNEA
await createAuditLog({
  action: "SYSTEM_CRON_ARCHIVE",
  entity: "EVENT",
  entityId: "SYSTEM_BULK_ARCHIVE",
  // 🛑 Quitamos 'userId: "system_cron"' para evitar el error P2003 de PostgreSQL
  userId: undefined, // O null si tu función createAuditLog lo requiere de forma explícita
  userEmail: "sistema@eventflow.mx",
  ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
  details: `🤖 [AUTOMÁTICO] Limpieza ejecutada con éxito por el sistema. Se movieron al archivo histórico profundo ${updateResult.count} eventos con más de ${DIAS_PARA_ARCHIVAR} días de antigüedad.`
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