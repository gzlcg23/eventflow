import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { eventId, isActive, deactivationReason } = await request.json();

    if (!eventId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Verificar el usuario en la base de datos
    const admin = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    // LOG DE SEGURIDAD: Te dirá exactamente en los logs de Vercel qué está leyendo el servidor
    console.log(`🔐 Intento de Toggle por ClerkID: ${clerkUser.id} | Rol DB: ${admin?.role || 'NULL'}`);

    if (admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ 
        error: "Solo Super Admin puede hacer esto",
        debugInfo: { checkedId: clerkUser.id, currentRole: admin?.role || "none" }
      }, { status: 403 });
    }

    const updateData: any = { 
      isActive,
      activatedAt: isActive ? new Date() : null,
      paymentStatus: isActive ? "PAID" : "PENDING",
    };

    if (!isActive && deactivationReason) {
      updateData.deactivationReason = deactivationReason.trim();
    } else if (isActive) {
      // Al activar, limpiamos cualquier motivo de baja previo
      updateData.deactivationReason = null;
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    console.log(`🔄 Evento ${eventId} → ${isActive ? 'ACTIVADO' : 'DESACTIVADO'}`);

    return NextResponse.json({ success: true, event });

  } catch (error: any) {
    console.error("Error toggle-event:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}