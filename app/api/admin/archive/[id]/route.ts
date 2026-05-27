// app/api/admin/archive/[id]/route.ts
import { prisma } from "@/lib/prisma";
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

    // Solo Super Admin puede archivar
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo Super Admin puede archivar eventos" }, { status: 403 });
    }

    const { zipBlob, fileName } = await generateEventArchive(id);

    const arrayBuffer = await zipBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      zipUrl: `data:application/zip;base64,${base64}`,
      fileName
    });

  } catch (error: any) {
    console.error("Error generando ZIP:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error al generar archivo ZIP" 
    }, { status: 500 });
  }
}