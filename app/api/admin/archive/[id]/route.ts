// app/api/admin/archive/[id]/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateEventArchive } from "@/lib/archive";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos de Super Admin
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo Super Admin puede archivar eventos" }, { status: 403 });
    }

    // 🔍 AUDITORÍA PREVIA: Verificar si el evento existe y qué tiene antes de llamar a la librería
    const eventCheck = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: true // Esto nos dice cuántas relaciones (asistentes/registros) tiene
      }
    });

    console.log(`📦 Solicitando ZIP para Evento ID: ${id}. Encontrado: ${!!eventCheck}`, eventCheck?._count);

    if (!eventCheck) {
      return NextResponse.json({ success: false, error: "El evento no existe en la base de datos" }, { status: 404 });
    }

    // Ejecutar la generación del archivo comprimido
    const { zipBlob, fileName } = await generateEventArchive(id);

    const arrayBuffer = await zipBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      zipUrl: `data:application/zip;base64,${base64}`,
      fileName
    });

  } catch (error: any) {
    // 🚨 LOG ULTRA DETALLADO PARA VER EN VERCEL RUNTIME LOGS:
    console.error("❌ ERROR CRÍTICO GENERANDO ZIP:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    return NextResponse.json({ 
      success: false, 
      error: `Error interno en el servidor: ${error.message || "Error al procesar el archivo"}` 
    }, { status: 500 });
  }
}