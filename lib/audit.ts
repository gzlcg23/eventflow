// lib/audit.ts
import { prisma } from "@/lib/prisma";

interface LogOptions {
  action: string;             // Ej: "EVENT_UPDATE", "ATTENDEE_REGISTER"
  entity: "EVENT" | "ATTENDEE" | "USER";
  entityId?: string;          // ID del evento o asistente afectado
  userId?: string;            // ID interno del organizador (de nuestra BDD)
  userEmail?: string;         // Correo de quien hizo la acción
  ipAddress?: string;         // IP del cliente
  details?: string;           // Texto descriptivo de los cambios
}

export async function createAuditLog(options: LogOptions) {
  try {
    // Guardamos de manera persistente en Neon
    const log = await prisma.auditLog.create({
      data: {
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        userId: options.userId || null,
        userEmail: options.userEmail || null,
        ipAddress: options.ipAddress || null,
        details: options.details || null,
      },
    });
    
    // Dejamos un espejo en la consola de Vercel para monitoreo rápido
    console.log(`[AUDIT] [${log.action}] por [${log.userEmail || log.ipAddress}]: ${log.details}`);
    return log;
  } catch (error) {
    // Si por alguna razón la auditoría falla, atrapamos el error para que NO se caiga 
    // la acción principal del usuario (como registrarse o guardar un evento).
    console.error("🚨 Error crítico al escribir en el Log de Auditoría:", error);
  }
}