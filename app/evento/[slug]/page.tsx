// app/evento/[slug]/page.tsx
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RegistroForm from "./RegistroForm";

interface Props {
  params: Promise<{ slug: string }>;
}

// 🌟 FUNCIÓN DE METADATOS DINÁMICOS (Se ejecuta en el servidor)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; // Await obligatorio en las últimas versiones de Next.js

  if (!slug) return {};

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return {
        title: "Evento no encontrado | EventFlow",
        description: "El evento que buscas no existe o ha sido finalizado.",
      };
    }

    // URL base de producción para las tarjetas Open Graph
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventflow.com.mx";
    
    // Si en el futuro agregas imagen al modelo, reemplazas el string vacío por event.bannerUrl
    const eventImage = "" || `${baseUrl}/images/default-og-banner.png`;

    return {
      title: `${event.name} | Registro EventFlow`,
      description: `Regístrate para asistir a ${event.name}. Gestionado a través de EventFlow.`,
      
      openGraph: {
        title: event.name,
        description: `Regístrate para asistir a ${event.name}.`,
        url: `${baseUrl}/evento/${slug}`,
        siteName: "EventFlow",
        images: [
          {
            url: eventImage,
            width: 1200,
            height: 630,
            alt: `Tarjeta de registro para ${event.name}`,
          },
        ],
        type: "article",
      },
      
      twitter: {
        card: "summary_large_image",
        title: event.name,
        description: `Regístrate para asistir a ${event.name}.`,
        images: [eventImage],
      },
    };
  } catch (error) {
    console.error("Error al generar metadatos:", error);
    return {
      title: "Registro de Evento | EventFlow",
    };
  }
}

// COMPONENTE   PRINCIPAL
export default async function EventoPublicoPage({ params }: Props) {
  const { slug } = await params;

  if (!slug) notFound();

  const event = await prisma.event.findUnique({
    where: { slug },
  });

  if (!event) notFound();

  // Bloqueo principal
  if (!event.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
    <div className="max-w-2xl mx-auto px-6">
      {/* 🚨 AÑADE ESTO TEMPORALMENTE: */}
      <div className="bg-red-500 text-white text-3xl font-bold p-6 text-center rounded-3xl mb-4">
        ¡SÍ ESTÁ COMPILANDO ESTE ARCHIVO!
      </div>

      <div className="bg-white rounded-3xl shadow-lg border p-10">
        <h1 className="text-4xl font-bold text-center mb-8">{event.name}</h1>
          <p className="text-gray-600 mb-8">
            Este evento aún no ha sido activado.<br />
            Por favor contacta al organizador.
          </p>
          <p className="text-sm text-gray-500">Número de Evento: <strong>{event.eventNumber}</strong></p>
        </div>
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