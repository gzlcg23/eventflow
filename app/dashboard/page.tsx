// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // Consulta más flexible
    const events = await prisma.event.findMany({
    where: { 
      user: {
        clerkId: clerkUser.id
      },
      // isArchived ya no existe, usamos isActive
    },
    include: {
      attendees: true,
      user: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Estadísticas generales
  const totalEvents = events.length;
  const totalAttendees = events.reduce((sum, event) => sum + (event.attendees?.length || 0), 0);
  const totalCheckedIn = events.reduce((sum, event) => 
    sum + (event.attendees?.filter((a: any) => a.status === 'CHECKED_IN').length || 0), 0
  );

  const attendanceRate = totalAttendees > 0 
    ? Math.round((totalCheckedIn / totalAttendees) * 100) 
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl font-bold mb-2">Estadísticas</h1>
        <p className="text-gray-500 text-xl">Resumen general de tus eventos</p>
      </div>

      <DashboardClient 
        events={events}
        totalEvents={totalEvents}
        totalAttendees={totalAttendees}
        totalCheckedIn={totalCheckedIn}
        attendanceRate={attendanceRate}
      />
    </div>
  );
}