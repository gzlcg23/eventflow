// app/evento/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RegistroForm from "./RegistroForm";

export default async function EventoPublicoPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;

  if (!slug) notFound();

  const event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event) notFound();

  // Bloqueo principal
  if (!event.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg border p-12 max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Evento no disponible</h1>
          <p className="text-gray-600 mb-8">
            Este evento aún no ha sido activado.<br />
            Por favor contacta al organizador.
          </p>
          <p className="text-sm text-gray-500">Número de Evento: <strong>{event.eventNumber}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-lg border p-10">
          <h1 className="text-4xl font-bold text-center mb-8">{event.name}</h1>
          <RegistroForm 
            eventId={event.id} 
            eventName={event.name}
            isPublic={event.isPublic}
            accessCode={event.accessCode}
          />
        </div>
      </div>
    </div>
  );
}