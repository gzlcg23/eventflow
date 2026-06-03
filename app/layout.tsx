// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar"; // Conservamos tu barra actual

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventFlow",
  description: "Gestión inteligente de eventos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" className="h-full">
        {/* 'flex flex-col min-h-screen' hace que el cuerpo de la app sea flexible */}
        <body className={`${inter.className} flex flex-col min-h-screen bg-white text-gray-900 antialiased`}>
          <Navbar />
          {/* El contenedor principal crece automáticamente ocupando el espacio disponible (flex-1) */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}