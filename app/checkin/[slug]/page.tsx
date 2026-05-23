// app/checkin/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import CheckInClient from "./CheckInClient";

export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return <div className="p-12 text-center">Debes iniciar sesión</div>;
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      attendees: true,
      user: true
    }
  });

  if (!event) notFound();

  // Bloqueo si el evento no está activo
  if (!event.isActive) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold mb-4">Evento no activado</h2>
          <p className="text-gray-400 mb-6">
            No olvides mandar tu número de referencia del evento y tu nombre completo en el comprobante de pago <br />
            Número de referencia: <strong>{event.eventNumber}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Verificar propiedad (para usuarios normales)
  if (event.user?.clerkId !== clerkUser.id && clerkUser.id !== "user_3DgiuotoUJ1zzD3qL196YqpHtID") {
    return <div className="p-12 text-center">No tienes acceso a este evento</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
        <p className="text-gray-400 mb-8">Check-in de Asistentes</p>

        <CheckInClient event={event} />
      </div>
    </div>
  );
}