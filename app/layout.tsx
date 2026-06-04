// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // 🌟 1. Asegúrate de importar tu Footer aquí
import { Toaster } from "sonner";

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
        {/* Usamos flex-col y min-h-screen para que el footer se vaya SIEMPRE al fondo de la pantalla */}
        <body className={`${inter.className} flex flex-col min-h-screen w-full bg-white text-gray-900 antialiased`}>
          <Navbar />
          
          {/* main flex-1 empuja al footer hacia abajo si la página tiene poco contenido */}
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>

          {/* 🌟 2. EL FOOTER VA AQUÍ (ÚNICO Y GLOBAL) */}
          <Footer />

          <Toaster position="top-center" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}