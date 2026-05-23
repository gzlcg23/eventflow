// app/api/admin/toggle-event/route.ts
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { eventId, isActive, deactivationReason } = await request.json();

    if (!eventId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Verificar que sea Super Admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo Super Admin puede hacer esto" }, { status: 403 });
    }

    const updateData: any = { 
      isActive,
      activatedAt: isActive ? new Date() : null,
      paymentStatus: isActive ? "PAID" : "PENDING",
    };

    // Si se está desactivando, guardar la razón
    if (!isActive && deactivationReason) {
      updateData.deactivationReason = deactivationReason.trim();
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    console.log(`🔄 Evento ${eventId} → ${isActive ? 'ACTIVADO' : 'DESACTIVADO'} | Razón: ${deactivationReason || 'N/A'}`);

    return NextResponse.json({ success: true, event });

  } catch (error: any) {
    console.error("Error toggle-event:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}