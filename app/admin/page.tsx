// app/admin/page.tsx
export const dynamic = 'force-dynamic'; // 🌟 Fuerza a Next.js a leer Neon en tiempo real en cada recarga

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export default async function AdminPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  if (user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const allEvents = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      eventNumber: true,
      date: true,
      isPublic: true,
      isActive: true,
      archived: true,
      activatedAt: true,
      deactivationReason: true,
      createdAt: true,
      paymentAmount: true, // 🌟 SOLUCIÓN 1: Traemos el monto real de la base de datos
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

 return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Super Admin Panel</h1>
        <p className="text-gray-600 mt-2">Control total de eventos y pagos</p>
      </div>

      {/* 🌟 Pasamos los eventos ya limpios y con sus números reales al Cliente */}
      <SuperAdminClient events={sanitizedEvents} />
    </div>
  );
}